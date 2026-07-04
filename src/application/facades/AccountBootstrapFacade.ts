import type { DomainEvent } from "@domain/index.js";
import type { AppBootstrapConfig } from "@domain/index.js";
import type { SipAccountId, SipAccountInput } from "@domain/index.js";
import type { PhoneStatus } from "@domain/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";
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
import { UnregisterAccountUseCase } from "../use-cases/UnregisterAccountUseCase.js";
import { ResolveStartupModeUseCase } from "../use-cases/ResolveStartupModeUseCase.js";
import { SendDtmfUseCase } from "../use-cases/SendDtmfUseCase.js";
import { UnmuteCallUseCase } from "../use-cases/UnmuteCallUseCase.js";
import { BlindTransferUseCase } from "../use-cases/BlindTransferUseCase.js";
import { StartConsultationUseCase } from "../use-cases/StartConsultationUseCase.js";
import { AttendedTransferUseCase } from "../use-cases/AttendedTransferUseCase.js";
import { StartTransferUseCase } from "../use-cases/StartTransferUseCase.js";
import { CancelTransferUseCase } from "../use-cases/CancelTransferUseCase.js";
import { ChangeAgentStatusUseCase } from "../use-cases/ChangeAgentStatusUseCase.js";
import { UpdatePostCallStatusUseCase } from "../use-cases/UpdatePostCallStatusUseCase.js";
import { LogoutOperatorUseCase } from "../use-cases/LogoutOperatorUseCase.js";
import { SafeLogoutUseCase } from "../use-cases/SafeLogoutUseCase.js";
import { EndUserSessionUseCase } from "../use-cases/EndUserSessionUseCase.js";
import { RetryConnectionUseCase } from "../use-cases/RetryConnectionUseCase.js";
import { ManualSipTransportReconnectUseCase } from "../use-cases/ManualSipTransportReconnectUseCase.js";
import { ReregisterSipUseCase } from "../use-cases/ReregisterSipUseCase.js";
import { ShutdownCleanupUseCase } from "../use-cases/ShutdownCleanupUseCase.js";
import { RegisterOcpCallCorrelationUseCase } from "../use-cases/RegisterOcpCallCorrelationUseCase.js";
import { ProcessOcpInboundMessageUseCase } from "../use-cases/ProcessOcpInboundMessageUseCase.js";
import type { ProcessOcpInboundMessageOutcome } from "../use-cases/ProcessOcpInboundMessageUseCase.js";
import { RespondToCampaignUseCase } from "../use-cases/RespondToCampaignUseCase.js";
import { SendDlgStopUseCase } from "../use-cases/SendDlgStopUseCase.js";
import { CallEndDlgStopOrchestrationService } from "../services/CallEndDlgStopOrchestrationService.js";
import { ConnectionRecoveryOrchestrationService } from "../services/ConnectionRecoveryOrchestrationService.js";
import { SipRecoveryOrchestrationService } from "../services/SipRecoveryOrchestrationService.js";
import type { SipConnectionJournalEntry } from "../services/SipConnectionJournal.js";
import { ServerTerminateCleanupService } from "../services/ServerTerminateCleanupService.js";
import { SessionTeardownOrchestrationService } from "../services/SessionTeardownOrchestrationService.js";
import { InMemoryAgentStatusReadModel } from "../read-models/InMemoryAgentStatusReadModel.js";
import { InMemoryConnectionRecoveryReadModel } from "../read-models/InMemoryConnectionRecoveryReadModel.js";
import { InMemorySipSessionHealthReadModel } from "../read-models/InMemorySipSessionHealthReadModel.js";
import { InMemoryOcpCallCorrelationRegistry } from "../read-models/InMemoryOcpCallCorrelationRegistry.js";
import { InMemoryOcpSyncReadModel } from "../read-models/InMemoryOcpSyncReadModel.js";
import { MockOcpSyncGateway, createSampleOcpServerTerminateRawMessage } from "@adapters/mock/MockOcpSyncGateway.js";
import { MockOperatorPlatformGateway } from "@adapters/mock/MockOperatorPlatformGateway.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { AgentStatusSyncService } from "../services/AgentStatusSyncService.js";
import { BreakReasonsSyncService } from "../services/BreakReasonsSyncService.js";
import { DndAgentStatusOrchestrationService } from "../services/DndAgentStatusOrchestrationService.js";
import { OcpAuthBootstrapService } from "../services/OcpAuthBootstrapService.js";
import { PostCallRejectOrchestrationService } from "../services/PostCallRejectOrchestrationService.js";
import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  Logger,
  OcpCallCorrelationRegistry,
  OcpSyncGateway,
  MediaGateway,
  OperatorPlatformGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { CallEngine } from "@application/services/CallEngine.js";
