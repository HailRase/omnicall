import type { DomainEvent } from "@domain/index.js";
import type { AppBootstrapConfig } from "@domain/index.js";
import type { SipAccountInput } from "@domain/index.js";
import type { PhoneStatus } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { AuthenticateOcpUseCase } from "../use-cases/AuthenticateOcpUseCase.js";
import { AuthorizeSipAccountUseCase } from "../use-cases/AuthorizeSipAccountUseCase.js";
import { ChangePhoneStatusUseCase } from "../use-cases/ChangePhoneStatusUseCase.js";
import { MakeCallUseCase } from "../use-cases/MakeCallUseCase.js";
import { AnswerCallUseCase } from "../use-cases/AnswerCallUseCase.js";
import { RejectCallUseCase } from "../use-cases/RejectCallUseCase.js";
import { RegisterAccountUseCase } from "../use-cases/RegisterAccountUseCase.js";
import { ResolveStartupModeUseCase } from "../use-cases/ResolveStartupModeUseCase.js";
import { SendDtmfUseCase } from "../use-cases/SendDtmfUseCase.js";
import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  Logger,
  MediaGateway,
  OperatorPlatformGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { CallEngine } from "@application/services/CallEngine.js";
import type { Call, CallId } from "@domain/index.js";

export type AccountBootstrapFacadeDeps = Readonly<{
  operatorGateway: OperatorPlatformGateway;
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  settingsRepository: SettingsRepository;
  hostIntegrationGateway?: HostIntegrationGateway;
  logger: Logger;
  eventPublisher?: DomainEventPublisher;
}>;

export class AccountBootstrapFacade {
  readonly eventPublisher: DomainEventPublisher;
  readonly resolveStartupMode: ResolveStartupModeUseCase;
  readonly authenticateOcp: AuthenticateOcpUseCase;
  readonly authorizeSipAccount: AuthorizeSipAccountUseCase;
  readonly registerAccount: RegisterAccountUseCase;
  readonly changePhoneStatus: ChangePhoneStatusUseCase;
  readonly makeCallUseCase: MakeCallUseCase;
  readonly answerCallUseCase: AnswerCallUseCase;
  readonly rejectCallUseCase: RejectCallUseCase;
  readonly sendDtmfUseCase: SendDtmfUseCase;

  private readonly processedCredentialEvents = new Set<string>();
  private readonly callEngine: CallEngine;

  constructor(private readonly deps: AccountBootstrapFacadeDeps) {
    this.eventPublisher = deps.eventPublisher ?? new InMemoryDomainEventBus();
    this.resolveStartupMode = new ResolveStartupModeUseCase(
      this.eventPublisher,
      deps.logger,
    );
    this.authenticateOcp = new AuthenticateOcpUseCase(
      deps.operatorGateway,
      this.eventPublisher,
      deps.logger,
    );
    this.authorizeSipAccount = new AuthorizeSipAccountUseCase(
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.registerAccount = new RegisterAccountUseCase(
      deps.telephonyGateway,
      this.eventPublisher,
      deps.logger,
    );
    this.changePhoneStatus = new ChangePhoneStatusUseCase(
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.callEngine = new CallEngine(
      deps.telephonyGateway,
      deps.mediaGateway,
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
      deps.hostIntegrationGateway,
    );
    this.makeCallUseCase = new MakeCallUseCase(this.callEngine, deps.logger);
    this.answerCallUseCase = new AnswerCallUseCase(this.callEngine, deps.logger);
    this.rejectCallUseCase = new RejectCallUseCase(
      this.callEngine,
      deps.settingsRepository,
      deps.logger,
    );
    this.sendDtmfUseCase = new SendDtmfUseCase(this.callEngine, deps.logger);

    deps.telephonyGateway.setIncomingCallHandler(async (notification) => {
      await this.callEngine.handleIncomingReceived({ notification });
    });
    deps.telephonyGateway.setCallEndedHandler(async (notification) => {
      await this.callEngine.handleCallEnded(
        notification.callId,
        notification.correlationId,
      );
    });

    this.eventPublisher.subscribe((event) => {
      void this.handleAutoRegistration(event);
    });
  }

  async initialize(config?: AppBootstrapConfig): Promise<void> {
    const bootstrapConfig =
      config ?? (await this.deps.settingsRepository.getBootstrapConfig());
    const startupResult = this.resolveStartupMode.execute({
      config: bootstrapConfig,
    });

    if (isErr(startupResult)) {
      return;
    }

    const { resolution } = startupResult.value;

    if (resolution.action === "access_denied") {
      return;
    }

    if (resolution.action === "ocp_authenticate") {
      await this.authenticateOcp.execute({
        token: resolution.token,
        domain: resolution.domain,
      });
      return;
    }

    const phoneStatus = await this.deps.settingsRepository.getPhoneStatus();
    const existingAccount = await this.deps.settingsRepository.getSipAccount();
    if (existingAccount !== null && phoneStatus !== "offline") {
      await this.registerAccount.execute({ account: existingAccount });
    }
  }

  async authorizeManualAccount(
    account: SipAccountInput,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const authorizeInput =
      correlationId === undefined
        ? { account, source: "manual" as const }
        : { account, correlationId, source: "manual" as const };

    const authorizeResult = await this.authorizeSipAccount.execute(authorizeInput);

    if (isErr(authorizeResult)) {
      return authorizeResult;
    }

    const registerInput =
      correlationId === undefined
        ? { account: authorizeResult.value }
        : { account: authorizeResult.value, correlationId };

    return this.registerAccount.execute(registerInput);
  }

  async setPhoneStatus(status: PhoneStatus): Promise<void> {
    await this.changePhoneStatus.execute({ nextStatus: status });
  }

  async makeCall(number: string, callId?: CallId): Promise<Result<Call, PlatformError>> {
    const callInput =
      callId === undefined
        ? { number }
        : {
            number,
            callId,
          };
    return this.makeCallUseCase.execute(callInput);
  }

  async sendDtmf(callId: CallId, tone: string): Promise<Result<void, PlatformError>> {
    return this.sendDtmfUseCase.execute({ callId, tone });
  }

  async answerCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.answerCallUseCase.execute({ callId });
  }

  async rejectCall(
    callId: CallId,
    breakReason?: string,
  ): Promise<Result<Call, PlatformError>> {
    if (breakReason !== undefined) {
      return this.rejectCallUseCase.execute({ callId, breakReason });
    }
    return this.rejectCallUseCase.execute({ callId });
  }

  private async handleAutoRegistration(event: DomainEvent): Promise<void> {
    if (event.type !== "SipCredentialsReceived") {
      return;
    }

    const source = event["source"];
    if (source !== "ocp") {
      return;
    }

    if (this.processedCredentialEvents.has(event.correlationId)) {
      return;
    }

    this.processedCredentialEvents.add(event.correlationId);

    const credentials = event["credentials"];
    if (!isSipAccountInput(credentials)) {
      return;
    }

    await this.authorizeManualAccount(credentials, event.correlationId);
  }
}

function isSipAccountInput(value: unknown): value is SipAccountInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["uri"] === "string" &&
    typeof candidate["username"] === "string" &&
    typeof candidate["password"] === "string" &&
    typeof candidate["displayName"] === "string" &&
    typeof candidate["registrar"] === "string"
  );
}
