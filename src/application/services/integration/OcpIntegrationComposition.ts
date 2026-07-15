/**
 * - Purpose: compose OCP projections, Use Cases, and bridge services for bootstrap.
 * - Inputs: OcpGateway + domain event bus + reasons cache + notification presenter.
 * - Outputs: disposed as a unit on shutdown; exposes hub/use cases for Facade.
 */

import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpNotificationPresenter } from "@ports/integration/OcpNotificationPresenter.js";
import type { OcpProxyAuthenticatePort } from "@ports/integration/OcpProxyAuthenticatePort.js";
import type { OcpReasonsCachePort } from "@ports/integration/OcpReasonsCachePort.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import { InMemoryDndReadModel } from "../../read-models/InMemoryDndReadModel.js";
import { ChangeOperatorStatusUseCase } from "../../use-cases/integration/ocp/ChangeOperatorStatusUseCase.js";
import { ReservePostCallStatusUseCase } from "../../use-cases/integration/ocp/ReservePostCallStatusUseCase.js";
import { ConnectOcpUseCase } from "../../use-cases/integration/ocp/ConnectOcpUseCase.js";
import { DisconnectOcpUseCase } from "../../use-cases/integration/ocp/DisconnectOcpUseCase.js";
import { LogoutOperatorUseCase } from "../../use-cases/integration/ocp/LogoutOperatorUseCase.js";
import { AcceptCampaignUseCase } from "../../use-cases/integration/ocp/AcceptCampaignUseCase.js";
import { RejectCampaignUseCase } from "../../use-cases/integration/ocp/RejectCampaignUseCase.js";
import type { AuthorizeSipAccountUseCase } from "../../use-cases/settings/AuthorizeSipAccountUseCase.js";
import type { RegisterAccountUseCase } from "../../use-cases/settings/RegisterAccountUseCase.js";
import { OcpAuthenticateAndConnectService } from "./OcpAuthenticateAndConnectService.js";
import { OcpTelephonyBridgeService } from "./OcpTelephonyBridgeService.js";
import { OcpDndBridgeService } from "./OcpDndBridgeService.js";
import { OcpNotificationService } from "./OcpNotificationService.js";
import { OcpSipCredentialService } from "./OcpSipCredentialService.js";
import { OcpSessionLifecycleService } from "./OcpSessionLifecycleService.js";
import { OcpSipCascadeBridgeService } from "./OcpSipCascadeBridgeService.js";

export type OcpIntegrationCompositionDeps = Readonly<{
  ocpGateway: OcpGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  reasonsCache: OcpReasonsCachePort;
  notificationPresenter: OcpNotificationPresenter;
  proxyAuthenticate: OcpProxyAuthenticatePort;
  authorizeSipAccount: AuthorizeSipAccountUseCase;
  registerAccount: RegisterAccountUseCase;
  isSipRegistered: () => boolean;
  endUserSession: (correlationId: CorrelationId) => Promise<void>;
  initialDndEnabled?: boolean;
}>;

export class OcpIntegrationComposition {
  readonly projectionHub: OcpProjectionHub;
  readonly dndReadModel: InMemoryDndReadModel;
  readonly connectOcp: ConnectOcpUseCase;
  readonly disconnectOcp: DisconnectOcpUseCase;
  readonly changeOperatorStatus: ChangeOperatorStatusUseCase;
  readonly reservePostCallStatus: ReservePostCallStatusUseCase;
  readonly logoutOperator: LogoutOperatorUseCase;
  readonly acceptCampaign: AcceptCampaignUseCase;
  readonly rejectCampaign: RejectCampaignUseCase;
  readonly notificationPresenter: OcpNotificationPresenter;
  readonly authenticateAndConnect: OcpAuthenticateAndConnectService;

  private readonly telephonyBridge: OcpTelephonyBridgeService;
  private readonly dndBridge: OcpDndBridgeService;
  private readonly notificationService: OcpNotificationService;
  private readonly sipCredentialService: OcpSipCredentialService;
  private readonly sessionLifecycle: OcpSessionLifecycleService;
  private readonly sipCascadeBridge: OcpSipCascadeBridgeService;
  private readonly ocpGateway: OcpGateway;
  private disposed = false;

