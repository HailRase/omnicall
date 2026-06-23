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
import { HangupCallUseCase } from "../use-cases/HangupCallUseCase.js";
import { HoldCallUseCase } from "../use-cases/HoldCallUseCase.js";
import { MuteCallUseCase } from "../use-cases/MuteCallUseCase.js";
import { ResumeCallUseCase } from "../use-cases/ResumeCallUseCase.js";
import { AnswerCallUseCase } from "../use-cases/AnswerCallUseCase.js";
import { RejectCallUseCase } from "../use-cases/RejectCallUseCase.js";
import { RegisterAccountUseCase } from "../use-cases/RegisterAccountUseCase.js";
import { ResolveStartupModeUseCase } from "../use-cases/ResolveStartupModeUseCase.js";
import { SendDtmfUseCase } from "../use-cases/SendDtmfUseCase.js";
import { UnmuteCallUseCase } from "../use-cases/UnmuteCallUseCase.js";
import { BlindTransferUseCase } from "../use-cases/BlindTransferUseCase.js";
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
import { createCallId, type Call, type CallId, type MultiCallSettings } from "@domain/index.js";

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
  readonly hangupCallUseCase: HangupCallUseCase;
  readonly holdCallUseCase: HoldCallUseCase;
  readonly resumeCallUseCase: ResumeCallUseCase;
  readonly muteCallUseCase: MuteCallUseCase;
  readonly unmuteCallUseCase: UnmuteCallUseCase;
  readonly answerCallUseCase: AnswerCallUseCase;
  readonly rejectCallUseCase: RejectCallUseCase;
  readonly sendDtmfUseCase: SendDtmfUseCase;
  readonly blindTransferUseCase: BlindTransferUseCase;

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
    this.hangupCallUseCase = new HangupCallUseCase(this.callEngine, deps.logger);
    this.holdCallUseCase = new HoldCallUseCase(this.callEngine, deps.logger);
    this.resumeCallUseCase = new ResumeCallUseCase(this.callEngine, deps.logger);
    this.muteCallUseCase = new MuteCallUseCase(this.callEngine, deps.logger);
    this.unmuteCallUseCase = new UnmuteCallUseCase(this.callEngine, deps.logger);
    this.answerCallUseCase = new AnswerCallUseCase(this.callEngine, deps.logger);
    this.rejectCallUseCase = new RejectCallUseCase(
      this.callEngine,
      deps.settingsRepository,
      deps.logger,
    );
    this.sendDtmfUseCase = new SendDtmfUseCase(this.callEngine, deps.logger);
    this.blindTransferUseCase = new BlindTransferUseCase(this.callEngine, deps.logger);

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

  getMultiCallSettings(): Promise<MultiCallSettings> {
    return this.deps.settingsRepository.getMultiCallSettings();
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

  async sendDtmfByCallId(
    callId: string,
    tone: string,
  ): Promise<Result<void, PlatformError>> {
    return this.sendDtmf(createCallId(callId), tone);
  }

  async hangupCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.hangupCallUseCase.execute({ callId });
  }

  async hangupCallById(callId: string): Promise<Result<Call, PlatformError>> {
    return this.hangupCall(createCallId(callId));
  }

  async holdCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.holdCallUseCase.execute({ callId });
  }

  async holdCallById(callId: string): Promise<Result<Call, PlatformError>> {
    return this.holdCall(createCallId(callId));
  }

  async resumeCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.resumeCallUseCase.execute({ callId });
  }

  async resumeCallById(callId: string): Promise<Result<Call, PlatformError>> {
    return this.resumeCall(createCallId(callId));
  }

  async muteCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.muteCallUseCase.execute({ callId });
  }

  async muteCallById(callId: string): Promise<Result<Call, PlatformError>> {
    return this.muteCall(createCallId(callId));
  }

  async unmuteCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.unmuteCallUseCase.execute({ callId });
  }

  async unmuteCallById(callId: string): Promise<Result<Call, PlatformError>> {
    return this.unmuteCall(createCallId(callId));
  }

  async blindTransfer(
    callId: CallId,
    targetNumber: string,
  ): Promise<Result<Call, PlatformError>> {
    return this.blindTransferUseCase.execute({ callId, targetNumber });
  }

  async blindTransferById(
    callId: string,
    targetNumber: string,
  ): Promise<Result<Call, PlatformError>> {
    return this.blindTransfer(createCallId(callId), targetNumber);
  }

  async answerCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.answerCallUseCase.execute({ callId });
  }

  async answerCallById(callId: string): Promise<Result<Call, PlatformError>> {
    return this.answerCall(createCallId(callId));
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

  async rejectCallById(
    callId: string,
    breakReason?: string,
  ): Promise<Result<Call, PlatformError>> {
    return this.rejectCall(createCallId(callId), breakReason);
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
