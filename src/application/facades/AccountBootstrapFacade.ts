import type { AppBootstrapConfig } from "@domain/index.js";
import type { SipAccountId, SipAccountInput } from "@domain/index.js";
import type { PhoneStatus } from "@domain/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { AuthorizeSipAccountUseCase } from "../use-cases/settings/AuthorizeSipAccountUseCase.js";
import { ChangePhoneStatusUseCase } from "../use-cases/settings/ChangePhoneStatusUseCase.js";
import { MakeCallUseCase } from "../use-cases/telephony/MakeCallUseCase.js";
import { HangupCallUseCase } from "../use-cases/telephony/HangupCallUseCase.js";
import { HoldCallUseCase } from "../use-cases/telephony/HoldCallUseCase.js";
import { MuteCallUseCase } from "../use-cases/telephony/MuteCallUseCase.js";
import { ResumeCallUseCase } from "../use-cases/telephony/ResumeCallUseCase.js";
import { AnswerCallUseCase } from "../use-cases/telephony/AnswerCallUseCase.js";
import { RejectCallUseCase } from "../use-cases/telephony/RejectCallUseCase.js";
import { RegisterAccountUseCase } from "../use-cases/settings/RegisterAccountUseCase.js";
import { UnregisterAccountUseCase } from "../use-cases/settings/UnregisterAccountUseCase.js";
import { ResolveStartupModeUseCase } from "../use-cases/platform/ResolveStartupModeUseCase.js";
import { SendDtmfUseCase } from "../use-cases/telephony/SendDtmfUseCase.js";
import { UnmuteCallUseCase } from "../use-cases/telephony/UnmuteCallUseCase.js";
import { BlindTransferUseCase } from "../use-cases/telephony/BlindTransferUseCase.js";
import { StartConsultationUseCase } from "../use-cases/telephony/StartConsultationUseCase.js";
import { AttendedTransferUseCase } from "../use-cases/telephony/AttendedTransferUseCase.js";
import { StartTransferUseCase } from "../use-cases/telephony/StartTransferUseCase.js";
import { CancelTransferUseCase } from "../use-cases/telephony/CancelTransferUseCase.js";
import { SafeLogoutUseCase } from "../use-cases/platform/SafeLogoutUseCase.js";
import { EndUserSessionUseCase } from "../use-cases/platform/EndUserSessionUseCase.js";
import { RetryConnectionUseCase } from "../use-cases/platform/RetryConnectionUseCase.js";
import { ManualSipTransportReconnectUseCase } from "../use-cases/telephony/ManualSipTransportReconnectUseCase.js";
import { ReregisterSipUseCase } from "../use-cases/telephony/ReregisterSipUseCase.js";
import { ShutdownCleanupUseCase } from "../use-cases/platform/ShutdownCleanupUseCase.js";
import { SipRecoveryOrchestrationService } from "../services/recovery/SipRecoveryOrchestrationService.js";
import type { SipConnectionJournalEntry } from "../services/recovery/SipConnectionJournal.js";
import { SessionTeardownOrchestrationService } from "../services/platform/SessionTeardownOrchestrationService.js";
import { InMemorySipSessionHealthReadModel } from "../read-models/InMemorySipSessionHealthReadModel.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import type {
  DomainEventPublisher,
  HostIntegrationGateway,
  Logger,
  SavedAccountProfileRepository,
  SettingsRepository,
  CallHistoryRepository,
  ContactRepository,
  ContactCsvFileGateway,
  TelephonyGateway,
  MediaGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { CallEngine } from "@application/services/telephony/CallEngine.js";