  constructor(deps: OcpIntegrationCompositionDeps) {
    this.ocpGateway = deps.ocpGateway;
    this.notificationPresenter = deps.notificationPresenter;

    this.projectionHub = new OcpProjectionHub({
      ocpGateway: deps.ocpGateway,
      reasonsCache: deps.reasonsCache,
    });
    this.dndReadModel = new InMemoryDndReadModel(
      deps.eventPublisher,
      deps.initialDndEnabled === true,
    );

    const isOcpAuthenticated = (): boolean =>
      this.projectionHub.getSessionProjection().isAuthenticated;

    this.connectOcp = new ConnectOcpUseCase(deps.ocpGateway, deps.logger);
    this.disconnectOcp = new DisconnectOcpUseCase(deps.ocpGateway, deps.logger);
    this.authenticateAndConnect = new OcpAuthenticateAndConnectService({
      proxyAuthenticate: deps.proxyAuthenticate,
      connectOcp: this.connectOcp,
      disconnectOcp: this.disconnectOcp,
      ocpGateway: deps.ocpGateway,
      projectionHub: this.projectionHub,
      logger: deps.logger,
    });
    this.changeOperatorStatus = new ChangeOperatorStatusUseCase({
      ocpGateway: deps.ocpGateway,
      operatorReadModel: this.projectionHub,
      dndReadModel: this.dndReadModel,
      logger: deps.logger,
      eventPublisher: deps.eventPublisher,
      reservedStatusWriter: {
        setReservedStatus: (reservedStatus, reservedReasonId) => {
          this.projectionHub.setReservedStatus(reservedStatus, reservedReasonId);
        },
      },
    });
    this.reservePostCallStatus = new ReservePostCallStatusUseCase({
      ocpGateway: deps.ocpGateway,
      eventPublisher: deps.eventPublisher,
      logger: deps.logger,
    });
    this.logoutOperator = new LogoutOperatorUseCase({
      ocpGateway: deps.ocpGateway,
      operatorReadModel: this.projectionHub,
      eventPublisher: deps.eventPublisher,
      logger: deps.logger,
    });
    this.acceptCampaign = new AcceptCampaignUseCase(deps.ocpGateway, deps.logger);
    this.rejectCampaign = new RejectCampaignUseCase(deps.ocpGateway, deps.logger);

    this.telephonyBridge = new OcpTelephonyBridgeService({
      eventPublisher: deps.eventPublisher,
      ocpGateway: deps.ocpGateway,
      isOcpAuthenticated,
      logger: deps.logger,
    });
    this.dndBridge = new OcpDndBridgeService({
      eventPublisher: deps.eventPublisher,
      operatorReadModel: this.projectionHub,
      isOcpAuthenticated,
      changeOperatorStatus: this.changeOperatorStatus,
      reservePostCallStatus: this.reservePostCallStatus,
      logger: deps.logger,
    });
    this.notificationService = new OcpNotificationService({
      ocpGateway: deps.ocpGateway,
      presenter: this.notificationPresenter,
    });
    this.sipCredentialService = new OcpSipCredentialService({
      ocpGateway: deps.ocpGateway,
      logger: deps.logger,
      authorizeSipAccount: deps.authorizeSipAccount,
      registerAccount: deps.registerAccount,
      isSipRegistered: deps.isSipRegistered,
    });
    this.sessionLifecycle = new OcpSessionLifecycleService({
      ocpGateway: deps.ocpGateway,
      operatorReadModel: this.projectionHub,
      eventPublisher: deps.eventPublisher,
      logger: deps.logger,
      getSessionDomain: () => this.projectionHub.getSessionProjection().domain,
    });
    this.sipCascadeBridge = new OcpSipCascadeBridgeService({
      eventPublisher: deps.eventPublisher,
      logger: deps.logger,
      endUserSession: deps.endUserSession,
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.telephonyBridge.dispose();
    this.dndBridge.dispose();
    this.notificationService.dispose();
    this.sipCredentialService.dispose();
    this.sessionLifecycle.dispose();
    this.sipCascadeBridge.dispose();
    this.dndReadModel.dispose();
    this.projectionHub.dispose();
    this.ocpGateway.dispose();
  }
}
