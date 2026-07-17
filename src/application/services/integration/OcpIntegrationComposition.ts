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
import type { SettingsAccountIdentity } from "@domain/settings/deriveSettingsAccountKey.js";
import type { AuthorizeSipAccountUseCase } from "../../use-cases/settings/AuthorizeSipAccountUseCase.js";
import type { PromoteAuthorizedSipSessionUseCase } from "../../use-cases/settings/PromoteAuthorizedSipSessionUseCase.js";
import type { RegisterAccountUseCase } from "../../use-cases/settings/RegisterAccountUseCase.js";
import {
  applyAuthorizationExecutionStage,
  applyAuthorizationProgressStage,
} from "../../projections/settings/authorizationProgressProjection.js";
import { OcpAuthenticateAndConnectService } from "./OcpAuthenticateAndConnectService.js";
import { OcpBackedSignInOrchestrationService } from "./OcpBackedSignInOrchestrationService.js";
import { OcpInvalidTokenReauthService } from "./OcpInvalidTokenReauthService.js";
import { OcpTelephonyBridgeService } from "./OcpTelephonyBridgeService.js";
import { OcpDndBridgeService } from "./OcpDndBridgeService.js";
import { OcpNotificationService } from "./OcpNotificationService.js";
import { OcpSipCredentialService } from "./OcpSipCredentialService.js";
import { OcpSessionLifecycleService } from "./OcpSessionLifecycleService.js";
import { OcpSipCascadeBridgeService } from "./OcpSipCascadeBridgeService.js";
import { OcpTransportRecoveryService } from "./OcpTransportRecoveryService.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type OcpIntegrationCompositionDeps = Readonly<{
  ocpGateway: OcpGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  reasonsCache: OcpReasonsCachePort;
  notificationPresenter: OcpNotificationPresenter;
  proxyAuthenticate: OcpProxyAuthenticatePort;
  authorizeSipAccount: AuthorizeSipAccountUseCase;
  registerAccount: RegisterAccountUseCase;
  promoteAuthorizedSipSession: PromoteAuthorizedSipSessionUseCase;
  isSipRegistered: () => boolean;
  getActiveSipIdentity: () => Promise<SettingsAccountIdentity | null>;
  endUserSession: (correlationId: CorrelationId) => Promise<void>;
  /** Optional: HTTP re-auth via Facade.connectOcp when INVALID_TOKEN is observed. */
  reauthenticateOnInvalidToken?: () => Promise<Result<void, PlatformError>>;
  /**
   * Optional: Application-owned fresh-token transport recovery after unexpected drop.
   * Must not reuse a retained adapter token (ADR-AF-002).
   */
  recoverTransportWithFreshToken?: (
    correlationId: CorrelationId,
  ) => Promise<Result<void, PlatformError>>;
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
  readonly backedSignIn: OcpBackedSignInOrchestrationService;

  private readonly telephonyBridge: OcpTelephonyBridgeService;
  private readonly dndBridge: OcpDndBridgeService;
  private readonly notificationService: OcpNotificationService;
  private readonly sipCredentialService: OcpSipCredentialService;
  private readonly sessionLifecycle: OcpSessionLifecycleService;
  private readonly sipCascadeBridge: OcpSipCascadeBridgeService;
  private readonly invalidTokenReauth: OcpInvalidTokenReauthService | null;
  private readonly transportRecovery: OcpTransportRecoveryService | null;
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
      // Late-bound: transportRecovery is constructed below; callback runs on reconnect.
      cancelTransportRecovery: (reason) => {
        this.transportRecovery?.cancelAll(reason);
      },
      onExecutionStage: (stage, correlationId) => {
        const progress =
          this.projectionHub.getSessionProjection().authorizationProgress;
        this.projectionHub.setAuthorizationProgress(
          applyAuthorizationExecutionStage(progress, stage, correlationId),
        );
      },
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
      promoteAuthorizedSipSession: deps.promoteAuthorizedSipSession,
      isSipRegistered: deps.isSipRegistered,
      getActiveSipIdentity: deps.getActiveSipIdentity,
      onRegisteringPhone: (correlationId) => {
        this.projectionHub.setAuthorizationProgress(
          applyAuthorizationProgressStage(
            this.projectionHub.getSessionProjection().authorizationProgress,
            "registering_phone",
            correlationId,
          ),
        );
      },
      onExecutionStage: (stage, correlationId) => {
        const progress =
          this.projectionHub.getSessionProjection().authorizationProgress;
        this.projectionHub.setAuthorizationProgress(
          applyAuthorizationExecutionStage(progress, stage, correlationId),
        );
      },
    });
    this.transportRecovery =
      deps.recoverTransportWithFreshToken === undefined
        ? null
        : new OcpTransportRecoveryService({
            ocpGateway: deps.ocpGateway,
            projectionHub: this.projectionHub,
            recoverWithFreshToken: deps.recoverTransportWithFreshToken,
            logger: deps.logger,
          });

    this.backedSignIn = new OcpBackedSignInOrchestrationService({
      authenticateAndConnect: this.authenticateAndConnect,
      sipCredentialService: this.sipCredentialService,
      projectionHub: this.projectionHub,
      logger: deps.logger,
      cancelTransportRecovery: (reason) => {
        this.transportRecovery?.cancelAll(reason);
      },
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
    this.invalidTokenReauth =
      deps.reauthenticateOnInvalidToken === undefined
        ? null
        : new OcpInvalidTokenReauthService({
            projectionHub: this.projectionHub,
            reauthenticate: deps.reauthenticateOnInvalidToken,
            logger: deps.logger,
          });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.backedSignIn.terminateAttempt("composition_dispose");
    this.transportRecovery?.dispose();
    this.telephonyBridge.dispose();
    this.dndBridge.dispose();
    this.notificationService.dispose();
    this.sipCredentialService.dispose();
    this.sessionLifecycle.dispose();
    this.sipCascadeBridge.dispose();
    this.invalidTokenReauth?.dispose();
    this.dndReadModel.dispose();
    this.projectionHub.dispose();
    this.ocpGateway.dispose();
  }

  /** Disarm Application-owned transport recovery before intentional logout disconnect. */
  disarmTransportRecoveryForUserLogout(): void {
    this.transportRecovery?.cancelAll("user_logout");
    this.backedSignIn.terminateAttempt("user_logout");
  }

  /** Re-arm recovery tracking when intentional logout failed and session stayed authorized. */
  restoreTransportRecoveryTrackingAfterFailedLogout(): void {
    this.transportRecovery?.restoreLiveTrackingIfAuthorized();
  }

  /** Cold-start OCP projections after intentional logout (LF-048 / ADR-AF-002). */
  resetProjectionsToIdleAfterUserLogout(): void {
    this.projectionHub.resetToIdle();
  }
}