import type { MultiCallSettings } from "@domain/index.js";
import type { SettingsAccountKey, UserSettings } from "@domain/index.js";
import {
  createCallId,
  mergeMultiCallIntoUserSettings,
  matchesSipAccountIdentity,
  toMultiCallSettings,
  validateUserSettings,
  type Call,
  type CallId,
} from "@domain/index.js";
import { resolveSettingsAccountKey } from "../settings/resolveSettingsAccountKey.js";
import { loadUserSettingsWithLegacyMigration } from "../settings/loadUserSettingsWithLegacyMigration.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { InMemorySavedAccountProfileRepository } from "@adapters/settings/InMemorySavedAccountProfileRepository.js";
import { InMemoryCallHistoryRepository } from "@adapters/settings/InMemoryCallHistoryRepository.js";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import { ListSavedAccountProfilesUseCase } from "../use-cases/settings/ListSavedAccountProfilesUseCase.js";
import { SaveAccountProfileUseCase } from "../use-cases/settings/SaveAccountProfileUseCase.js";
import { DeleteSavedAccountProfileUseCase } from "../use-cases/settings/DeleteSavedAccountProfileUseCase.js";
import { TouchSavedAccountProfileUseCase } from "../use-cases/settings/TouchSavedAccountProfileUseCase.js";
import { RecordCallHistoryUseCase } from "../use-cases/contacts/RecordCallHistoryUseCase.js";
import { ListCallHistoryUseCase } from "../use-cases/contacts/ListCallHistoryUseCase.js";
import { GetCallHistoryEntryUseCase } from "../use-cases/contacts/GetCallHistoryEntryUseCase.js";
import { DeleteCallHistoryEntryUseCase } from "../use-cases/contacts/DeleteCallHistoryEntryUseCase.js";
import { RedialFromHistoryUseCase } from "../use-cases/contacts/RedialFromHistoryUseCase.js";
import { ListContactsUseCase } from "../use-cases/contacts/ListContactsUseCase.js";
import { GetContactUseCase } from "../use-cases/contacts/GetContactUseCase.js";
import { CreateContactUseCase } from "../use-cases/contacts/CreateContactUseCase.js";
import { UpdateContactUseCase } from "../use-cases/contacts/UpdateContactUseCase.js";
import { DeleteContactUseCase } from "../use-cases/contacts/DeleteContactUseCase.js";
import { CallContactUseCase } from "../use-cases/telephony/CallContactUseCase.js";
import { ImportContactsCsvUseCase } from "../use-cases/contacts/ImportContactsCsvUseCase.js";
import { ExportContactsCsvUseCase } from "../use-cases/contacts/ExportContactsCsvUseCase.js";
import type { ContactsCsvImportSummary } from "../use-cases/contacts/ImportContactsCsvUseCase.js";
import { CallHistoryRecordingOrchestrationService } from "../services/contacts/CallHistoryRecordingOrchestrationService.js";
import { LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE } from "../projections/settings/isLocalSavedProfileNotFoundError.js";
import type {
  SavedAccountProfile,
  SavedAccountProfileId,
  SavedAccountProfileInput,
  CallHistoryEntry,
  Contact,
  ContactInput,
  ContactUpdateInput,
} from "@domain/index.js";

export type AuthorizeAccountMetadataWarning =
  | "profile_save_failed"
  | "profile_touch_failed";

export type AuthorizeAccountOutcome = Readonly<{
  metadataWarning?: AuthorizeAccountMetadataWarning;
}>;

export type ContactsCsvImportOutcome = Readonly<
  | { kind: "cancelled" }
  | { kind: "imported"; summary: ContactsCsvImportSummary }
>;

export type ContactsCsvExportOutcome = Readonly<
  | { kind: "cancelled" }
  | { kind: "exported"; contactCount: number }
>;

export type ProfileScopedDataProjectionHandlers = Readonly<{
  setContactsLoading: () => void;
  setContactsLoaded: (contacts: ReadonlyArray<Contact>) => void;
  setContactsLoadError: (errorKey: string) => void;
  setCallHistoryLoading: () => void;
  setCallHistoryLoaded: (entries: ReadonlyArray<CallHistoryEntry>) => void;
  setCallHistoryLoadError: (errorKey: string) => void;
}>;

export type AccountBootstrapFacadeDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  settingsRepository: SettingsRepository;
  savedAccountProfileRepository?: SavedAccountProfileRepository;
  callHistoryRepository?: CallHistoryRepository;
  contactRepository?: ContactRepository;
  contactCsvFileGateway?: ContactCsvFileGateway;
  hostIntegrationGateway?: HostIntegrationGateway;
  logger: Logger;
  eventPublisher?: DomainEventPublisher;
}>;

export type AuthorizeManualAccountOptions = Readonly<{
  correlationId?: CorrelationId;
  saveProfile?: boolean;
}>;

export class AccountBootstrapFacade {
  readonly eventPublisher: DomainEventPublisher;
  readonly resolveStartupMode: ResolveStartupModeUseCase;
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
  readonly retryConnection: RetryConnectionUseCase;
  readonly manualSipTransportReconnect: ManualSipTransportReconnectUseCase;
  readonly reregisterSip: ReregisterSipUseCase;
  readonly safeLogout: SafeLogoutUseCase;
  readonly endUserSession: EndUserSessionUseCase;
  readonly shutdownCleanup: ShutdownCleanupUseCase;

  private readonly savedAccountProfileRepository: SavedAccountProfileRepository;
  private readonly listSavedAccountProfilesUseCase: ListSavedAccountProfilesUseCase;
  private readonly saveAccountProfileUseCase: SaveAccountProfileUseCase;
  private readonly deleteSavedAccountProfileUseCase: DeleteSavedAccountProfileUseCase;
  private readonly touchSavedAccountProfileUseCase: TouchSavedAccountProfileUseCase;

  private readonly callHistoryRepository: CallHistoryRepository;
  private readonly listCallHistoryUseCase: ListCallHistoryUseCase;
  private readonly getCallHistoryEntryUseCase: GetCallHistoryEntryUseCase;
  private readonly deleteCallHistoryEntryUseCase: DeleteCallHistoryEntryUseCase;
  private readonly redialFromHistoryUseCase: RedialFromHistoryUseCase;

  private readonly contactRepository: ContactRepository;
  private readonly listContactsUseCase: ListContactsUseCase;
  private readonly getContactUseCase: GetContactUseCase;
  private readonly createContactUseCase: CreateContactUseCase;
  private readonly updateContactUseCase: UpdateContactUseCase;
  private readonly deleteContactUseCase: DeleteContactUseCase;
  private readonly callContactUseCase: CallContactUseCase;
  private readonly importContactsCsvUseCase: ImportContactsCsvUseCase;
  private readonly exportContactsCsvUseCase: ExportContactsCsvUseCase;
  private readonly contactCsvFileGateway: ContactCsvFileGateway | null;

  private sipSessionRegistered = false;
  private readonly callEngine: CallEngine;
  private readonly sipRecoveryOrchestration: SipRecoveryOrchestrationService;