import type { MultiCallSettings } from "@domain/index.js";
import type { SettingsAccountKey, UserSettings } from "@domain/index.js";
import {
  ANONYMOUS_SETTINGS_ACCOUNT,
  createCallId,
  createSettingsAccountKey,
  mergeMultiCallIntoUserSettings,
  toMultiCallSettings,
  validateUserSettings,
  type Call,
  type CallId,
  type CampaignDecision,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

export type AccountBootstrapFacadeDeps = Readonly<{
  operatorGateway: OperatorPlatformGateway;
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  settingsRepository: SettingsRepository;
  hostIntegrationGateway?: HostIntegrationGateway;
  ocpSyncGateway?: OcpSyncGateway;
  ocpCallCorrelationRegistry?: OcpCallCorrelationRegistry;
  logger: Logger;
  eventPublisher?: DomainEventPublisher;
}>;

export class AccountBootstrapFacade {
  readonly eventPublisher: DomainEventPublisher;
  readonly resolveStartupMode: ResolveStartupModeUseCase;
  readonly authenticateOcp: AuthenticateOcpUseCase;
  readonly authorizeSipAccount: AuthorizeSipAccountUseCase;
  readonly registerAccount: RegisterAccountUseCase;
  readonly unregisterAccount: UnregisterAccountUseCase;
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
  readonly startConsultationUseCase: StartConsultationUseCase;
  readonly attendedTransferUseCase: AttendedTransferUseCase;
  readonly startTransferUseCase: StartTransferUseCase;
  readonly cancelTransferUseCase: CancelTransferUseCase;
  readonly changeAgentStatus: ChangeAgentStatusUseCase;
  readonly updatePostCallStatus: UpdatePostCallStatusUseCase;
  readonly logoutOperator: LogoutOperatorUseCase;
  readonly retryConnection: RetryConnectionUseCase;
  readonly manualSipTransportReconnect: ManualSipTransportReconnectUseCase;
  readonly reregisterSip: ReregisterSipUseCase;
  readonly safeLogout: SafeLogoutUseCase;
  readonly endUserSession: EndUserSessionUseCase;
  readonly shutdownCleanup: ShutdownCleanupUseCase;
  readonly registerOcpCallCorrelation: RegisterOcpCallCorrelationUseCase;
  readonly processOcpInboundMessage: ProcessOcpInboundMessageUseCase;
  readonly respondToCampaign: RespondToCampaignUseCase;
  readonly sendDlgStop: SendDlgStopUseCase;

  private readonly processedCredentialEvents = new Set<string>();
  private readonly callEngine: CallEngine;
  private readonly ocpAuthBootstrap: OcpAuthBootstrapService;
  private readonly dndAgentStatusOrchestration: DndAgentStatusOrchestrationService;
  private readonly postCallRejectOrchestration: PostCallRejectOrchestrationService;
  private readonly callEndDlgStopOrchestration: CallEndDlgStopOrchestrationService;
  private readonly connectionRecoveryOrchestration: ConnectionRecoveryOrchestrationService;
  private readonly sipRecoveryOrchestration: SipRecoveryOrchestrationService;
  private readonly serverTerminateCleanup: ServerTerminateCleanupService;

  constructor(private readonly deps: AccountBootstrapFacadeDeps) {
    this.eventPublisher = deps.eventPublisher ?? new InMemoryDomainEventBus();
    const ocpSyncGateway = deps.ocpSyncGateway ?? new MockOcpSyncGateway();
    const ocpCallCorrelationRegistry =
      deps.ocpCallCorrelationRegistry ?? new InMemoryOcpCallCorrelationRegistry();
    const ocpSyncReadModel = new InMemoryOcpSyncReadModel(this.eventPublisher);
    this.sendDlgStop = new SendDlgStopUseCase(
      ocpSyncGateway,
      ocpSyncReadModel,
      this.eventPublisher,
      deps.logger,
    );
    this.callEndDlgStopOrchestration = new CallEndDlgStopOrchestrationService(
      this.sendDlgStop,
      ocpCallCorrelationRegistry,
      deps.logger,
    );
    this.callEndDlgStopOrchestration.subscribe(this.eventPublisher);
    if (deps.ocpCallCorrelationRegistry === undefined) {
      ocpCallCorrelationRegistry.bindLifecycleEvents(this.eventPublisher);
    }
    this.registerOcpCallCorrelation = new RegisterOcpCallCorrelationUseCase(
      ocpCallCorrelationRegistry,
      this.eventPublisher,
      deps.logger,
    );
    this.processOcpInboundMessage = new ProcessOcpInboundMessageUseCase(
      ocpSyncGateway,
      ocpCallCorrelationRegistry,
      ocpSyncReadModel,
      this.eventPublisher,
      deps.logger,
    );
    this.respondToCampaign = new RespondToCampaignUseCase(
      ocpSyncGateway,
      ocpSyncReadModel,
      this.eventPublisher,
      deps.logger,
    );
    const agentStatusReadModel = new InMemoryAgentStatusReadModel(this.eventPublisher);
    const sipSessionHealthReadModel = new InMemorySipSessionHealthReadModel(
      this.eventPublisher,
    );
    const ocpConnectionRecoveryReadModel = new InMemoryConnectionRecoveryReadModel(
      this.eventPublisher,
    );
    const agentStatusSync = new AgentStatusSyncService(
      deps.operatorGateway,
      this.eventPublisher,
      deps.logger,
    );
    const breakReasonsSync = new BreakReasonsSyncService(
      deps.operatorGateway,
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.changeAgentStatus = new ChangeAgentStatusUseCase(
      agentStatusReadModel,
      deps.operatorGateway,
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
    );
    const dndAgentStatusOrchestration = new DndAgentStatusOrchestrationService(
      agentStatusReadModel,
      this.changeAgentStatus,
      deps.logger,
    );
    this.dndAgentStatusOrchestration = dndAgentStatusOrchestration;
    this.ocpAuthBootstrap = new OcpAuthBootstrapService(
      agentStatusSync,
      breakReasonsSync,
      dndAgentStatusOrchestration,
      deps.settingsRepository,
      deps.logger,
    );
    this.updatePostCallStatus = new UpdatePostCallStatusUseCase(
      agentStatusReadModel,
      deps.operatorGateway,
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.logoutOperator = new LogoutOperatorUseCase(
      agentStatusReadModel,
      deps.operatorGateway,
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.postCallRejectOrchestration = new PostCallRejectOrchestrationService(
      agentStatusReadModel,
      this.updatePostCallStatus,
      deps.logger,
    );
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
    this.unregisterAccount = new UnregisterAccountUseCase(
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
    this.startConsultationUseCase = new StartConsultationUseCase(this.callEngine, deps.logger);
    this.attendedTransferUseCase = new AttendedTransferUseCase(this.callEngine, deps.logger);
    this.startTransferUseCase = new StartTransferUseCase(this.callEngine, deps.logger);
    this.cancelTransferUseCase = new CancelTransferUseCase(this.callEngine, deps.logger);

    deps.telephonyGateway.setIncomingCallHandler(async (notification) => {
      await this.callEngine.handleIncomingReceived({ notification });
      if (notification.mainAcallId !== undefined) {
        this.registerOcpCallCorrelation.execute({
          callId: notification.callId,
          mainAcallId: notification.mainAcallId,
          correlationId: notification.correlationId,
        });
      }
    });
    deps.telephonyGateway.setCallEndedHandler(async (notification) => {
      await this.callEngine.handleCallEnded(
        notification.callId,
        notification.correlationId,
      );
    });
    deps.telephonyGateway.setCallAnsweredHandler(async (notification) => {
      await this.callEngine.handleOutboundCallAnswered(
        notification.callId,
        notification.correlationId,
      );
    });
    deps.telephonyGateway.setRemoteHoldHandler((notification) => {
      this.callEngine.handleRemoteHold(notification.callId, notification.correlationId);
      return Promise.resolve();
    });
    deps.telephonyGateway.setRemoteResumeHandler((notification) =>
      this.callEngine.handleRemoteResume(
        notification.callId,
        notification.correlationId,
      ),
    );

    this.connectionRecoveryOrchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway: deps.telephonyGateway,
      operatorGateway: deps.operatorGateway,
      eventPublisher: this.eventPublisher,
      logger: deps.logger,
    });
    this.connectionRecoveryOrchestration.bindTransportHandlers();
    this.connectionRecoveryOrchestration.subscribe(this.eventPublisher);

    this.sipRecoveryOrchestration = new SipRecoveryOrchestrationService({
      telephonyGateway: deps.telephonyGateway,
      eventPublisher: this.eventPublisher,
      logger: deps.logger,
    });
    this.sipRecoveryOrchestration.bindTransportHandlers();
    this.sipRecoveryOrchestration.subscribe(this.eventPublisher);
    void this.applySipRecoverySettingsFromRepository();

    this.retryConnection = new RetryConnectionUseCase(
      sipSessionHealthReadModel,
      ocpConnectionRecoveryReadModel,
      this.connectionRecoveryOrchestration,
      this.sipRecoveryOrchestration,
      deps.logger,
    );
    this.manualSipTransportReconnect = new ManualSipTransportReconnectUseCase(
      this.sipRecoveryOrchestration,
      deps.logger,
    );
    this.reregisterSip = new ReregisterSipUseCase(
      deps.telephonyGateway,
      this.eventPublisher,
      deps.logger,
    );

    const sessionTeardownOrchestration = new SessionTeardownOrchestrationService({
      connectionRecoveryOrchestration: this.connectionRecoveryOrchestration,
      sipRecoveryOrchestration: this.sipRecoveryOrchestration,
      callEngine: this.callEngine,
      mediaGateway: deps.mediaGateway,
      unregisterAccount: this.unregisterAccount,
      logger: deps.logger,
    });

    this.endUserSession = new EndUserSessionUseCase(
      sessionTeardownOrchestration,
      this.eventPublisher,
      deps.logger,
    );
    this.safeLogout = new SafeLogoutUseCase(
      sessionTeardownOrchestration,
      deps.operatorGateway,
      agentStatusReadModel,
      this.eventPublisher,
      deps.logger,
    );
    this.shutdownCleanup = new ShutdownCleanupUseCase(
      sessionTeardownOrchestration,
      deps.operatorGateway,
      agentStatusReadModel,
      this.eventPublisher,
      deps.logger,
    );
    this.serverTerminateCleanup = new ServerTerminateCleanupService({
      sessionTeardown: sessionTeardownOrchestration,
      operatorGateway: deps.operatorGateway,
      agentStatusReadModel,
      logger: deps.logger,
    });
    this.serverTerminateCleanup.subscribe(this.eventPublisher);

    this.eventPublisher.subscribe((event) => {
      void this.handleAutoRegistration(event);
      void this.handleAgentStatusSync(event);
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

    const registerResult = await this.registerAccount.execute(registerInput);
    return registerResult;
  }

  async setPhoneStatus(status: PhoneStatus): Promise<void> {
    const result = await this.changePhoneStatus.execute({ nextStatus: status });
    if (isErr(result)) {
      return;
    }

    if (status === "dnd") {
      await this.dndAgentStatusOrchestration.handlePhoneStatusChanged(status);
    }
  }

  getMultiCallSettings(): Promise<MultiCallSettings> {
    return this.deps.settingsRepository.getMultiCallSettings();
  }

  async updateMultiCallSettings(settings: MultiCallSettings): Promise<MultiCallSettings> {
    const accountKey = await this.resolveSettingsAccountKey();
    const current = await this.deps.settingsRepository.getUserSettings(accountKey);
    const next = mergeMultiCallIntoUserSettings(current, {
      multiSessionsEnabled: settings.multiSessionsEnabled,
      autoUnholdOnTransferFailure: settings.autoUnholdOnTransferFailure !== false,
    });
    const saved = await this.saveUserSettingsInternal(accountKey, next);
    return toMultiCallSettings(saved);
  }

  async getUserSettingsForAccount(): Promise<Result<UserSettings, PlatformError>> {
    try {
      const accountKey = await this.resolveSettingsAccountKey();
      const settings = await this.deps.settingsRepository.getUserSettings(accountKey);
      return ok(settings);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  async saveUserSettings(
    settings: UserSettings,
  ): Promise<Result<UserSettings, PlatformError>> {
    try {
      const accountKey = await this.resolveSettingsAccountKey();
      const saved = await this.saveUserSettingsInternal(accountKey, settings);
      return ok(saved);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  async refreshUserSettingsProjections(handlers: Readonly<{
    applyMultiCallSettings: (settings: MultiCallSettings) => void;
  }>): Promise<void> {
    const accountKey = await this.resolveSettingsAccountKey();
    const userSettings = await this.deps.settingsRepository.getUserSettings(accountKey);
    handlers.applyMultiCallSettings(toMultiCallSettings(userSettings));
  }

  private async resolveSettingsAccountKey(): Promise<SettingsAccountKey> {
    const account = await this.deps.settingsRepository.getSipAccount();
    if (account === null) {
      return createSettingsAccountKey(ANONYMOUS_SETTINGS_ACCOUNT);
    }
    return createSettingsAccountKey(account.username);
  }

  private async saveUserSettingsInternal(
    accountKey: SettingsAccountKey,
    settings: UserSettings,
  ): Promise<UserSettings> {
    const validated = validateUserSettings(settings);
    if (!validated.ok) {
      throw new Error(`settings_validation_failed:${validated.errors.join(",")}`);
    }
    await this.deps.settingsRepository.saveUserSettings(accountKey, validated.value);
    this.sipRecoveryOrchestration.applyRecoverySettings(validated.value);
    await this.callEngine.refreshAutoAnswerSchedules();
    return validated.value;
  }

  private async applySipRecoverySettingsFromRepository(): Promise<void> {
    const accountKey = await this.resolveSettingsAccountKey();
    const settings = await this.deps.settingsRepository.getUserSettings(accountKey);
    this.sipRecoveryOrchestration.applyRecoverySettings(settings);
  }

  async reregisterSipAccount(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const account = await this.deps.settingsRepository.getSipAccount();
    return this.reregisterSip.execute({
      ...(correlationId !== undefined ? { correlationId } : {}),
      ...(account !== null ? { accountId: account.id } : {}),
    });
  }

  getSipConnectionJournalEntries(): ReadonlyArray<SipConnectionJournalEntry> {
    return this.sipRecoveryOrchestration.getJournal().getEntries();
  }

  clearSipConnectionJournal(): void {
    this.sipRecoveryOrchestration.getJournal().clear();
  }

  async manualSipTransportReconnectAccount(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    return this.manualSipTransportReconnect.execute(
      correlationId !== undefined ? { correlationId } : {},
    );
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

  async startConsultation(
    sourceCallId: CallId,
    targetNumber: string,
    consultationCallId?: CallId,
  ): Promise<Result<Call, PlatformError>> {
    const input =
      consultationCallId === undefined
        ? { sourceCallId, targetNumber }
        : { sourceCallId, targetNumber, consultationCallId };
    return this.startConsultationUseCase.execute(input);
  }

  async startConsultationByIds(
    sourceCallId: string,
    targetNumber: string,
    consultationCallId?: string,
  ): Promise<Result<Call, PlatformError>> {
    const parsedSourceCallId = createCallId(sourceCallId);
    if (consultationCallId === undefined) {
      return this.startConsultation(parsedSourceCallId, targetNumber);
    }
    return this.startConsultation(
      parsedSourceCallId,
      targetNumber,
      createCallId(consultationCallId),
    );
  }

  async attendedTransfer(
    sourceCallId: CallId,
    consultationCallId: CallId,
  ): Promise<Result<Call, PlatformError>> {
    return this.attendedTransferUseCase.execute({ sourceCallId, consultationCallId });
  }

  async attendedTransferByIds(
    sourceCallId: string,
    consultationCallId: string,
  ): Promise<Result<Call, PlatformError>> {
    return this.attendedTransfer(createCallId(sourceCallId), createCallId(consultationCallId));
  }

  startTransfer(callId: CallId): Result<void, PlatformError> {
    return this.startTransferUseCase.execute({ callId });
  }

  startTransferById(callId: string): Result<void, PlatformError> {
    return this.startTransfer(createCallId(callId));
  }

  async cancelTransfer(callId: CallId): Promise<Result<void, PlatformError>> {
    return this.cancelTransferUseCase.execute({ callId });
  }

  async cancelTransferById(callId: string): Promise<Result<void, PlatformError>> {
    return this.cancelTransfer(createCallId(callId));
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
    const correlationId = createCorrelationId();
    const result =
      breakReason !== undefined
        ? await this.rejectCallUseCase.execute({ callId, breakReason, correlationId })
        : await this.rejectCallUseCase.execute({ callId, correlationId });

    if (!isErr(result) && breakReason !== undefined && breakReason.trim().length > 0) {
      await this.postCallRejectOrchestration.handleRejectedCall(
        callId,
        breakReason,
        correlationId,
      );
    }

    return result;
  }

  async rejectCallById(
    callId: string,
    breakReason?: string,
  ): Promise<Result<Call, PlatformError>> {
    return this.rejectCall(createCallId(callId), breakReason);
  }

  processOcpInboundMessageRaw(
    raw: unknown,
    correlationId?: CorrelationId,
  ): Result<ProcessOcpInboundMessageOutcome, never> {
    const input =
      correlationId === undefined
        ? { raw }
        : { raw, correlationId };
    return this.processOcpInboundMessage.execute(input);
  }

  respondToCampaignById(
    campaignId: string,
    decision: CampaignDecision,
    callId?: string,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const base = { campaignId, decision };
    if (callId !== undefined && correlationId !== undefined) {
      return this.respondToCampaign.execute({
        ...base,
        callId: createCallId(callId),
        correlationId,
      });
    }
    if (callId !== undefined) {
      return this.respondToCampaign.execute({
        ...base,
        callId: createCallId(callId),
      });
    }
    if (correlationId !== undefined) {
      return this.respondToCampaign.execute({ ...base, correlationId });
    }
    return this.respondToCampaign.execute(base);
  }

  /** Dev/test helper: simulate SIP transport disconnect (LF-008). */
  async simulateSipTransportDisconnected(
    correlationId: CorrelationId = createCorrelationId(),
    reason = "transport_closed",
  ): Promise<void> {
    const gateway = this.deps.telephonyGateway;
    if (gateway instanceof MockTelephonyGateway) {
      await gateway.simulateTransportDisconnected({ correlationId, reason });
      return;
    }
    throw new Error("simulateSipTransportDisconnected requires MockTelephonyGateway");
  }

  /** Dev/test helper: simulate SIP REGISTER failure with live transport (F-014). */
  async simulateSipRegistrationFailed(
    correlationId: CorrelationId = createCorrelationId(),
    reason = "authentication_error",
    accountId: SipAccountId | null = null,
  ): Promise<void> {
    const gateway = this.deps.telephonyGateway;
    if (gateway instanceof MockTelephonyGateway) {
      await gateway.simulateRegistrationFailed({ correlationId, reason, accountId });
      return;
    }
    throw new Error("simulateSipRegistrationFailed requires MockTelephonyGateway");
  }

  /** Dev/test helper: simulate OCP WebSocket disconnect (LF-058). */
  async simulateOcpTransportDisconnected(
    correlationId: CorrelationId = createCorrelationId(),
    reason = "transport_closed",
  ): Promise<void> {
    const gateway = this.deps.operatorGateway;
    if (gateway instanceof MockOperatorPlatformGateway) {
      await gateway.simulateOcpTransportDisconnected({ correlationId, reason });
      return;
    }
    throw new Error("simulateOcpTransportDisconnected requires MockOperatorPlatformGateway");
  }

  /** Dev/test helper: simulate OCP server_terminate inbound (LF-049). */
  simulateServerTerminate(
    correlationId: CorrelationId = createCorrelationId(),
    reason = "server_terminate",
    entityId = "agent-001",
  ): Result<ProcessOcpInboundMessageOutcome, never> {
    return this.processOcpInboundMessageRaw(
      createSampleOcpServerTerminateRawMessage(entityId, reason),
      correlationId,
    );
  }

  getReconnectScheduler() {
    return this.connectionRecoveryOrchestration.getScheduler();
  }

  endUserSessionCommand(correlationId?: CorrelationId) {
    return this.endUserSession.execute(
      correlationId === undefined ? {} : { correlationId },
    );
  }

  dispose(): void {
    this.connectionRecoveryOrchestration.dispose();
  }

  private async handleAgentStatusSync(event: DomainEvent): Promise<void> {
    if (event.type !== "OcpAuthenticationSucceeded") {
      return;
    }

    await this.ocpAuthBootstrap.afterOcpAuthSucceeded(event.correlationId);
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

  notifyPeerConnectionAvailable(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    return this.callEngine.handlePeerConnectionAvailable(callId, correlationId);
  }
}

function isSipAccountInput(value: unknown): value is SipAccountInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["username"] === "string" &&
    typeof candidate["password"] === "string" &&
    typeof candidate["domain"] === "string" &&
    typeof candidate["server"] === "string"
  );
}