  constructor(private readonly deps: AccountBootstrapFacadeDeps) {
    this.eventPublisher = deps.eventPublisher ?? new InMemoryDomainEventBus();
    this.savedAccountProfileRepository =
      deps.savedAccountProfileRepository ?? new InMemorySavedAccountProfileRepository();
    this.listSavedAccountProfilesUseCase = new ListSavedAccountProfilesUseCase(
      this.savedAccountProfileRepository,
      deps.logger,
    );
    this.saveAccountProfileUseCase = new SaveAccountProfileUseCase(
      this.savedAccountProfileRepository,
      deps.logger,
    );
    this.deleteSavedAccountProfileUseCase = new DeleteSavedAccountProfileUseCase(
      this.savedAccountProfileRepository,
      deps.logger,
    );
    this.touchSavedAccountProfileUseCase = new TouchSavedAccountProfileUseCase(
      this.savedAccountProfileRepository,
      deps.logger,
    );
    this.callHistoryRepository =
      deps.callHistoryRepository ?? new InMemoryCallHistoryRepository();
    const recordCallHistoryUseCase = new RecordCallHistoryUseCase(
      this.callHistoryRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.listCallHistoryUseCase = new ListCallHistoryUseCase(
      this.callHistoryRepository,
      deps.logger,
    );
    this.getCallHistoryEntryUseCase = new GetCallHistoryEntryUseCase(
      this.callHistoryRepository,
      deps.logger,
    );
    this.deleteCallHistoryEntryUseCase = new DeleteCallHistoryEntryUseCase(
      this.callHistoryRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.contactRepository =
      deps.contactRepository ?? new InMemoryContactRepository();
    this.listContactsUseCase = new ListContactsUseCase(
      this.contactRepository,
      deps.logger,
    );
    this.getContactUseCase = new GetContactUseCase(
      this.contactRepository,
      deps.logger,
    );
    this.createContactUseCase = new CreateContactUseCase(
      this.contactRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.updateContactUseCase = new UpdateContactUseCase(
      this.contactRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.deleteContactUseCase = new DeleteContactUseCase(
      this.contactRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.importContactsCsvUseCase = new ImportContactsCsvUseCase(
      this.contactRepository,
      this.createContactUseCase,
      deps.logger,
    );
    this.exportContactsCsvUseCase = new ExportContactsCsvUseCase(
      this.contactRepository,
      deps.logger,
    );
    this.contactCsvFileGateway = deps.contactCsvFileGateway ?? null;
    const callHistoryRecordingOrchestration = new CallHistoryRecordingOrchestrationService(
      recordCallHistoryUseCase,
      deps.logger,
    );
    callHistoryRecordingOrchestration.subscribe(this.eventPublisher);

    const sipSessionHealthReadModel = new InMemorySipSessionHealthReadModel(
      this.eventPublisher,
    );

    this.resolveStartupMode = new ResolveStartupModeUseCase(
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
    this.redialFromHistoryUseCase = new RedialFromHistoryUseCase(
      this.callHistoryRepository,
      this.makeCallUseCase,
      deps.logger,
    );
    this.callContactUseCase = new CallContactUseCase(
      this.contactRepository,
      this.makeCallUseCase,
      deps.logger,
    );
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
      deps.logger,
    );
    this.shutdownCleanup = new ShutdownCleanupUseCase(
      sessionTeardownOrchestration,
      this.eventPublisher,
      deps.logger,
    );

    this.eventPublisher.subscribe((event) => {
      this.trackSipRegistrationState(event);
    });
  }

  private trackSipRegistrationState(event: { type: string }): void {
    if (event.type === "RegistrationSucceeded") {
      this.sipSessionRegistered = true;
      return;
    }

    if (event.type === "UnregistrationSucceeded" || event.type === "UserSessionEnded") {
      this.sipSessionRegistered = false;
    }
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

    const phoneStatus = await this.deps.settingsRepository.getPhoneStatus();
    const existingAccount = await this.deps.settingsRepository.getSipAccount();
    if (existingAccount !== null && phoneStatus !== "offline") {
      await this.registerAccount.execute({ account: existingAccount });
    }
  }

  async authorizeManualAccount(
    account: SipAccountInput,
    options?: CorrelationId | AuthorizeManualAccountOptions,
  ): Promise<Result<AuthorizeAccountOutcome, PlatformError>> {
    const resolvedOptions = resolveAuthorizeManualAccountOptions(options);
    const correlationId = resolvedOptions.correlationId;

    const switchResult = await this.ensureUnregisteredBeforeAccountSwitch(account, correlationId);
    if (isErr(switchResult)) {
      return switchResult;
    }

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
    if (isErr(registerResult)) {
      return registerResult;
    }

    try {
      await this.applyActiveProfileSettingsSideEffects();
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }

    let metadataWarning: AuthorizeAccountMetadataWarning | undefined;
    if (resolvedOptions.saveProfile === true) {
      try {
        const saveResult = await this.saveAccountProfileUseCase.execute({
          profile: {
            username: account.username,
            domain: account.domain,
            server: account.server,
          },
          ...(correlationId !== undefined ? { correlationId } : {}),
        });
        if (isErr(saveResult)) {
          this.deps.logger.warn("saved_account_profile_save_after_auth_failed", {
            ...(correlationId !== undefined ? { correlationId } : {}),
            featureId: "F-024",
            boundedContext: "Settings",
            operation: "authorize_manual_account",
            result: saveResult.error.code,
          });
          metadataWarning = "profile_save_failed";
        }
      } catch (error: unknown) {
        const normalized = normalizeUnknownError(error);
        this.deps.logger.warn("saved_account_profile_save_after_auth_failed", {
          ...(correlationId !== undefined ? { correlationId } : {}),
          featureId: "F-024",
          boundedContext: "Settings",
          operation: "authorize_manual_account",
          result: normalized.message,
        });
        metadataWarning = "profile_save_failed";
      }
    }

    if (metadataWarning === undefined) {
      return ok({});
    }

    return ok({ metadataWarning });
  }

  listSavedAccountProfiles(): Promise<Result<ReadonlyArray<SavedAccountProfile>, PlatformError>> {
    return this.listSavedAccountProfilesUseCase.execute();
  }

  listCallHistory(): Promise<Result<ReadonlyArray<CallHistoryEntry>, PlatformError>> {
    return this.listCallHistoryUseCase.execute();
  }

  getCallHistoryEntry(
    entryId: string,
    correlationId?: CorrelationId,
  ): Promise<Result<CallHistoryEntry, PlatformError>> {
    return this.getCallHistoryEntryUseCase.execute({
      entryId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  redialFromHistory(
    entryId: string,
    correlationId?: CorrelationId,
  ): Promise<Result<Call, PlatformError>> {
    return this.redialFromHistoryUseCase.execute({
      entryId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  deleteCallHistoryEntry(
    entryId: string,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    return this.deleteCallHistoryEntryUseCase.execute({
      entryId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  listContacts(): Promise<Result<ReadonlyArray<Contact>, PlatformError>> {
    return this.listContactsUseCase.execute();
  }

  getContact(
    contactId: string,
    correlationId?: CorrelationId,
  ): Promise<Result<Contact, PlatformError>> {
    return this.getContactUseCase.execute({
      contactId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  createContact(
    contact: ContactInput,
    correlationId?: CorrelationId,
  ): Promise<Result<Contact, PlatformError>> {
    return this.createContactUseCase.execute({
      contact,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  updateContact(
    contactId: string,
    update: ContactUpdateInput,
    correlationId?: CorrelationId,
  ): Promise<Result<Contact, PlatformError>> {
    return this.updateContactUseCase.execute({
      contactId,
      update,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  deleteContact(
    contactId: string,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    return this.deleteContactUseCase.execute({
      contactId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  callContact(
    contactId: string,
    correlationId?: CorrelationId,
  ): Promise<Result<Call, PlatformError>> {
    return this.callContactUseCase.execute({
      contactId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  async importContactsFromCsv(
    correlationId?: CorrelationId,
  ): Promise<Result<ContactsCsvImportOutcome, PlatformError>> {
    if (this.contactCsvFileGateway === null) {
      return err(
        createPlatformError("operation_failed", "Contacts CSV file gateway is unavailable"),
      );
    }

    const dialogResult = await this.contactCsvFileGateway.openImportDialog();
    if (dialogResult.kind === "cancelled") {
      return ok({ kind: "cancelled" });
    }
    if (dialogResult.kind === "error") {
      return err(createPlatformError("operation_failed", dialogResult.reason));
    }

    const importResult = await this.importContactsCsvUseCase.execute({
      csvContents: dialogResult.contents,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
    if (isErr(importResult)) {
      return importResult;
    }

    return ok({
      kind: "imported",
      summary: importResult.value,
    });
  }

  async exportContactsToCsv(
    correlationId?: CorrelationId,
  ): Promise<Result<ContactsCsvExportOutcome, PlatformError>> {
    if (this.contactCsvFileGateway === null) {
      return err(
        createPlatformError("operation_failed", "Contacts CSV file gateway is unavailable"),
      );
    }

    const exportResult = await this.exportContactsCsvUseCase.execute({
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
    if (isErr(exportResult)) {
      return exportResult;
    }

    const saveResult = await this.contactCsvFileGateway.saveExportDialog({
      contents: exportResult.value.csvContents,
      suggestedFileName: buildContactsCsvExportFileName(),
    });
    if (saveResult.kind === "cancelled") {
      return ok({ kind: "cancelled" });
    }
    if (saveResult.kind === "error") {
      return err(createPlatformError("operation_failed", saveResult.reason));
    }

    return ok({
      kind: "exported",
      contactCount: exportResult.value.contactCount,
    });
  }

  saveSavedAccountProfile(
    profile: SavedAccountProfileInput,
    correlationId?: CorrelationId,
  ): Promise<Result<SavedAccountProfile, PlatformError>> {
    return this.saveAccountProfileUseCase.execute({
      profile,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  deleteSavedAccountProfile(
    profileId: SavedAccountProfileId,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    return this.deleteSavedAccountProfileUseCase.execute({
      profileId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  async authorizeSavedAccountProfile(
    profileId: SavedAccountProfileId,
    password: string,
    options?: CorrelationId | AuthorizeManualAccountOptions,
  ): Promise<Result<AuthorizeAccountOutcome, PlatformError>> {
    const profile = await this.savedAccountProfileRepository.getProfileById(profileId);
    if (profile === null) {
      return err(
        createPlatformError("not_found", LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE),
      );
    }

    const resolvedOptions = resolveAuthorizeManualAccountOptions(options);
    const authorizeResult = await this.authorizeManualAccount(
      {
        username: profile.username,
        domain: profile.domain,
        server: profile.server,
        password,
      },
      resolvedOptions,
    );

    if (isErr(authorizeResult)) {
      return authorizeResult;
    }

    try {
      const touchResult = await this.touchSavedAccountProfileUseCase.execute({
        profileId,
        ...(resolvedOptions.correlationId !== undefined
          ? { correlationId: resolvedOptions.correlationId }
          : {}),
      });
      if (isErr(touchResult)) {
        this.deps.logger.warn("saved_account_profile_touch_after_auth_failed", {
          ...(resolvedOptions.correlationId !== undefined
            ? { correlationId: resolvedOptions.correlationId }
            : {}),
          featureId: "F-024",
          boundedContext: "Settings",
          operation: "authorize_saved_account_profile",
          result: touchResult.error.code,
          profileId,
        });
        return ok({
          metadataWarning:
            authorizeResult.value.metadataWarning ?? "profile_touch_failed",
        });
      }
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.deps.logger.warn("saved_account_profile_touch_after_auth_failed", {
        ...(resolvedOptions.correlationId !== undefined
          ? { correlationId: resolvedOptions.correlationId }
          : {}),
        featureId: "F-024",
        boundedContext: "Settings",
        operation: "authorize_saved_account_profile",
        result: normalized.message,
        profileId,
      });
      return ok({
        metadataWarning: authorizeResult.value.metadataWarning ?? "profile_touch_failed",
      });
    }

    return ok(authorizeResult.value);
  }

  async setPhoneStatus(status: PhoneStatus): Promise<void> {
    const result = await this.changePhoneStatus.execute({ nextStatus: status });
    if (isErr(result)) {
      return;
    }
  }

  getMultiCallSettings(): Promise<MultiCallSettings> {
    return this.deps.settingsRepository.getMultiCallSettings();
  }

  async updateMultiCallSettings(settings: MultiCallSettings): Promise<MultiCallSettings> {
    const accountKey = await this.resolveSettingsAccountKey();
    const current = await this.loadUserSettingsForAccountKey(accountKey);
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
      const settings = await this.loadUserSettingsForAccountKey(accountKey);
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
    const userSettings = await this.loadUserSettingsForAccountKey(accountKey);
    handlers.applyMultiCallSettings(toMultiCallSettings(userSettings));
  }

  async refreshProfileScopedDataProjections(
    handlers: ProfileScopedDataProjectionHandlers,
  ): Promise<void> {
    handlers.setContactsLoading();
    const contactsResult = await this.listContactsUseCase.execute();
    if (isErr(contactsResult)) {
      handlers.setContactsLoadError("contacts.error.loadFailed");
    } else {
      handlers.setContactsLoaded(contactsResult.value);
    }

    handlers.setCallHistoryLoading();
    const historyResult = await this.listCallHistoryUseCase.execute();
    if (isErr(historyResult)) {
      handlers.setCallHistoryLoadError("history.error.loadFailed");
    } else {
      handlers.setCallHistoryLoaded(historyResult.value);
    }
  }

  private async ensureUnregisteredBeforeAccountSwitch(
    targetAccount: SipAccountInput,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const currentAccount = await this.deps.settingsRepository.getSipAccount();
    if (currentAccount === null) {
      return ok(undefined);
    }

    if (matchesSipAccountIdentity(currentAccount, targetAccount)) {
      return ok(undefined);
    }

    if (!this.sipSessionRegistered) {
      return ok(undefined);
    }

    const endSessionResult = await this.endUserSession.execute(
      correlationId === undefined ? {} : { correlationId },
    );
    if (isErr(endSessionResult)) {
      return endSessionResult;
    }

    return ok(undefined);
  }

  private resolveSettingsAccountKey(): Promise<SettingsAccountKey> {
    return resolveSettingsAccountKey(this.deps.settingsRepository);
  }

  private async loadUserSettingsForAccountKey(
    accountKey: SettingsAccountKey,
  ): Promise<UserSettings> {
    const account = await this.deps.settingsRepository.getSipAccount();
    if (account === null) {
      return this.deps.settingsRepository.getUserSettings(accountKey);
    }

    return loadUserSettingsWithLegacyMigration({
      settingsRepository: this.deps.settingsRepository,
      compositeAccountKey: accountKey,
      identity: {
        username: account.username,
        domain: account.domain,
        server: account.server,
      },
      logger: this.deps.logger,
    });
  }

  private async applyActiveProfileSettingsSideEffects(): Promise<void> {
    const accountKey = await this.resolveSettingsAccountKey();
    const settings = await this.loadUserSettingsForAccountKey(accountKey);
    this.sipRecoveryOrchestration.applyRecoverySettings(settings);
    await this.callEngine.refreshAutoAnswerSchedules();
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
    await this.applyActiveProfileSettingsSideEffects();
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
    return breakReason !== undefined
      ? this.rejectCallUseCase.execute({ callId, breakReason, correlationId })
      : this.rejectCallUseCase.execute({ callId, correlationId });
  }

  async rejectCallById(
    callId: string,
    breakReason?: string,
  ): Promise<Result<Call, PlatformError>> {
    return this.rejectCall(createCallId(callId), breakReason);
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

  endUserSessionCommand(correlationId?: CorrelationId) {
    return this.endUserSession.execute(
      correlationId === undefined ? {} : { correlationId },
    );
  }

  dispose(): void {
    this.sipRecoveryOrchestration.dispose();
  }

  notifyPeerConnectionAvailable(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    return this.callEngine.handlePeerConnectionAvailable(callId, correlationId);
  }
}

function resolveAuthorizeManualAccountOptions(
  options?: CorrelationId | AuthorizeManualAccountOptions,
): AuthorizeManualAccountOptions {
  if (options === undefined) {
    return {};
  }

  if (typeof options === "string") {
    return { correlationId: options };
  }

  return options;
}

function buildContactsCsvExportFileName(): string {
  const datePart = new Date().toISOString().slice(0, 10);
  return `contacts-export-${datePart}.csv`;
}
