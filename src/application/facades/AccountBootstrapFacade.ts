import type {
  AppBootstrapConfig,
  CallMediaMode,
  PhoneStatus,
  SipAccountId,
  SipAccountInput,
} from "@domain/index.js";
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
import { SetLocalVideoMutedUseCase } from "../use-cases/media/SetLocalVideoMutedUseCase.js";
import { SetSessionViewModeUseCase } from "../use-cases/media/SetSessionViewModeUseCase.js";
import { SwitchLocalVideoSourceUseCase } from "../use-cases/media/SwitchLocalVideoSourceUseCase.js";
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
import {
  AccountLogoutOrchestrationService,
  type AccountLogoutOutcome,
} from "../services/platform/AccountLogoutOrchestrationService.js";
import { InMemorySipSessionHealthReadModel } from "../read-models/InMemorySipSessionHealthReadModel.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import type {
  DomainEventPublisher,
  HeadsetGateway,
  HostIntegrationGateway,
  LocalMediaCapturePort,
  LocalMediaStreamHandle,
  Logger,
  MediaInputDeviceInfo,
  OcpGateway,
  OcpNotificationPresenter,
  OcpProxyAuthenticatePort,
  OcpReasonsCachePort,
  SavedAccountProfileRepository,
  SettingsRepository,
  CallHistoryRepository,
  ContactRepository,
  ContactCsvFileGateway,
  PreferencesFileGateway,
  ExternalServicesCollectionFileGateway,
  TelephonyGateway,
  MediaGateway,
  SecretStoragePort,
  UserNotificationJournalRepository,
  StartCameraPreviewResult,
} from "@ports/index.js";
import { OcpIntegrationComposition } from "../services/integration/OcpIntegrationComposition.js";
import {
  isAuthorizationRetryableStage,
  resolveAuthorizationRetryStrategy,
  resolveOcpRecoveryFirstVisibleStage,
  shouldResetOcpRecoveryCompletedStages,
  type AuthorizationAttemptContext,
  type AuthorizationRetryStrategy,
} from "../projections/settings/authorizationRetryContext.js";
import {
  applyAuthorizationExecutionStage,
  clearAuthorizationProgress,
  type AuthorizationProgressStage,
} from "../projections/settings/authorizationProgressProjection.js";
import type { ChangeOperatorStatusOutcome } from "../use-cases/integration/ocp/ChangeOperatorStatusUseCase.js";
import { InMemoryOcpReasonsCache } from "@adapters/mock/InMemoryOcpReasonsCache.js";
import { CallbackOcpNotificationPresenter } from "@adapters/integration/ocp/CallbackOcpNotificationPresenter.js";
import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import type { OcpNotificationPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { MockOcpProxyAuthenticatePort } from "@adapters/mock/MockOcpProxyAuthenticatePort.js";
import {
  createSecretStorageScopeKey,
  OCP_PROXY_API_KEY_SECRET_ID,
  SIP_PASSWORD_SECRET_ID,
  type SecretStorageScopeKey,
} from "@ports/secrets/SecretStoragePort.js";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import { InMemoryUserNotificationJournalRepository } from "@adapters/settings/InMemoryUserNotificationJournalRepository.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import type { ExternalServicesComposition } from "@application/services/integration/external-services/ExternalServicesComposition.js";
import type { ExternalServicesProductSnapshot } from "@application/services/integration/external-services/ExternalServicesProductSnapshot.js";
import type { ExternalServiceExecutionResult } from "@application/services/integration/external-services/ExternalServiceExecutionResult.js";
import type { RunExternalServiceRequestNowInput } from "@application/use-cases/integration/RunExternalServiceRequestNowUseCase.js";
import type {
  QueryExternalServicesInput,
  QueryExternalServicesOutcome,
} from "@application/use-cases/integration/QueryExternalServicesUseCase.js";
import type {
  SaveExternalServicesSettingsInput,
  SaveExternalServicesSettingsOutcome,
} from "@application/use-cases/integration/SaveExternalServicesSettingsUseCase.js";
import { CallEngine } from "@application/services/telephony/CallEngine.js";
import type {
  ExternalServicesSettings,
  ExternalServiceCollection,
  ExternalServiceCollectionId,
  MultiCallSettings,
  SettingsAccountKey,
  UserSettings,
} from "@domain/index.js";
import {
  buildOcpConnectLoginOptions,
  createAccountSessionActivatedEvent,
  createCallId,
  createSettingsAccountKey,
  mergeMultiCallIntoUserSettings,
  OCP_SIGN_IN_EXECUTION_STAGES,
  resolveOcpConnectLoginTarget,
  resolveOcpProxyAuthenticateDomain,
  resolveSettingsAccountKeyFromSipAccount,
  toMultiCallSettings,
  validateUserSettings,
  parseOcpIntegrationSettings,
  createReadyAccountSignInOutcome,
  createSipRegistrationFailedAccountSignInOutcome,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSavedAccountProfileId,
  deriveSettingsAccountKeyFromIdentity,
  type AccountSignInMetadataWarning,
  type AccountSignInOutcome,
  ANONYMOUS_SETTINGS_ACCOUNT,
  toUserNotificationAccountDisplayLabel,
  type UserNotificationLevel,
  type UserNotificationModule,
  type UserNotificationTitleParam,
  type Call,
  type CallId,
  type CallVideoMediaState,
  type OcpConnectLoginOption,
  type OcpConnectLoginTarget,
  type OcpIntegrationSettings,
  type SessionViewMode,
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
import { PersistDraftAccountArtifactsUseCase } from "../use-cases/settings/PersistDraftAccountArtifactsUseCase.js";
import { AttemptScopedSecretScope } from "../services/settings/AttemptScopedSecretScope.js";
import { migrateProfileScopedSecrets } from "../services/settings/migrateProfileScopedSecrets.js";
import { ProfileSecretLifecycleService } from "../services/settings/ProfileSecretLifecycleService.js";
import { RecordUserNotificationUseCase } from "../use-cases/settings/RecordUserNotificationUseCase.js";
import {
  QueryUserNotificationJournalUseCase,
  type QueryUserNotificationJournalInput,
  type QueryUserNotificationJournalOutcome,
} from "../use-cases/settings/QueryUserNotificationJournalUseCase.js";
import {
  UserNotificationCaptureService,
  type UserNotificationCaptureOutcome,
} from "../services/settings/UserNotificationCaptureService.js";
import { PromoteAuthorizedSipSessionUseCase } from "../use-cases/settings/PromoteAuthorizedSipSessionUseCase.js";
import { ResolveSavedAccountProfileAvailabilityUseCase } from "../use-cases/settings/ResolveSavedAccountProfileAvailabilityUseCase.js";
import type { SavedAccountProfileAvailabilityView } from "../projections/settings/deriveSavedAccountProfileAvailability.js";
import {
  createAccountSignInLogoutRequiredError,
  createAccountSignInValidationError,
  validateAccountSignInCommand,
  type AccountSignInCommand,
} from "./accountSignInCommand.js";
import {
  deriveAccountSignInViewModel,
  type AccountSignInViewModel,
} from "../projections/settings/accountSignInViewModel.js";
import type { OcpRecoveryAction } from "@domain/integration/ocp/ocpDualFsm.js";
import { resolveAllowedOcpRecoveryAction } from "@domain/integration/ocp/ocpDualFsm.js";
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
import { ExportOperatorPreferencesUseCase } from "../use-cases/settings/ExportOperatorPreferencesUseCase.js";
import { ImportOperatorPreferencesUseCase } from "../use-cases/settings/ImportOperatorPreferencesUseCase.js";
import { CallHistoryRecordingOrchestrationService } from "../services/contacts/CallHistoryRecordingOrchestrationService.js";
import { MockHeadsetGateway } from "@adapters/mock/MockHeadsetGateway.js";
import { LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE } from "../projections/settings/isLocalSavedProfileNotFoundError.js";
import { HeadsetIntegrationService } from "../services/headset/HeadsetIntegrationService.js";
import type { MultiLineCallProjection } from "../projections/telephony/multiLineCallProjection.js";
import { initialMultiLineCallProjection } from "../projections/telephony/multiLineCallProjection.js";
import type { IncomingCallProjection } from "../projections/telephony/incomingCallProjection.js";
import { initialIncomingCallProjection } from "../projections/telephony/incomingCallProjection.js";
import type { HeadsetSyncBusyState } from "../headset/HeadsetSyncQueue.js";
import type {
  SavedAccountProfile,
  SavedAccountProfileId,
  SavedAccountProfileInput,
  CallHistoryEntry,
  Contact,
  ContactInput,
  ContactUpdateInput,
} from "@domain/index.js";

export type AuthorizeAccountMetadataWarning = AccountSignInMetadataWarning;
export type AuthorizeAccountOutcome = AccountSignInOutcome;

export type SavedAccountProfileSecrets = Readonly<{
  sipPassword: string | null;
  ocpApiKey: string | null;
}>;
export type CaptureUserNotificationCommand = Readonly<{
  id?: string;
  level: UserNotificationLevel;
  module: UserNotificationModule;
  functionId: string;
  titleKey?: string | null;
  titleParams?: Readonly<Record<string, UserNotificationTitleParam>>;
  titleSnapshot: string;
  popupEnabled: boolean;
  correlationId?: string | null;
}>;

export type ContactsCsvImportOutcome = Readonly<
  | { kind: "cancelled" }
  | { kind: "imported"; summary: ContactsCsvImportSummary }
>;

export type ContactsCsvExportOutcome = Readonly<
  | { kind: "cancelled" }
  | { kind: "exported"; contactCount: number; savedFileName: string }
>;

export type OperatorPreferencesImportOutcome = Readonly<
  | { kind: "cancelled" }
  | {
      kind: "imported";
      settings: UserSettings;
      sourceProfileKey: string | null;
      sourceAppVersion: string | null;
    }
>;

export type OperatorPreferencesExportOutcome = Readonly<
  | { kind: "cancelled" }
  | { kind: "exported"; savedFileName: string; profileKey: string }
>;

export type ExternalServiceCollectionImportOutcome = Readonly<
  | { kind: "cancelled" }
  | {
      kind: "imported";
      collection: ExternalServiceCollection;
      settings: UserSettings;
      settingsRevision: number;
    }
>;

export type ExternalServiceCollectionExportOutcome = Readonly<
  | { kind: "cancelled" }
  | {
      kind: "exported";
      savedFileName: string;
      collectionId: ExternalServiceCollectionId;
      collectionName: string;
    }
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
  localMediaCapturePort?: LocalMediaCapturePort;
  savedAccountProfileRepository?: SavedAccountProfileRepository;
  callHistoryRepository?: CallHistoryRepository;
  contactRepository?: ContactRepository;
  contactCsvFileGateway?: ContactCsvFileGateway;
  preferencesFileGateway?: PreferencesFileGateway;
  externalServicesCollectionFileGateway?: ExternalServicesCollectionFileGateway;
  secretStoragePort?: SecretStoragePort;
  userNotificationJournalRepository?: UserNotificationJournalRepository;
  hostIntegrationGateway?: HostIntegrationGateway;
  headsetGateway?: HeadsetGateway;
  ocpGateway?: OcpGateway;
  ocpProxyAuthenticate?: OcpProxyAuthenticatePort;
  ocpReasonsCache?: OcpReasonsCachePort;
  ocpNotificationPresenter?: OcpNotificationPresenter;
  externalServicesComposition?: ExternalServicesComposition;
  logger: Logger;
  eventPublisher?: DomainEventPublisher;
}>;

export type AuthorizeManualAccountOptions = Readonly<{
  correlationId?: CorrelationId;
  saveProfile?: boolean;
  rememberPassword?: boolean;
  /** Non-secret OCP domain persisted on draft profile when saveProfile is opted in. */
  ocpDomain?: string;
  saveOcpApiKey?: boolean;
  /** Boundary-only OCP API key; never projected or logged. */
  ocpApiKey?: string;
  /** When false, caller owns `recordAuthorizationAttempt` (saved-profile path). */
  recordAttempt?: boolean;
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
  private readonly setLocalVideoMutedUseCase: SetLocalVideoMutedUseCase | null;
  private readonly switchLocalVideoSourceUseCase: SwitchLocalVideoSourceUseCase | null;
  private readonly setSessionViewModeUseCase: SetSessionViewModeUseCase;
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
  private readonly accountLogoutOrchestration: AccountLogoutOrchestrationService;
  readonly shutdownCleanup: ShutdownCleanupUseCase;

  private readonly savedAccountProfileRepository: SavedAccountProfileRepository;
  private readonly listSavedAccountProfilesUseCase: ListSavedAccountProfilesUseCase;
  private readonly saveAccountProfileUseCase: SaveAccountProfileUseCase;
  private readonly deleteSavedAccountProfileUseCase: DeleteSavedAccountProfileUseCase;
  private readonly touchSavedAccountProfileUseCase: TouchSavedAccountProfileUseCase;
  private readonly persistDraftAccountArtifactsUseCase: PersistDraftAccountArtifactsUseCase;
  private readonly promoteAuthorizedSipSessionUseCase: PromoteAuthorizedSipSessionUseCase;
  private readonly resolveSavedAccountProfileAvailabilityUseCase: ResolveSavedAccountProfileAvailabilityUseCase;
  private readonly secretStoragePort: SecretStoragePort;
  private readonly profileSecretLifecycle: ProfileSecretLifecycleService;
  private readonly userNotificationCapture: UserNotificationCaptureService;
  private readonly queryUserNotificationJournalUseCase: QueryUserNotificationJournalUseCase;

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
  private readonly exportOperatorPreferencesUseCase: ExportOperatorPreferencesUseCase;
  private readonly importOperatorPreferencesUseCase: ImportOperatorPreferencesUseCase;
  private readonly preferencesFileGateway: PreferencesFileGateway | null;
  private readonly externalServicesCollectionFileGateway: ExternalServicesCollectionFileGateway | null;

  private sipSessionRegistered = false;
  /** SIP WebSocket transport reached connected (ADR-0004) — independent of REGISTER. */
  private sipTransportConnected = false;
  /** Local account session active (settings unlocked / Login locked) — ADR-AF-005. */
  private accountSessionActive = false;
  /** Last non-secret authorization attempt for a single Retry action (F-028). */
  private lastAuthorizationAttempt: AuthorizationAttemptContext | null = null;
  private readonly attemptScopedSecrets = new AttemptScopedSecretScope();
  /** Startup auto-register failed while `sipAutoRegisterOnStartup` is enabled (F-001). */
  private startupRegistrationFailed = false;
  /** Last SecretStorage scope used for OCP api-key (may differ from post-SIP account key). */
  private lastOcpSecretScopeKey: SecretStorageScopeKey | null = null;
  private readonly callEngine: CallEngine;
  private readonly sipRecoveryOrchestration: SipRecoveryOrchestrationService;
  private readonly headsetIntegration: HeadsetIntegrationService;
  private readonly ocpIntegration: OcpIntegrationComposition;
  private getMultiLineProjectionRef: () => MultiLineCallProjection = initialMultiLineCallProjection;
  private getIncomingProjectionRef: () => IncomingCallProjection = initialIncomingCallProjection;
  private getIsDndRef: () => boolean = () => false;
  private multiLineProjectionForToggle: MultiLineCallProjection = initialMultiLineCallProjection();

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
    this.secretStoragePort = deps.secretStoragePort ?? new InMemorySecretStorageAdapter();
    this.profileSecretLifecycle = new ProfileSecretLifecycleService(
      this.secretStoragePort,
    );
    const notificationJournalRepository =
      deps.userNotificationJournalRepository ??
      new InMemoryUserNotificationJournalRepository();
    this.userNotificationCapture = new UserNotificationCaptureService(
      new RecordUserNotificationUseCase(
        notificationJournalRepository,
        deps.logger,
      ),
    );
    this.queryUserNotificationJournalUseCase =
      new QueryUserNotificationJournalUseCase(notificationJournalRepository);
    this.persistDraftAccountArtifactsUseCase = new PersistDraftAccountArtifactsUseCase(
      this.savedAccountProfileRepository,
      this.secretStoragePort,
      deps.logger,
    );
    this.promoteAuthorizedSipSessionUseCase = new PromoteAuthorizedSipSessionUseCase(
      deps.settingsRepository,
      this.savedAccountProfileRepository,
      this.secretStoragePort,
      deps.logger,
      this.eventPublisher,
    );
    this.resolveSavedAccountProfileAvailabilityUseCase =
      new ResolveSavedAccountProfileAvailabilityUseCase(
        this.savedAccountProfileRepository,
        this.secretStoragePort,
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
    this.exportOperatorPreferencesUseCase = new ExportOperatorPreferencesUseCase(
      deps.settingsRepository,
      deps.logger,
    );
    this.importOperatorPreferencesUseCase = new ImportOperatorPreferencesUseCase(
      deps.settingsRepository,
      deps.logger,
    );
    this.preferencesFileGateway = deps.preferencesFileGateway ?? null;
    this.externalServicesCollectionFileGateway =
      deps.externalServicesCollectionFileGateway ?? null;
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
    if (deps.localMediaCapturePort !== undefined) {
      this.setLocalVideoMutedUseCase = new SetLocalVideoMutedUseCase(
        deps.localMediaCapturePort,
        this.callEngine.getVideoMediaProjection(),
        this.eventPublisher,
        deps.logger,
      );
      this.switchLocalVideoSourceUseCase = new SwitchLocalVideoSourceUseCase(
        deps.localMediaCapturePort,
        this.callEngine.getVideoMediaProjection(),
        this.eventPublisher,
        deps.logger,
      );
    } else {
      this.setLocalVideoMutedUseCase = null;
      this.switchLocalVideoSourceUseCase = null;
    }
    this.setSessionViewModeUseCase = new SetSessionViewModeUseCase(
      this.callEngine.getVideoMediaProjection(),
      this.eventPublisher,
      deps.logger,
    );
    if (deps.localMediaCapturePort?.onScreenShareEnded !== undefined) {
      deps.localMediaCapturePort.onScreenShareEnded((callId) => {
        void this.switchLocalVideoSourceById(callId, "camera", true);
      });
    }
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

    const headsetGateway = deps.headsetGateway ?? new MockHeadsetGateway();
    this.headsetIntegration = new HeadsetIntegrationService({
      gateway: headsetGateway,
      eventPublisher: this.eventPublisher,
      logger: deps.logger,
      getMultiLineProjection: () => this.getMultiLineProjectionRef(),
      getIncomingProjection: () => this.getIncomingProjectionRef(),
      callbacks: {
        answerCallById: (callId) => this.answerCallById(callId),
        rejectCallById: (callId) => this.rejectCallById(callId),
        hangupCallById: (callId) => this.hangupCallById(callId),
        toggleHoldCallById: (callId) => this.toggleHoldCallFromHeadset(callId),
        muteCallById: async (callId) => {
          const result = await this.muteCall(createCallId(callId));
          if (result.ok) {
            this.headsetIntegration.confirmUiMuteSync(callId, true);
          } else {
            this.headsetIntegration.abortUiMuteSync(callId);
          }
          return result;
        },
        unmuteCallById: async (callId) => {
          const result = await this.unmuteCall(createCallId(callId));
          if (result.ok) {
            this.headsetIntegration.confirmUiMuteSync(callId, false);
          } else {
            this.headsetIntegration.abortUiMuteSync(callId);
          }
          return result;
        },
        isDnd: () => this.getIsDndRef(),
      },
    });
    this.headsetIntegration.setPreferredDeviceChangedListener((deviceId) => {
      void this.persistHeadsetPreferredDeviceId(deviceId);
    });

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
    deps.telephonyGateway.setRemoteVideoPresenceHandler((notification) => {
      this.callEngine.handleRemoteVideoPresence(
        notification.callId,
        notification.present,
        notification.correlationId,
      );
      return Promise.resolve();
    });
    deps.telephonyGateway.setIncomingRemoteVideoOfferedHandler((notification) => {
      this.callEngine.handleIncomingRemoteVideoOffered(
        notification.callId,
        notification.offered,
        notification.correlationId,
      );
      return Promise.resolve();
    });
    deps.telephonyGateway.setCameraAvailabilityHandler((notification) => {
      this.callEngine.handleCameraAvailability(
        notification.callId,
        notification.available,
        notification.correlationId,
      );
      return Promise.resolve();
    });

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

    this.ocpIntegration = new OcpIntegrationComposition({
      ocpGateway: deps.ocpGateway ?? new MockOcpGateway(),
      eventPublisher: this.eventPublisher,
      logger: deps.logger,
      reasonsCache: deps.ocpReasonsCache ?? new InMemoryOcpReasonsCache(),
      notificationPresenter:
        deps.ocpNotificationPresenter ?? new CallbackOcpNotificationPresenter(),
      proxyAuthenticate:
        deps.ocpProxyAuthenticate ?? new MockOcpProxyAuthenticatePort(),
      authorizeSipAccount: this.authorizeSipAccount,
      registerAccount: this.registerAccount,
      promoteAuthorizedSipSession: this.promoteAuthorizedSipSessionUseCase,
      isSipRegistered: () => this.sipSessionRegistered,
      getActiveSipIdentity: async () => {
        const account = await this.getActiveSipAccount();
        if (account === null) {
          return null;
        }
        return {
          username: account.username,
          domain: account.domain,
          server: account.server,
        };
      },
      endUserSession: async (correlationId) => {
        await this.endUserSession.execute({ correlationId });
      },
      // Deferred call: INVALID_TOKEN arrives after construction; HTTP re-auth via connectOcp.
      reauthenticateOnInvalidToken: () => this.connectOcp(),
      // Application-owned fresh-token reconnect (ADR-AF-002) — never adapter stale token.
      recoverTransportWithFreshToken: (correlationId) => this.connectOcp(correlationId),
    });
    this.accountLogoutOrchestration = new AccountLogoutOrchestrationService({
      readOcpSession: () => {
        const session = this.ocpIntegration.projectionHub.getSessionProjection();
        return {
          isAuthenticated: session.isAuthenticated,
          isLive:
            session.serverState === "connected" ||
            session.serverState === "connecting" ||
            session.serverState === "reconnecting",
          hasOperatorSnapshot:
            this.ocpIntegration.projectionHub.getCurrentOperatorProfile() !== null,
        };
      },
      logoutOperator: (reasonId) =>
        this.ocpIntegration.logoutOperator.execute({
          reasonId,
          cascadeSipLogout: false,
          callType: "internal",
        }),
      disconnectOcp: () => this.ocpIntegration.disconnectOcp.execute(),
      endUserSession: () => this.endUserSession.execute(),
      disarmOcpTransportRecovery: () => {
        this.ocpIntegration.disarmTransportRecoveryForUserLogout();
      },
      resetOcpProjectionsToIdle: () => {
        this.ocpIntegration.resetProjectionsToIdleAfterUserLogout();
      },
      restoreOcpTransportRecoveryTracking: () => {
        this.ocpIntegration.restoreTransportRecoveryTrackingAfterFailedLogout();
      },
    });
    this.shutdownCleanup.registerDisposable(this.ocpIntegration);

    this.eventPublisher.subscribe((event) => {
      this.trackSipRegistrationState(event);
      if (event.type === "CallAnswered") {
        const rawCallId = event["callId"];
        if (typeof rawCallId === "string" && rawCallId.length > 0) {
          void this.applyLocalVideoAfterConnectForCall(createCallId(rawCallId));
        }
      }
    });
  }

  private async applyLocalVideoAfterConnectForCall(callId: ReturnType<typeof createCallId>): Promise<void> {
    const videoState = this.callEngine.getCallVideoMediaState(callId);
    if (videoState === null || videoState.mediaMode !== "video") {
      return;
    }

    const settingsResult = await this.getUserSettingsForAccount();
    if (!settingsResult.ok || !settingsResult.value.enableLocalVideoAfterConnect) {
      return;
    }

    await this.setLocalVideoMutedById(callId, false);
  }

  private trackSipRegistrationState(event: {
    type: string;
    profileKey?: unknown;
  }): void {
    if (event.type === "AccountSessionActivated") {
      this.accountSessionActive = true;
      void this.activateExternalServicesRuntime(event.profileKey);
      return;
    }

    if (event.type === "SipTransportConnected" || event.type === "SipTransportReconnectSucceeded") {
      this.sipTransportConnected = true;
      return;
    }

    if (
      event.type === "SipTransportDisconnected" ||
      event.type === "SipTransportConnecting" ||
      event.type === "SipTransportReconnectAttemptStarted"
    ) {
      this.sipTransportConnected = false;
      return;
    }

    if (event.type === "RegistrationSucceeded") {
      this.sipSessionRegistered = true;
      this.accountSessionActive = true;
      if (this.getOcpConnectionState() === "authenticated") {
        void this.syncOcpLinkageToActiveAccount();
      }
      return;
    }

    if (event.type === "UserSessionEnded") {
      this.sipSessionRegistered = false;
      this.sipTransportConnected = false;
      this.accountSessionActive = false;
      this.deps.externalServicesComposition?.invalidateLifecycle();
      return;
    }

    if (event.type === "UnregistrationSucceeded") {
      this.sipSessionRegistered = false;
      this.sipTransportConnected = false;
    }
  }

  private async activateExternalServicesRuntime(
    profileKeyRaw: unknown,
  ): Promise<void> {
    const composition = this.deps.externalServicesComposition;
    if (composition === undefined) {
      return;
    }
    try {
      const accountKey =
        typeof profileKeyRaw === "string" && profileKeyRaw.length > 0
          ? createSettingsAccountKey(profileKeyRaw)
          : await this.resolveSettingsAccountKey();
      const settings = await this.loadUserSettingsForAccountKey(accountKey);
      composition.activateProfile(accountKey, settings.externalServices);
    } catch (error: unknown) {
      this.deps.logger.warn("external_services_profile_activation_failed", {
        featureId: "F-031",
        boundedContext: "Integration",
        operation: "activate_external_services_profile",
        result: "failed",
        code: error instanceof Error ? error.name : "unknown",
      });
    }
  }

  /**
   * - Purpose: after SIP register from OCP creds, ensure linked+apiKey live on SIP account key.
   * - Inputs: active SIP account + last OCP secret scope (may be guest before register).
   * - Outputs: profile-scoped OCP settings for saved-account checkbox.
   *
   * Session domain is the OCP proxy hostname (set at authenticate), never `entity:creds` SIP host.
   */
  private async syncOcpLinkageToActiveAccount(): Promise<void> {
    try {
      const account = await this.deps.settingsRepository.getSipAccount();
      if (account === null) {
        return;
      }
      const targetKey = await this.resolveSettingsAccountKey();
      const targetSettings = await this.loadUserSettingsForAccountKey(targetKey);
      const domain = resolveOcpProxyAuthenticateDomain({
        settingsOcpDomain: targetSettings.ocpIntegration.domain,
        sessionOcpDomain:
          this.ocpIntegration.projectionHub.getSessionProjection().domain,
        sipAccountDomain: account.domain,
      });
      if (domain.length === 0) {
        return;
      }
      const scopeSource =
        this.lastOcpSecretScopeKey ?? createSecretStorageScopeKey(targetKey);
      const apiKey = await this.secretStoragePort.loadSecret(
        scopeSource,
        OCP_PROXY_API_KEY_SECRET_ID,
      );
      await this.saveUserSettingsInternal(targetKey, {
        ...targetSettings,
        ocpIntegration: {
          ...targetSettings.ocpIntegration,
          enabled: true,
          domain,
          linked: true,
        },
      });
      if (apiKey !== null && apiKey.trim().length > 0) {
        const scopeTarget = createSecretStorageScopeKey(targetKey);
        await this.secretStoragePort.saveSecret(
          scopeTarget,
          OCP_PROXY_API_KEY_SECRET_ID,
          apiKey,
        );
        this.lastOcpSecretScopeKey = scopeTarget;
      }
    } catch {
      // best-effort linkage sync
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

    const accountKey = await this.resolveSettingsAccountKey();
    const userSettings = await this.loadUserSettingsForAccountKey(accountKey);
    await this.purgeLegacyOcpAuthToken();
    await this.applyHeadsetUserSettings(userSettings);

    const phoneStatus = await this.deps.settingsRepository.getPhoneStatus();
    const existingAccount = await this.deps.settingsRepository.getSipAccount();
    if (existingAccount !== null) {
      // Restored disk account counts as an active local session (ADR-AF-005).
      this.eventPublisher.publish(
        createAccountSessionActivatedEvent(createCorrelationId(), {
          profileKey: resolveSettingsAccountKeyFromSipAccount(existingAccount),
        }),
      );
    }
    if (
      existingAccount !== null &&
      phoneStatus !== "offline" &&
      userSettings.sipAutoRegisterOnStartup
    ) {
      const registerResult = await this.registerAccount.execute({ account: existingAccount });
      if (isErr(registerResult)) {
        this.startupRegistrationFailed = true;
        this.deps.logger.warn("startup_sip_registration_failed", {
          featureId: "F-001",
          boundedContext: "Settings",
          operation: "initialize",
          result: registerResult.error.message,
        });
      } else {
        this.startupRegistrationFailed = false;
      }
    }

    await this.maybeAutoConnectOcp();
  }

  async authorizeManualAccount(
    account: SipAccountInput,
    options?: CorrelationId | AuthorizeManualAccountOptions,
  ): Promise<Result<AuthorizeAccountOutcome, PlatformError>> {
    const resolvedOptions = resolveAuthorizeManualAccountOptions(options);
    const correlationId = resolvedOptions.correlationId ?? createCorrelationId();
    if (resolvedOptions.recordAttempt !== false) {
      this.attemptScopedSecrets.store(correlationId, {
        sipPassword: account.password,
      });
      this.recordAuthorizationAttempt({
        kind: "manual_sip",
        correlationId,
        sipIdentity: {
          username: account.username,
          domain: account.domain,
          server: account.server,
        },
        ...(resolvedOptions.saveProfile === true ? { saveProfile: true } : {}),
        ...(resolvedOptions.rememberPassword === true
          ? { rememberPassword: true }
          : {}),
      });
    }

    const draftResult = await this.persistOptedInDraftArtifacts(account, resolvedOptions, correlationId);
    if (isErr(draftResult)) {
      return draftResult;
    }

    const sessionGate = this.rejectIfSipSessionActive();
    if (isErr(sessionGate)) {
      return sessionGate;
    }

    const authorizeResult = await this.authorizeSipAccount.execute({
      account,
      correlationId,
      source: "manual",
      promoteActiveSession: false,
    });

    if (isErr(authorizeResult)) {
      return authorizeResult;
    }

    // ADR-AF-005: promote settings/profile on Login before SIP register outcome.
    const promoteResult = await this.promoteAuthorizedSipSessionUseCase.execute({
      account: authorizeResult.value,
      correlationId,
    });
    if (isErr(promoteResult)) {
      return promoteResult;
    }

    try {
      await this.applyActiveProfileSettingsSideEffects();
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }

    const registerResult = await this.registerAccount.execute({
      account: authorizeResult.value,
      correlationId,
    });
    if (isErr(registerResult)) {
      this.startupRegistrationFailed = true;
      this.deps.logger.warn("account_sign_in_sip_registration_failed", {
        correlationId,
        featureId: "F-001",
        boundedContext: "Telephony",
        operation: "authorize_manual_account",
        result: registerResult.error.message,
        transportConnected: this.sipTransportConnected,
      });
      return ok(
        createSipRegistrationFailedAccountSignInOutcome({
          detail: registerResult.error.message,
          transportConnected: this.sipTransportConnected,
        }),
      );
    }

    this.startupRegistrationFailed = false;
    return ok(createReadyAccountSignInOutcome());
  }

  resolveSavedAccountProfileAvailability(
    profileId: SavedAccountProfileId,
    correlationId?: CorrelationId,
  ): Promise<Result<SavedAccountProfileAvailabilityView, PlatformError>> {
    return this.resolveSavedAccountProfileAvailabilityUseCase.execute({
      profileId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
  }

  /**
   * - Purpose: unified Account sign-in command (SIP-only or OCP) — ADR-AF-003 / WU-03.
   * - Inputs: typed mode, profile ref, non-secret fields, boundary-only secrets, save prefs.
   * - Outputs: SIP-ready outcome or semantic PlatformError; never unregisters an active session.
   */
  async signInAccount(
    command: AccountSignInCommand,
  ): Promise<Result<AuthorizeAccountOutcome, PlatformError>> {
    const validated = validateAccountSignInCommand(command);
    if (isErr(validated)) {
      return validated;
    }

    const sessionGate = this.rejectIfSipSessionActive();
    if (isErr(sessionGate)) {
      return sessionGate;
    }

    if (command.mode === "sip_only") {
      return this.executeSipOnlyAccountSignIn(command);
    }
    return this.executeOcpAccountSignIn(command);
  }

  /**
   * - Purpose: secret-free Account sign-in read model for shell/hooks (WU-03).
   * - Inputs: optional selected profile id for hydration flags.
   * - Outputs: profile options, secret booleans, login disabled reason, Server/Auth recovery keys.
   */
  async getAccountSignInViewModel(
    options?: Readonly<{ selectedProfileId?: SavedAccountProfileId | null }>,
  ): Promise<Result<AccountSignInViewModel, PlatformError>> {
    const profilesResult = await this.listSavedAccountProfiles();
    if (isErr(profilesResult)) {
      return profilesResult;
    }

    const availabilities: SavedAccountProfileAvailabilityView[] = [];
    for (const profile of profilesResult.value) {
      const availability = await this.resolveSavedAccountProfileAvailability(profile.id);
      if (isErr(availability)) {
        return availability;
      }
      availabilities.push(availability.value);
    }

    const session = this.ocpIntegration.projectionHub.getSessionProjection();
    const activeSessionProfileId = this.accountSessionActive
      ? await this.resolveSettingsAccountKey()
      : null;
    return ok(
      deriveAccountSignInViewModel({
        isSipRegistered: this.sipSessionRegistered,
        hasActiveAccountSession: this.accountSessionActive,
        availabilities,
        selectedProfileId: options?.selectedProfileId ?? null,
        activeSessionProfileId,
        dualFsm: {
          serverState: session.serverState,
          authorizationState: session.authorizationState,
          terminalSessionClosed: session.connectionState === "sessionClosed",
        },
        authorizationProgress: session.authorizationProgress,
      }),
    );
  }

  /**
   * - Purpose: dispatch an explicit dual-FSM recovery action (ADR-AF-002 / WU-03).
   * - Inputs: recovery action key validated against current Server/Auth snapshot.
   * - Outputs: recovery result; rejects actions not allowed by the dual FSM.
   */
  async dispatchAccountRecoveryAction(
    action: OcpRecoveryAction,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const session = this.ocpIntegration.projectionHub.getSessionProjection();
    const allowed = resolveAllowedOcpRecoveryAction(
      {
        serverState: session.serverState,
        authorizationState: session.authorizationState,
        terminalSessionClosed: session.connectionState === "sessionClosed",
      },
      action,
    );
    if (allowed === null) {
      return err(
        createPlatformError("operation_failed", "authorization_retry_unavailable", {
          reason: "authorization_retry_unavailable",
        }),
      );
    }

    const retryCorrelationId = correlationId ?? createCorrelationId();
    this.deps.logger.info("account_recovery_action_requested", {
      correlationId: retryCorrelationId,
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "dispatch_account_recovery_action",
      action: allowed,
      result: "requested",
    });

    switch (allowed) {
      case "retry_authorization": {
        if (session.activeAttemptId === null) {
          return err(
            createPlatformError("operation_failed", "ocp_auth_retry_no_attempt", {
              reason: "ocp_auth_retry_no_attempt",
            }),
          );
        }
        const retryResult =
          await this.ocpIntegration.backedSignIn.retryAuthorization({
            operationCorrelationId: retryCorrelationId,
            targetAttemptId: session.activeAttemptId,
          });
        if (isErr(retryResult)) {
          return retryResult;
        }
        return retryResult.value.phase === "sip_ready"
          ? ok(undefined)
          : err(retryResult.value.error);
      }
      case "retry_server":
      case "reconnect":
        return this.executeOcpRecoveryRepeatSignIn(retryCorrelationId);
      default: {
        const _exhaustive: never = allowed;
        return _exhaustive;
      }
    }
  }

  private async persistOptedInDraftArtifacts(
    account: SipAccountInput,
    options: AuthorizeManualAccountOptions,
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const saveProfile = options.saveProfile === true;
    const rememberPassword = options.rememberPassword === true;
    const saveOcpApiKey = options.saveOcpApiKey === true;
    if (!saveProfile && !rememberPassword && !saveOcpApiKey) {
      return ok(undefined);
    }

    const draftResult = await this.persistDraftAccountArtifactsUseCase.execute({
      profile: {
        username: account.username,
        domain: account.domain,
        server: account.server,
      },
      saveProfile,
      rememberPassword,
      ...(rememberPassword ? { sipPassword: account.password } : {}),
      ...(options.ocpDomain !== undefined ? { ocpDomain: options.ocpDomain } : {}),
      saveOcpApiKey,
      ...(saveOcpApiKey && options.ocpApiKey !== undefined
        ? { ocpApiKey: options.ocpApiKey }
        : {}),
      correlationId,
    });

    if (isErr(draftResult)) {
      return draftResult;
    }
    return ok(undefined);
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
      savedFileName: saveResult.savedFileName,
    });
  }

  async importOperatorPreferences(
    correlationId?: CorrelationId,
  ): Promise<Result<OperatorPreferencesImportOutcome, PlatformError>> {
    if (this.preferencesFileGateway === null) {
      return err(
        createPlatformError("operation_failed", "Preferences file gateway is unavailable"),
      );
    }

    const dialogResult = await this.preferencesFileGateway.openImportDialog();
    if (dialogResult.kind === "cancelled") {
      return ok({ kind: "cancelled" });
    }
    if (dialogResult.kind === "error") {
      return err(createPlatformError("operation_failed", dialogResult.reason));
    }

    const importResult = await this.importOperatorPreferencesUseCase.execute({
      jsonContents: dialogResult.contents,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
    if (isErr(importResult)) {
      return importResult;
    }

    await this.applyHeadsetUserSettings(importResult.value.settings);
    this.deps.externalServicesComposition?.replaceActiveSettings(
      importResult.value.settings.externalServices,
    );

    return ok({
      kind: "imported",
      settings: importResult.value.settings,
      sourceProfileKey: importResult.value.sourceProfileKey,
      sourceAppVersion: importResult.value.sourceAppVersion,
    });
  }

  async exportOperatorPreferences(
    input: Readonly<{ correlationId?: CorrelationId; appVersion?: string | null }> = {},
  ): Promise<Result<OperatorPreferencesExportOutcome, PlatformError>> {
    if (this.preferencesFileGateway === null) {
      return err(
        createPlatformError("operation_failed", "Preferences file gateway is unavailable"),
      );
    }

    const exportResult = await this.exportOperatorPreferencesUseCase.execute({
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.appVersion !== undefined ? { appVersion: input.appVersion } : {}),
    });
    if (isErr(exportResult)) {
      return exportResult;
    }

    const saveResult = await this.preferencesFileGateway.saveExportDialog({
      contents: exportResult.value.jsonContents,
      suggestedFileName: buildPreferencesExportFileName(),
    });
    if (saveResult.kind === "cancelled") {
      return ok({ kind: "cancelled" });
    }
    if (saveResult.kind === "error") {
      return err(createPlatformError("operation_failed", saveResult.reason));
    }

    return ok({
      kind: "exported",
      savedFileName: saveResult.savedFileName,
      profileKey: exportResult.value.profileKey,
    });
  }

  async importExternalServiceCollection(
    correlationId?: CorrelationId,
  ): Promise<Result<ExternalServiceCollectionImportOutcome, PlatformError>> {
    if (this.externalServicesCollectionFileGateway === null) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services collection file gateway is unavailable",
        ),
      );
    }
    const composition = this.deps.externalServicesComposition;
    if (composition === undefined) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services runtime is unavailable.",
          { reason: "external_services_unavailable" },
        ),
      );
    }

    const dialogResult =
      await this.externalServicesCollectionFileGateway.openImportDialog();
    if (dialogResult.kind === "cancelled") {
      return ok({ kind: "cancelled" });
    }
    if (dialogResult.kind === "error") {
      return err(createPlatformError("operation_failed", dialogResult.reason));
    }

    try {
      const importResult = await composition.importExternalServiceCollection({
        jsonContents: dialogResult.contents,
        ...(correlationId !== undefined ? { correlationId } : {}),
      });
      if (isErr(importResult)) {
        return importResult;
      }

      return ok({
        kind: "imported",
        collection: importResult.value.collection,
        settings: importResult.value.settings,
        settingsRevision: importResult.value.settingsRevision,
      });
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  async exportExternalServiceCollection(
    collectionId: ExternalServiceCollectionId,
    correlationId?: CorrelationId,
  ): Promise<Result<ExternalServiceCollectionExportOutcome, PlatformError>> {
    if (this.externalServicesCollectionFileGateway === null) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services collection file gateway is unavailable",
        ),
      );
    }
    const composition = this.deps.externalServicesComposition;
    if (composition === undefined) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services runtime is unavailable.",
          { reason: "external_services_unavailable" },
        ),
      );
    }

    try {
      const exportResult = await composition.exportExternalServiceCollection({
        collectionId,
        ...(correlationId !== undefined ? { correlationId } : {}),
      });
      if (isErr(exportResult)) {
        return exportResult;
      }

      const saveResult =
        await this.externalServicesCollectionFileGateway.saveExportDialog({
          contents: exportResult.value.jsonContents,
          suggestedFileName: exportResult.value.suggestedFileName,
        });
      if (saveResult.kind === "cancelled") {
        return ok({ kind: "cancelled" });
      }
      if (saveResult.kind === "error") {
        return err(createPlatformError("operation_failed", saveResult.reason));
      }

      return ok({
        kind: "exported",
        savedFileName: saveResult.savedFileName,
        collectionId: exportResult.value.collectionId,
        collectionName: exportResult.value.collectionName,
      });
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
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

  async deleteSavedAccountProfile(
    profileId: SavedAccountProfileId,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const profile =
      await this.savedAccountProfileRepository.getProfileById(profileId);
    const secretScopes: string[] = [profileId];
    if (profile !== null) {
      const identity = {
        username: profile.username,
        domain: profile.domain,
        server: profile.server,
      };
      secretScopes.push(
        deriveSettingsAccountKeyFromIdentity(identity),
        deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity(identity),
      );
    }
    try {
      await this.profileSecretLifecycle.deleteAllScopes(secretScopes);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }

    const deleteResult = await this.deleteSavedAccountProfileUseCase.execute({
      profileId,
      ...(correlationId !== undefined ? { correlationId } : {}),
    });

    if (isErr(deleteResult)) {
      return deleteResult;
    }

    return deleteResult;
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
    const resolvedPassword = await this.resolvePasswordForSavedProfileAuthorize(profileId, password);
    if (isErr(resolvedPassword)) {
      return resolvedPassword;
    }

    const correlationId = resolvedOptions.correlationId ?? createCorrelationId();
    if (resolvedPassword.value.length > 0) {
      this.attemptScopedSecrets.store(correlationId, {
        sipPassword: resolvedPassword.value,
      });
    }
    this.recordAuthorizationAttempt({
      kind: "saved_profile_sip",
      correlationId,
      profileId,
      sipIdentity: {
        username: profile.username,
        domain: profile.domain,
        server: profile.server,
      },
      usedRememberedPassword: password.trim().length === 0,
      ...(resolvedOptions.rememberPassword === true
        ? { rememberPassword: true }
        : {}),
    });

    const authorizeResult = await this.authorizeManualAccount(
      {
        username: profile.username,
        domain: profile.domain,
        server: profile.server,
        password: resolvedPassword.value,
      },
      { ...resolvedOptions, correlationId, recordAttempt: false },
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
        return ok(
          appendAccountMetadataWarning(authorizeResult.value, "profile_touch_failed"),
        );
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
      return ok(
        appendAccountMetadataWarning(authorizeResult.value, "profile_touch_failed"),
      );
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

  async captureUserNotification(
    command: CaptureUserNotificationCommand,
  ): Promise<Result<UserNotificationCaptureOutcome, PlatformError>> {
    const accountKey = await this.resolveSettingsAccountKey();
    return this.userNotificationCapture.capture({
      popupEnabled: command.popupEnabled,
      notification: {
        ...(command.id !== undefined ? { id: command.id } : {}),
        accountKey,
        accountDisplayLabel:
          accountKey === ANONYMOUS_SETTINGS_ACCOUNT
            ? "system"
            : toUserNotificationAccountDisplayLabel(accountKey),
        level: command.level,
        module: command.module,
        functionId: command.functionId,
        titleKey: command.titleKey ?? null,
        titleParams: command.titleParams ?? {},
        titleSnapshot: command.titleSnapshot,
        suppressedAtEmission: !command.popupEnabled,
        correlationId: command.correlationId ?? null,
      },
    });
  }

  queryUserNotificationJournal(
    input: QueryUserNotificationJournalInput = {},
  ): Promise<QueryUserNotificationJournalOutcome> {
    return this.queryUserNotificationJournalUseCase.execute(input);
  }

  async saveUserSettings(
    settings: UserSettings,
  ): Promise<Result<UserSettings, PlatformError>> {
    try {
      const accountKey = await this.resolveSettingsAccountKey();
      const saved = await this.saveUserSettingsInternal(accountKey, settings);
      await this.applyHeadsetUserSettings(saved);
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

  /**
   * - Purpose: block Account sign-in while a local account session is active (ADR-AF-005).
   * - Inputs: none (reads facade account-session flag).
   * - Outputs: logout-required error; never unregisters/switches identity.
   */
  private rejectIfSipSessionActive(): Result<void, PlatformError> {
    if (!this.accountSessionActive) {
      return ok(undefined);
    }
    return err(createAccountSignInLogoutRequiredError());
  }

  private async executeSipOnlyAccountSignIn(
    command: AccountSignInCommand,
  ): Promise<Result<AuthorizeAccountOutcome, PlatformError>> {
    const save = command.save ?? {};
    const options: AuthorizeManualAccountOptions = {
      ...(command.correlationId !== undefined
        ? { correlationId: command.correlationId }
        : {}),
      ...(save.saveProfile === true ? { saveProfile: true } : {}),
      ...(save.rememberPassword === true ? { rememberPassword: true } : {}),
      ...(save.saveOcpApiKey === true ? { saveOcpApiKey: true } : {}),
      ...(command.ocp?.domain !== undefined ? { ocpDomain: command.ocp.domain } : {}),
      ...(command.ocp?.apiKey !== undefined ? { ocpApiKey: command.ocp.apiKey } : {}),
    };

    if (command.profile.kind === "saved") {
      return this.authorizeSavedAccountProfile(
        command.profile.profileId,
        command.sip?.password ?? "",
        options,
      );
    }

    const sip = command.sip;
    if (sip === undefined) {
      return err(
        createAccountSignInValidationError("account.signIn.validation.sipFieldsRequired"),
      );
    }

    return this.authorizeManualAccount(
      {
        username: sip.username,
        domain: sip.domain,
        server: sip.server,
        password: sip.password ?? "",
      },
      options,
    );
  }

  private async executeOcpAccountSignIn(
    command: AccountSignInCommand,
  ): Promise<Result<AuthorizeAccountOutcome, PlatformError>> {
    const correlationId = command.correlationId ?? createCorrelationId();
    const save = command.save ?? {};
    const persistApiKey = save.saveOcpApiKey === true;
    const login = (command.ocp?.login ?? "").trim();
    const domain = command.ocp?.domain?.trim() ?? "";
    const boundaryApiKey = command.ocp?.apiKey?.trim() ?? "";

    // Persist opted-in draft first so login-target resolution uses the composite profile key.
    if (
      command.profile.kind === "new_draft" &&
      (save.saveProfile === true || save.rememberPassword === true || persistApiKey)
    ) {
      if (login.length === 0 || domain.length === 0) {
        return err(
          createAccountSignInValidationError(
            login.length === 0
              ? "account.signIn.validation.ocpLoginRequired"
              : "account.signIn.validation.ocpConfigRequired",
          ),
        );
      }
      const sipIdentity = command.sip ?? {
        username: login,
        domain,
        server: `sip:${domain}`,
      };
      const boundarySipPassword = command.sip?.password?.trim() ?? "";
      const rememberPasswordNow =
        save.rememberPassword === true && boundarySipPassword.length > 0;
      const draftResult = await this.persistDraftAccountArtifactsUseCase.execute({
        profile: {
          username: sipIdentity.username,
          domain: sipIdentity.domain.length > 0 ? sipIdentity.domain : domain,
          server:
            sipIdentity.server.trim().length > 0
              ? sipIdentity.server
              : `sip:${domain}`,
        },
        saveProfile: save.saveProfile === true,
        rememberPassword: rememberPasswordNow,
        ...(rememberPasswordNow ? { sipPassword: boundarySipPassword } : {}),
        ocpDomain: domain,
        saveOcpApiKey: persistApiKey,
        ...(persistApiKey && boundaryApiKey.length > 0
          ? { ocpApiKey: boundaryApiKey }
          : {}),
        correlationId,
      });
      if (isErr(draftResult)) {
        return draftResult;
      }
    }

    const materials = await this.resolveOcpAccountSignInMaterials(command);
    if (isErr(materials)) {
      return materials;
    }

    const { login: resolvedLogin, domain: resolvedDomain, apiKey, accountKey } =
      materials.value;

    if (
      command.profile.kind === "saved" &&
      (save.saveProfile === true || save.rememberPassword === true || persistApiKey)
    ) {
      // Never write OCP proxy host into SIP domain/server — keep existing SIP identity.
      // SIP fields are corrected from entity:creds after connect (persistOcpDerivedSipArtifacts).
      const existingProfile = await this.savedAccountProfileRepository.getProfileById(
        command.profile.profileId,
      );
      const sipIdentity =
        existingProfile !== null
          ? {
              username: existingProfile.username,
              domain: existingProfile.domain,
              server: existingProfile.server,
            }
          : command.sip !== undefined
            ? {
                username: command.sip.username,
                domain: command.sip.domain,
                server: command.sip.server,
              }
            : {
                username: resolvedLogin,
                domain: resolvedDomain,
                server: `sip:${resolvedDomain}`,
              };
      const boundarySipPassword = command.sip?.password?.trim() ?? "";
      const rememberPasswordNow =
        save.rememberPassword === true && boundarySipPassword.length > 0;
      const draftResult = await this.persistDraftAccountArtifactsUseCase.execute({
        profile: sipIdentity,
        saveProfile: save.saveProfile === true,
        rememberPassword: rememberPasswordNow,
        ...(rememberPasswordNow ? { sipPassword: boundarySipPassword } : {}),
        ocpDomain: resolvedDomain,
        saveOcpApiKey: persistApiKey,
        ...(persistApiKey ? { ocpApiKey: apiKey } : {}),
        correlationId,
      });
      if (isErr(draftResult)) {
        return draftResult;
      }
    }

    const domainPersistResult = await this.ensureOcpDomainForAccount({
      accountKey,
      domain: resolvedDomain,
      correlationId,
    });
    if (isErr(domainPersistResult)) {
      return domainPersistResult;
    }

    // ADR-AF-005: select the provisional bucket atomically before unlocking Settings.
    try {
      await this.deps.settingsRepository.setActiveProfileKey(accountKey);
      await this.applyActiveProfileSettingsSideEffects();
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.deps.logger.warn("ocp_account_session_activation_failed", {
        correlationId,
        featureId: "F-028",
        boundedContext: "Settings",
        operation: "execute_ocp_account_sign_in",
        result: normalized.message,
      });
      return err(normalized);
    }
    this.eventPublisher.publish(
      createAccountSessionActivatedEvent(correlationId, { profileKey: accountKey }),
    );

    if (persistApiKey) {
      const keyResult = await this.saveOcpProxyApiKey(apiKey, {
        accountKey,
        correlationId,
      });
      if (isErr(keyResult)) {
        return keyResult;
      }
    }

    this.attemptScopedSecrets.store(correlationId, { ocpApiKey: apiKey });
    this.recordAuthorizationAttempt({
      kind: "saved_profile_ocp",
      correlationId,
      login: resolvedLogin,
      accountKey,
    });

    // Prefer connectOcp when a persisted key exists; otherwise use boundary key once.
    if (!persistApiKey && boundaryApiKey.length > 0) {
      const signInResult = await this.ocpIntegration.backedSignIn.execute({
        domain: resolvedDomain,
        login: resolvedLogin,
        apiKey,
        correlationId,
      });
      if (isErr(signInResult)) {
        return signInResult;
      }
      if (signInResult.value.phase === "ocp_authenticated_sip_failed") {
        await this.markOcpLinked(
          (await this.loadUserSettingsForAccountKey(accountKey)).ocpIntegration,
          correlationId,
          accountKey,
        );
        return err(signInResult.value.error);
      }
      const linkedResult = await this.markOcpLinked(
        (await this.loadUserSettingsForAccountKey(accountKey)).ocpIntegration,
        correlationId,
        accountKey,
      );
      if (isErr(linkedResult)) {
        return linkedResult;
      }
      const rememberResult =
        await this.persistOcpDerivedSipArtifacts(command, correlationId);
      if (isErr(rememberResult)) {
        return rememberResult;
      }
      this.startupRegistrationFailed = false;
      return ok(createReadyAccountSignInOutcome());
    }

    const connectResult = await this.connectOcp({
      login: resolvedLogin,
      accountKey,
      correlationId,
    });
    if (isErr(connectResult)) {
      return connectResult;
    }
    const rememberResult =
      await this.persistOcpDerivedSipArtifacts(command, correlationId);
    if (isErr(rememberResult)) {
      return rememberResult;
    }
    return ok(createReadyAccountSignInOutcome());
  }

  /**
   * - Purpose: after OCP entity:creds authorize+register, persist SIP identity from creds.
   * - Inputs: sign-in save flags + active SipAccount (username/password/domain/server from creds).
   * - Outputs: saved profile metadata with SIP domain/server + optional password; migrates
   *   secrets off provisional OCP-host draft keys (ADR-AF-001). Never stores OCP Domain as SIP.
   */
  private async persistOcpDerivedSipArtifacts(
    command: AccountSignInCommand,
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const saveProfile = command.save?.saveProfile === true;
    const rememberPassword = command.save?.rememberPassword === true;
    if (!saveProfile && !rememberPassword) {
      return ok(undefined);
    }

    try {
      const account = await this.deps.settingsRepository.getSipAccount();
      if (account === null || account.password.length === 0) {
        return err(
          createPlatformError("not_found", "ocp_derived_sip_password_missing", {
            reason: "ocp_derived_sip_password_missing",
          }),
        );
      }

      const sipIdentity = {
        username: account.username,
        domain: account.domain,
        server: account.server,
      };
      const sipProfileId = deriveSavedAccountProfileId(sipIdentity);
      const ocpDomain = command.ocp?.domain?.trim() ?? "";
      const provisionalLogin = (command.ocp?.login ?? account.username).trim();

      const provisionalKeys = new Set<SettingsAccountKey>([
        deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity(sipIdentity),
      ]);
      if (ocpDomain.length > 0 && provisionalLogin.length > 0) {
        provisionalKeys.add(
          deriveSavedAccountProfileId({
            username: provisionalLogin,
            domain: ocpDomain,
            server: `sip:${ocpDomain}`,
          }),
        );
      }
      if (command.sip !== undefined) {
        provisionalKeys.add(
          deriveSavedAccountProfileId({
            username: command.sip.username,
            domain: command.sip.domain,
            server: command.sip.server,
          }),
        );
      }

      for (const fromKey of provisionalKeys) {
        if (fromKey === sipProfileId) {
          continue;
        }
        await migrateProfileScopedSecrets({
          secretStorage: this.secretStoragePort,
          fromScopeKey: fromKey,
          toScopeKey: sipProfileId,
          logger: this.deps.logger,
          correlationId,
        });
        // Retire provisional OCP API key after copy — profile id is replaced by SIP identity.
        await this.secretStoragePort.deleteSecret(
          createSecretStorageScopeKey(fromKey),
          OCP_PROXY_API_KEY_SECRET_ID,
        );
      }

      if (saveProfile) {
        await this.savedAccountProfileRepository.saveProfile(sipIdentity, {
          lifecycleStatus: "successful",
          successfulUseAt: new Date().toISOString(),
          ...(ocpDomain.length > 0 ? { ocpDomain } : {}),
        });

        for (const fromKey of provisionalKeys) {
          if (fromKey === sipProfileId) {
            continue;
          }
          const provisionalProfile =
            await this.savedAccountProfileRepository.getProfileById(fromKey);
          if (provisionalProfile !== null) {
            await this.savedAccountProfileRepository.deleteProfile(
              provisionalProfile.id,
            );
          }
        }
      }

      if (rememberPassword) {
        await this.secretStoragePort.saveSecret(
          createSecretStorageScopeKey(sipProfileId),
          SIP_PASSWORD_SECRET_ID,
          account.password,
        );
      }

      this.deps.logger.info("ocp_derived_sip_artifacts_persisted", {
        correlationId,
        featureId: "F-024",
        boundedContext: "Settings",
        operation: "persist_ocp_derived_sip_artifacts",
        result: "succeeded",
        profileId: sipProfileId,
        saveProfile,
        rememberPassword,
      });
      return ok(undefined);
    } catch (error: unknown) {
      this.deps.logger.warn("ocp_derived_sip_artifacts_persist_failed", {
        correlationId,
        featureId: "F-024",
        boundedContext: "Settings",
        operation: "persist_ocp_derived_sip_artifacts",
        result: normalizeUnknownError(error).message,
      });
      return err(normalizeUnknownError(error));
    }
  }

  private async ensureOcpDomainForAccount(
    input: Readonly<{
      accountKey: SettingsAccountKey;
      domain: string;
      correlationId: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    let current: UserSettings;
    try {
      current = await this.loadUserSettingsForAccountKey(input.accountKey);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
    if (current.ocpIntegration.domain.trim() === input.domain.trim()) {
      return ok(undefined);
    }
    const updateResult = await this.updateOcpSettings(
      {
        ...current.ocpIntegration,
        enabled: true,
        domain: input.domain.trim(),
      },
      {
        accountKey: input.accountKey,
        correlationId: input.correlationId,
      },
    );
    if (isErr(updateResult)) {
      return updateResult;
    }
    return ok(undefined);
  }

  /**
   * - Purpose: resolve OCP proxy hostname for HTTP authenticate; heal SIP-polluted settings.
   * - Inputs: account key + loaded settings for that bucket.
   * - Outputs: OCP domain string or validation_failed when unresolved.
   */
  private async resolveAndHealOcpProxyDomain(input: Readonly<{
    accountKey: SettingsAccountKey;
    settings: UserSettings;
    correlationId: CorrelationId;
  }>): Promise<Result<string, PlatformError>> {
    let profileOcpDomain: string | undefined;
    const profilesResult = await this.listSavedAccountProfiles();
    if (profilesResult.ok) {
      const profile = profilesResult.value.find(
        (candidate) => candidate.id === input.accountKey,
      );
      profileOcpDomain = profile?.ocpDomain;
    }

    let sipAccountDomain: string | undefined;
    try {
      const account = await this.deps.settingsRepository.getSipAccount();
      sipAccountDomain = account?.domain;
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }

    const domain = resolveOcpProxyAuthenticateDomain({
      settingsOcpDomain: input.settings.ocpIntegration.domain,
      ...(profileOcpDomain !== undefined ? { profileOcpDomain } : {}),
      sessionOcpDomain:
        this.ocpIntegration.projectionHub.getSessionProjection().domain,
      ...(sipAccountDomain !== undefined ? { sipAccountDomain } : {}),
    });

    if (domain.length === 0) {
      return err(
        createPlatformError("validation_failed", "domain_required", {
          reason: "domain_required",
        }),
      );
    }

    if (domain !== input.settings.ocpIntegration.domain.trim()) {
      const healResult = await this.ensureOcpDomainForAccount({
        accountKey: input.accountKey,
        domain,
        correlationId: input.correlationId,
      });
      if (isErr(healResult)) {
        return healResult;
      }
    }

    return ok(domain);
  }

  private async resolveOcpAccountSignInMaterials(
    command: AccountSignInCommand,
  ): Promise<
    Result<
      Readonly<{
        login: string;
        domain: string;
        apiKey: string;
        accountKey: SettingsAccountKey;
      }>,
      PlatformError
    >
  > {
    const login = (command.ocp?.login ?? "").trim();
    if (login.length === 0) {
      return err(
        createAccountSignInValidationError("account.signIn.validation.ocpLoginRequired"),
      );
    }

    if (command.profile.kind === "saved") {
      const availability = await this.resolveSavedAccountProfileAvailability(
        command.profile.profileId,
        command.correlationId,
      );
      if (isErr(availability)) {
        return availability;
      }

      const accountKey = command.profile.profileId;
      let settings: UserSettings;
      try {
        settings = await this.loadUserSettingsForAccountKey(accountKey);
      } catch (error: unknown) {
        return err(normalizeUnknownError(error));
      }

      const domain =
        command.ocp?.domain?.trim() ||
        availability.value.profile.ocpDomain?.trim() ||
        settings.ocpIntegration.domain.trim();

      let apiKey = command.ocp?.apiKey?.trim() ?? "";
      if (apiKey.length === 0) {
        try {
          const scopeKey = createSecretStorageScopeKey(accountKey);
          apiKey =
            (
              await this.secretStoragePort.loadSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID)
            )?.trim() ?? "";
        } catch (error: unknown) {
          return err(normalizeUnknownError(error));
        }
      }

      if (domain.length === 0 || apiKey.length === 0) {
        return err(
          createAccountSignInValidationError("account.signIn.validation.ocpConfigRequired"),
        );
      }

      return ok({ login, domain, apiKey, accountKey });
    }

    const domain = command.ocp?.domain?.trim() ?? "";
    const apiKey = command.ocp?.apiKey?.trim() ?? "";
    if (domain.length === 0 || apiKey.length === 0) {
      return err(
        createAccountSignInValidationError("account.signIn.validation.ocpConfigRequired"),
      );
    }

    const profilesResult = await this.listSavedAccountProfiles();
    if (isErr(profilesResult)) {
      return profilesResult;
    }
    const targetResult = resolveOcpConnectLoginTarget(login, profilesResult.value);
    if (!targetResult.ok) {
      return err(
        createPlatformError("validation_failed", targetResult.reason, {
          reason: targetResult.reason,
        }),
      );
    }

    return ok({
      login: targetResult.value.login,
      domain,
      apiKey,
      accountKey: targetResult.value.accountKey,
    });
  }

  private async executeOcpRecoveryRepeatSignIn(
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const context = this.lastAuthorizationAttempt;
    if (context === null) {
      return this.connectOcp(correlationId);
    }
    const attemptSecrets = this.attemptScopedSecrets.read(context.correlationId);
    if (
      (context.kind === "saved_profile_ocp" ||
        context.kind === "ocp_integrations_connect") &&
      context.accountKey !== undefined &&
      context.login !== undefined &&
      attemptSecrets?.ocpApiKey !== undefined
    ) {
      const settings = await this.loadUserSettingsForAccountKey(context.accountKey);
      const domainResult = await this.resolveAndHealOcpProxyDomain({
        accountKey: context.accountKey,
        settings,
        correlationId,
      });
      if (isErr(domainResult)) {
        return domainResult;
      }
      const retryResult = await this.ocpIntegration.backedSignIn.retryServer({
        domain: domainResult.value,
        login: context.login,
        apiKey: attemptSecrets.ocpApiKey,
        correlationId,
      });
      if (isErr(retryResult)) {
        return retryResult;
      }
      return retryResult.value.phase === "sip_ready"
        ? ok(undefined)
        : err(retryResult.value.error);
    }
    // Active-bucket OCP attempts must not force login-picker scope on retry.
    if (context.kind === "saved_profile_ocp") {
      return this.connectOcp(correlationId);
    }
    if (context.kind === "ocp_integrations_connect") {
      return this.connectOcp({
        login: context.login ?? "",
        ...(context.accountKey !== undefined ? { accountKey: context.accountKey } : {}),
        correlationId,
      });
    }
    return this.connectOcp(correlationId);
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

    const activeKey = resolveSettingsAccountKeyFromSipAccount(account);
    // Cross-profile load must not run active-SIP identity legacy migration.
    if (accountKey !== activeKey) {
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
    await this.applyHeadsetUserSettings(settings);
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
    // Only mutate live recovery/auto-answer when saving the active profile bucket.
    const activeKey = await this.resolveSettingsAccountKey();
    if (accountKey === activeKey) {
      this.sipRecoveryOrchestration.applyRecoverySettings(validated.value);
      await this.callEngine.refreshAutoAnswerSchedules();
      this.deps.externalServicesComposition?.replaceActiveSettings(
        validated.value.externalServices,
      );
    }
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

  async makeCall(
    number: string,
    callId?: CallId,
    mediaMode?: CallMediaMode,
  ): Promise<Result<Call, PlatformError>> {
    const callInput = {
      number,
      ...(callId !== undefined ? { callId } : {}),
      ...(mediaMode !== undefined ? { mediaMode } : {}),
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
    if (!this.headsetIntegration.beginUiHoldSync(callId, "hold")) {
      return err(createPlatformError("operation_failed", "headset_sync_in_progress"));
    }
    const result = await this.holdCall(createCallId(callId));
    if (!result.ok) {
      this.headsetIntegration.abortUiHoldSync(callId);
    }
    return result;
  }

  async resumeCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.resumeCallUseCase.execute({ callId });
  }

  async resumeCallById(callId: string): Promise<Result<Call, PlatformError>> {
    if (!this.headsetIntegration.beginUiHoldSync(callId, "resume")) {
      return err(createPlatformError("operation_failed", "headset_sync_in_progress"));
    }
    const result = await this.resumeCall(createCallId(callId));
    if (!result.ok) {
      this.headsetIntegration.abortUiHoldSync(callId);
    }
    return result;
  }

  async toggleHoldCallById(callId: string): Promise<Result<Call, PlatformError>> {
    const line = this.multiLineProjectionForToggle.lines.find((entry) => entry.callId === callId);
    if (line?.state === "Held") {
      return this.resumeCallById(callId);
    }
    return this.holdCallById(callId);
  }

  /**
   * - Purpose: headset-originated hold/resume without re-arming UI hold sync.
   * - Inputs: call id from headset focus.
   * - Outputs: hold or resume Use Case result.
   */
  async toggleHoldCallFromHeadset(callId: string): Promise<Result<Call, PlatformError>> {
    const line = this.multiLineProjectionForToggle.lines.find((entry) => entry.callId === callId);
    if (line?.state === "Held") {
      return this.resumeCall(createCallId(callId));
    }
    return this.holdCall(createCallId(callId));
  }

  setHeadsetProjectionSources(
    getMultiLine: () => MultiLineCallProjection,
    getIncoming: () => IncomingCallProjection,
    getIsDnd?: () => boolean,
  ): void {
    this.getMultiLineProjectionRef = getMultiLine;
    this.getIncomingProjectionRef = getIncoming;
    if (getIsDnd !== undefined) {
      this.getIsDndRef = getIsDnd;
    }
  }

  setHeadsetSyncBusyListener(listener: (() => void) | null): void {
    this.headsetIntegration.setSyncBusyListener(listener);
  }

  setHeadsetPreferredDeviceChangedListener(
    listener: ((deviceId: string) => void) | null,
  ): void {
    this.headsetIntegration.setPreferredDeviceChangedListener(listener);
  }

  notifyHeadsetProjectionsChanged(multiLine: MultiLineCallProjection): void {
    this.multiLineProjectionForToggle = multiLine;
    this.headsetIntegration.onCallProjectionsChanged();
  }

  setHeadsetSelectedCallId(callId: string | null): void {
    this.headsetIntegration.setSelectedCallId(callId);
  }

  getHeadsetSelectedCallId(): string | null {
    return this.headsetIntegration.getSelectedCallId();
  }

  getHeadsetGateway(): HeadsetGateway {
    return this.headsetIntegration.getGateway();
  }

  getHeadsetSyncBusyState(): HeadsetSyncBusyState {
    return (
      this.headsetIntegration.getSyncQueue()?.getBusyState() ?? {
        holdSessionId: null,
        muteSessionId: null,
        isBusy: false,
      }
    );
  }

  async listGrantedHeadsetDevices(): Promise<
    ReadonlyArray<Readonly<{ id: string; productName: string }>>
  > {
    return this.headsetIntegration.listGrantedDevices();
  }

  async connectHeadsetDevice(deviceId: string | null = null): Promise<void> {
    await this.headsetIntegration.connectDevice(deviceId);
  }

  async disconnectHeadsetDevice(): Promise<void> {
    await this.headsetIntegration.disconnectDevice();
  }

  async applyHeadsetUserSettings(settings: UserSettings): Promise<void> {
    await this.headsetIntegration.applySettings(settings);
  }

  async persistHeadsetPreferredDeviceId(deviceId: string): Promise<void> {
    try {
      const accountKey = await this.resolveSettingsAccountKey();
      const settings = await this.loadUserSettingsForAccountKey(accountKey);
      if (settings.headsetPreferredDeviceId === deviceId) {
        return;
      }
      await this.saveUserSettingsInternal(accountKey, {
        ...settings,
        headsetPreferredDeviceId: deviceId,
      });
    } catch (error: unknown) {
      this.deps.logger.warn("headset_preferred_device_persist_failed", {
        featureId: "F-012",
        boundedContext: "Headset",
        operation: "persist_preferred_headset",
        result: "failure",
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  async muteCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.muteCallUseCase.execute({ callId });
  }

  async muteCallById(callId: string): Promise<Result<Call, PlatformError>> {
    if (!this.headsetIntegration.beginUiMuteSync(callId, true)) {
      return err(createPlatformError("operation_failed", "headset_sync_in_progress"));
    }
    const result = await this.muteCall(createCallId(callId));
    if (!result.ok) {
      this.headsetIntegration.abortUiMuteSync(callId);
    } else {
      this.headsetIntegration.confirmUiMuteSync(callId, true);
    }
    return result;
  }

  async unmuteCall(callId: CallId): Promise<Result<Call, PlatformError>> {
    return this.unmuteCallUseCase.execute({ callId });
  }

  async unmuteCallById(callId: string): Promise<Result<Call, PlatformError>> {
    if (!this.headsetIntegration.beginUiMuteSync(callId, false)) {
      return err(createPlatformError("operation_failed", "headset_sync_in_progress"));
    }
    const result = await this.unmuteCall(createCallId(callId));
    if (!result.ok) {
      this.headsetIntegration.abortUiMuteSync(callId);
    } else {
      this.headsetIntegration.confirmUiMuteSync(callId, false);
    }
    return result;
  }

  getCallVideoMediaState(callId: string): CallVideoMediaState | null {
    return this.callEngine.getCallVideoMediaState(createCallId(callId));
  }

  async setLocalVideoMutedById(
    callId: string,
    muted: boolean,
  ): Promise<Result<CallVideoMediaState, PlatformError>> {
    if (this.setLocalVideoMutedUseCase === null) {
      return err(
        createPlatformError("operation_failed", "local_media_capture_unavailable"),
      );
    }
    return this.setLocalVideoMutedUseCase.execute({
      callId: createCallId(callId),
      muted,
    });
  }

  async switchLocalVideoSourceById(
    callId: string,
    source: "camera" | "screen",
    muted: boolean,
  ): Promise<Result<CallVideoMediaState, PlatformError>> {
    if (this.switchLocalVideoSourceUseCase === null) {
      return err(
        createPlatformError("operation_failed", "local_media_capture_unavailable"),
      );
    }
    return this.switchLocalVideoSourceUseCase.execute({
      callId: createCallId(callId),
      source,
      muted,
    });
  }

  setSessionViewModeById(
    callId: string,
    sessionView: SessionViewMode,
  ): Result<CallVideoMediaState, PlatformError> {
    return this.setSessionViewModeUseCase.execute({
      callId: createCallId(callId),
      sessionView,
    });
  }

  async bindCallVideoSurfacesById(
    callId: string,
    remoteVideoElement: unknown,
    localVideoElement: unknown,
  ): Promise<Result<void, PlatformError>> {
    return this.deps.mediaGateway.bindCallVideoSurfaces({
      callId: createCallId(callId),
      correlationId: createCorrelationId(),
      remoteVideoElement,
      localVideoElement,
    });
  }

  async listMediaInputDevices(): Promise<
    Result<ReadonlyArray<MediaInputDeviceInfo>, PlatformError>
  > {
    const port = this.deps.localMediaCapturePort;
    if (port === undefined) {
      return err(
        createPlatformError("operation_failed", "local_media_capture_unavailable"),
      );
    }
    return port.listInputDevices(createCorrelationId());
  }

  async startCameraPreview(
    videoDeviceId?: string,
  ): Promise<Result<StartCameraPreviewResult, PlatformError>> {
    const port = this.deps.localMediaCapturePort;
    if (port === undefined) {
      return err(
        createPlatformError("operation_failed", "local_media_capture_unavailable"),
      );
    }
    return port.startCameraPreview({
      correlationId: createCorrelationId(),
      ...(videoDeviceId !== undefined ? { videoDeviceId } : {}),
    });
  }

  async stopCameraPreview(
    handle: LocalMediaStreamHandle,
  ): Promise<Result<void, PlatformError>> {
    const port = this.deps.localMediaCapturePort;
    if (port === undefined) {
      return err(
        createPlatformError("operation_failed", "local_media_capture_unavailable"),
      );
    }
    return port.stopCameraPreview({
      handle,
      correlationId: createCorrelationId(),
    });
  }

  bindCameraPreviewElement(
    handle: LocalMediaStreamHandle,
    videoElement: unknown,
  ): Result<void, PlatformError> {
    const port = this.deps.localMediaCapturePort;
    if (port === undefined || port.getStreamForHandle === undefined) {
      return err(
        createPlatformError("operation_failed", "local_media_capture_unavailable"),
      );
    }
    if (!(videoElement instanceof HTMLVideoElement)) {
      return err(
        createPlatformError("validation_failed", "camera_preview_element_invalid"),
      );
    }
    const stream = port.getStreamForHandle(handle);
    if (stream === null) {
      return err(
        createPlatformError("operation_failed", "camera_preview_handle_unknown"),
      );
    }
    videoElement.srcObject = stream;
    videoElement.muted = true;
    void videoElement.play().catch(() => undefined);
    return ok(undefined);
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

  async answerCall(
    callId: CallId,
    mediaMode?: "audio" | "video",
  ): Promise<Result<Call, PlatformError>> {
    return this.answerCallUseCase.execute({
      callId,
      ...(mediaMode !== undefined ? { mediaMode } : {}),
    });
  }

  async answerCallById(
    callId: string,
    mediaMode?: "audio" | "video",
  ): Promise<Result<Call, PlatformError>> {
    return this.answerCall(createCallId(callId), mediaMode);
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

  async getActiveSipAccount(): Promise<SipAccountInput | null> {
    if (!this.sipSessionRegistered) {
      return null;
    }

    const account = await this.deps.settingsRepository.getSipAccount();
    if (account === null) {
      return null;
    }

    return {
      username: account.username,
      password: account.password,
      domain: account.domain,
      server: account.server,
    };
  }

  async forgetRememberedSipPassword(
    profileId: SavedAccountProfileId,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const profile = await this.savedAccountProfileRepository.getProfileById(profileId);
    if (profile === null) {
      return err(
        createPlatformError("not_found", LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE),
      );
    }

    try {
      await this.deleteSipPasswordSecret(profileId);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }

    this.deps.logger.info("sip_password_secret_forgotten", {
      ...(correlationId !== undefined ? { correlationId } : {}),
      featureId: "F-024",
      boundedContext: "Settings",
      operation: "forget_remembered_sip_password",
      profileId,
    });

    return ok(undefined);
  }

  async hasRememberedSipPassword(profileId: SavedAccountProfileId): Promise<boolean> {
    try {
      const storedPassword = await this.secretStoragePort.loadSecret(
        createSecretStorageScopeKey(profileId),
        SIP_PASSWORD_SECRET_ID,
      );
      return storedPassword !== null && storedPassword.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Narrow renderer boundary from ADR-AF-006: secrets enter selected-profile local
   * form state only and must never be stored in projections, events, or logs.
   */
  async loadSavedAccountProfileSecrets(
    profileId: SavedAccountProfileId,
  ): Promise<Result<SavedAccountProfileSecrets, PlatformError>> {
    const profile = await this.savedAccountProfileRepository.getProfileById(profileId);
    if (profile === null) {
      return err(
        createPlatformError("not_found", LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE),
      );
    }
    try {
      const scopeKey = createSecretStorageScopeKey(profileId);
      const [sipPassword, ocpApiKey] = await Promise.all([
        this.secretStoragePort.loadSecret(scopeKey, SIP_PASSWORD_SECRET_ID),
        this.secretStoragePort.loadSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID),
      ]);
      return ok({ sipPassword, ocpApiKey });
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  private async resolvePasswordForSavedProfileAuthorize(
    profileId: SavedAccountProfileId,
    password: string,
  ): Promise<Result<string, PlatformError>> {
    const trimmedPassword = password.trim();
    if (trimmedPassword.length > 0) {
      return ok(trimmedPassword);
    }

    try {
      const storedPassword = await this.secretStoragePort.loadSecret(
        createSecretStorageScopeKey(profileId),
        SIP_PASSWORD_SECRET_ID,
      );
      if (storedPassword === null || storedPassword.length === 0) {
        return err(createPlatformError("validation_failed", SIP_PASSWORD_REQUIRED_MESSAGE));
      }
      return ok(storedPassword);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  private async deleteSipPasswordSecret(profileId: SavedAccountProfileId): Promise<void> {
    await this.secretStoragePort.deleteSecret(
      createSecretStorageScopeKey(profileId),
      SIP_PASSWORD_SECRET_ID,
    );
  }

  /**
   * @internal Test/composition access only — renderer must use Facade OCP methods.
   */
  getOcpIntegration(): OcpIntegrationComposition {
    return this.ocpIntegration;
  }

  /**
   * - Purpose: attach renderer toast sink to OCP notification presenter (T-021 / E-09).
   * - Inputs: handler or null to clear.
   * - Outputs: side-effect wiring via port `setHandler` (no adapter instanceof).
   */
  setOcpNotificationHandler(
    handler: ((notification: OcpNotificationPayload) => void) | null,
  ): void {
    const presenter: OcpNotificationPresenter =
      this.ocpIntegration.notificationPresenter;
    presenter.setHandler?.(handler);
  }

  /**
   * - Purpose: change operator status from UI (callType internal).
   */
  changeOcpOperatorStatus(
    input: Readonly<{
      targetStatus: "ready" | "break";
      reasonId: number;
      intent?: "auto" | "apply" | "reserve";
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<ChangeOperatorStatusOutcome, PlatformError>> {
    return this.ocpIntegration.changeOperatorStatus.execute({
      targetStatus: input.targetStatus,
      reasonId: input.reasonId,
      callType: "internal",
      ...(input.intent !== undefined ? { intent: input.intent } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  /**
   * - Purpose: logout OCP operator from UI with optional SIP cascade event.
   */
  logoutOcpOperator(
    input: Readonly<{
      reasonId: number;
      cascadeSipLogout?: boolean;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    return this.ocpIntegration.logoutOperator.execute({
      reasonId: input.reasonId,
      callType: "internal",
      ...(input.cascadeSipLogout !== undefined
        ? { cascadeSipLogout: input.cascadeSipLogout }
        : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  logoutAccountSession(input: Readonly<{
    reasonId?: number;
  }> = {}): Promise<Result<AccountLogoutOutcome, PlatformError>> {
    return this.accountLogoutOrchestration.execute(input);
  }

  /**
   * - Purpose: reserve post-call operator status from UI.
   */
  reserveOcpPostCallStatus(
    input: Readonly<{
      operatorId: number;
      targetStatus: "ready" | "break";
      reasonId: number;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    return this.ocpIntegration.reservePostCallStatus.execute({
      operatorId: input.operatorId,
      targetStatus: input.targetStatus,
      reasonId: input.reasonId,
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  /**
   * - Purpose: finish post-call appeal (apply reserved status or Ready).
   * - Inputs: optional correlation + callType (UI internal default; SDK uses "sdk").
   */
  finishOcpPostCallAppeal(
    input: Readonly<{
      correlationId?: CorrelationId;
      callType?: "internal" | "external" | "sdk";
    }> = {},
  ): Promise<Result<ChangeOperatorStatusOutcome, PlatformError>> {
    return this.ocpIntegration.finishPostCallAppeal.execute({
      callType: input.callType ?? "internal",
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  /**
   * - Purpose: accept active OCP campaign event from UI.
   */
  acceptOcpCampaign(
    input: Readonly<{
      operatorId: number;
      campaignEventId: string;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    return this.ocpIntegration.acceptCampaign.execute({
      operatorId: input.operatorId,
      campaignEventId: input.campaignEventId,
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  /**
   * - Purpose: reject active OCP campaign event from UI.
   */
  rejectOcpCampaign(
    input: Readonly<{
      operatorId: number;
      campaignEventId: string;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    return this.ocpIntegration.rejectCampaign.execute({
      operatorId: input.operatorId,
      campaignEventId: input.campaignEventId,
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  getOcpSessionSnapshot(): ReturnType<
    OcpIntegrationComposition["projectionHub"]["getSessionProjection"]
  > {
    return this.ocpIntegration.projectionHub.getSessionProjection();
  }

  getOcpOperatorSnapshot(): ReturnType<
    OcpIntegrationComposition["projectionHub"]["getOperatorProjection"]
  > {
    return this.ocpIntegration.projectionHub.getOperatorProjection();
  }

  getOcpReasonsSnapshot(): ReturnType<
    OcpIntegrationComposition["projectionHub"]["getReasonsProjection"]
  > {
    return this.ocpIntegration.projectionHub.getReasonsProjection();
  }

  getOcpCampaignSnapshot(): ReturnType<
    OcpIntegrationComposition["projectionHub"]["getCampaignProjection"]
  > {
    return this.ocpIntegration.projectionHub.getCampaignProjection();
  }

  getOcpCallContextSnapshot(): ReturnType<
    OcpIntegrationComposition["projectionHub"]["getCallOcpContextProjection"]
  > {
    return this.ocpIntegration.projectionHub.getCallOcpContextProjection();
  }

  subscribeOcpProjections(listener: () => void): () => void {
    return this.ocpIntegration.projectionHub.subscribe(listener);
  }

  clearOcpActiveCampaign(
    reasonCode: "accepted" | "rejected" = "accepted",
  ): void {
    this.ocpIntegration.clearCampaignAndPublish(reasonCode);
  }

  /**
   * - Purpose: external logout — LogoutOperator with callType external + SIP cascade.
   */
  logoutOcpFromHost(
    input: Readonly<{
      reasonId: number;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    this.deps.logger.info("ocp_host_logout_requested", {
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "logout_ocp_from_host",
      reasonId: input.reasonId,
      result: "requested",
    });
    return this.ocpIntegration.logoutOperator.execute({
      reasonId: input.reasonId,
      callType: "external",
      cascadeSipLogout: true,
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  /**
   * - Purpose: external disconnect without logout status command.
   */
  disconnectOcpFromHost(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    this.deps.logger.info("ocp_host_disconnect_requested", {
      ...(correlationId !== undefined ? { correlationId } : {}),
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "disconnect_ocp_from_host",
      result: "requested",
    });
    return this.disconnectOcp(correlationId);
  }

  async updateOcpSettings(
    ocpIntegration: OcpIntegrationSettings,
    options?: CorrelationId | OcpSettingsScopeOptions,
  ): Promise<Result<UserSettings, PlatformError>> {
    const scope = normalizeOcpSettingsScopeOptions(options);
    const parsed = parseOcpIntegrationSettings(ocpIntegration);
    if (parsed === null) {
      return err(
        createPlatformError("validation_failed", "ocpIntegration_invalid", {
          reason: "ocpIntegration_invalid",
        }),
      );
    }

    try {
      const accountKey =
        scope.accountKey ?? (await this.resolveSettingsAccountKey());
      const current = await this.loadUserSettingsForAccountKey(accountKey);
      const saved = await this.saveUserSettingsInternal(accountKey, {
        ...current,
        ocpIntegration: parsed,
      });
      this.deps.logger.info("ocp_settings_updated", {
        ...(scope.correlationId !== undefined
          ? { correlationId: scope.correlationId }
          : {}),
        featureId: "F-028",
        boundedContext: "Integration",
        operation: "update_ocp_settings",
        result: "completed",
        enabled: parsed.enabled,
        domain: parsed.domain,
        autoConnect: parsed.autoConnect,
        linked: parsed.linked,
      });
      return ok(saved);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  async saveOcpProxyApiKey(
    apiKey: string,
    options?: CorrelationId | OcpSettingsScopeOptions,
  ): Promise<Result<void, PlatformError>> {
    const scope = normalizeOcpSettingsScopeOptions(options);
    const trimmed = apiKey.trim();
    if (trimmed.length === 0) {
      return err(
        createPlatformError("validation_failed", "api_key_required", {
          reason: "api_key_required",
        }),
      );
    }

    try {
      const accountKey =
        scope.accountKey ?? (await this.resolveSettingsAccountKey());
      const scopeKey = createSecretStorageScopeKey(accountKey);
      this.lastOcpSecretScopeKey = scopeKey;
      await this.secretStoragePort.saveSecret(
        scopeKey,
        OCP_PROXY_API_KEY_SECRET_ID,
        trimmed,
      );
      this.deps.logger.info("ocp_proxy_api_key_saved", {
        ...(scope.correlationId !== undefined
          ? { correlationId: scope.correlationId }
          : {}),
        featureId: "F-028",
        boundedContext: "Integration",
        operation: "save_ocp_proxy_api_key",
        result: "completed",
      });
      return ok(undefined);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  async getOcpProxyApiKey(
    options?: Readonly<{ accountKey?: SettingsAccountKey }>,
  ): Promise<Result<string | null, PlatformError>> {
    try {
      const accountKey =
        options?.accountKey ?? (await this.resolveSettingsAccountKey());
      const scopeKey = createSecretStorageScopeKey(accountKey);
      const apiKey = await this.secretStoragePort.loadSecret(
        scopeKey,
        OCP_PROXY_API_KEY_SECRET_ID,
      );
      return ok(apiKey);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  async deleteOcpProxyApiKey(
    options?: CorrelationId | OcpSettingsScopeOptions,
  ): Promise<Result<void, PlatformError>> {
    const scope = normalizeOcpSettingsScopeOptions(options);
    try {
      const accountKey =
        scope.accountKey ?? (await this.resolveSettingsAccountKey());
      const scopeKey = createSecretStorageScopeKey(accountKey);
      await this.secretStoragePort.deleteSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID);
      this.deps.logger.info("ocp_proxy_api_key_deleted", {
        ...(scope.correlationId !== undefined
          ? { correlationId: scope.correlationId }
          : {}),
        featureId: "F-028",
        boundedContext: "Integration",
        operation: "delete_ocp_proxy_api_key",
        result: "completed",
      });
      return ok(undefined);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  /**
   * - Purpose: saved-profile login options for Integrations OCP login picker (/ui).
   * - Outputs: empty array when no saved profiles (UI shows plain input).
   */
  async listOcpConnectLoginOptions(): Promise<
    Result<ReadonlyArray<OcpConnectLoginOption>, PlatformError>
  > {
    const profilesResult = await this.listSavedAccountProfiles();
    if (isErr(profilesResult)) {
      return profilesResult;
    }
    return ok(buildOcpConnectLoginOptions(profilesResult.value));
  }

  /**
   * - Purpose: resolve OCP settings bucket for typed/selected login (Integrations panel).
   * - Inputs: login (+ optional accountKey when username is ambiguous).
   * - Outputs: target + ocpIntegration + hasApiKey; other UserSettings fields unchanged on persist.
   */
  async getOcpModulePanelState(
    input: Readonly<{
      login: string;
      accountKey?: SettingsAccountKey;
    }>,
  ): Promise<
    Result<
      Readonly<{
        target: OcpConnectLoginTarget;
        settings: OcpIntegrationSettings;
        hasApiKey: boolean;
        loginOptions: ReadonlyArray<OcpConnectLoginOption>;
      }>,
      PlatformError
    >
  > {
    const profilesResult = await this.listSavedAccountProfiles();
    if (isErr(profilesResult)) {
      return profilesResult;
    }
    const loginOptions = buildOcpConnectLoginOptions(profilesResult.value);
    const targetResult = resolveOcpConnectLoginTarget(
      input.login,
      profilesResult.value,
      input.accountKey,
    );
    if (!targetResult.ok) {
      return err(
        createPlatformError("validation_failed", targetResult.reason, {
          reason: targetResult.reason,
        }),
      );
    }
    try {
      const settings = await this.loadUserSettingsForAccountKey(
        targetResult.value.accountKey,
      );
      const apiKeyResult = await this.getOcpProxyApiKey({
        accountKey: targetResult.value.accountKey,
      });
      if (isErr(apiKeyResult)) {
        return apiKeyResult;
      }
      return ok({
        target: targetResult.value,
        settings: settings.ocpIntegration,
        hasApiKey: (apiKeyResult.value?.trim() ?? "").length > 0,
        loginOptions,
      });
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  /**
   * - Purpose: whether saved-account UI may show «Authorize via OCP» checkbox.
   * - Inputs: optional account key (saved profile id); else active settings bucket.
   * - Outputs: available when linked && domain && apiKey saved for that key.
   */
  async getOcpSignInAvailability(
    options?: Readonly<{ accountKey?: SettingsAccountKey }>,
  ): Promise<Result<Readonly<{ available: boolean }>, PlatformError>> {
    const accountKey =
      options?.accountKey ?? (await this.resolveSettingsAccountKey());
    try {
      const settings = await this.loadUserSettingsForAccountKey(accountKey);
      const ocp = settings.ocpIntegration;
      if (!ocp.linked || ocp.domain.trim().length === 0) {
        return ok({ available: false });
      }
      const scopeKey = createSecretStorageScopeKey(accountKey);
      const apiKey = await this.secretStoragePort.loadSecret(
        scopeKey,
        OCP_PROXY_API_KEY_SECRET_ID,
      );
      return ok({ available: (apiKey?.trim() ?? "").length > 0 });
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  clearOcpAuthFeedback(): void {
    this.ocpIntegration.projectionHub.clearAuthFeedback();
  }

  /**
   * - Purpose: HTTP authenticate + WS connect using saved OCP domain/apiKey and SIP login.
   * - Inputs:
   *   - Integrations/host: `{ login, accountKey? }` → settings scoped to login target
   *   - autoConnect/retry: bare correlationId / no args → active SIP settings bucket
   * - Outputs: authenticated session or non-blocking auth feedback errors.
   *
   * Token HTTP host is always the OCP proxy domain (`ocpIntegration` / `profile.ocpDomain`),
   * never the SIP PBX domain from `entity:creds`.
   */
  async connectOcp(
    input?:
      | Readonly<{
          login?: string;
          accountKey?: SettingsAccountKey;
          correlationId?: CorrelationId;
        }>
      | CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const correlationId =
      typeof input === "string" ? input : input?.correlationId;
    const scopedInput =
      typeof input === "object" && input !== undefined ? input : undefined;
    const usesLoginPickerScope =
      scopedInput !== undefined &&
      (scopedInput.login !== undefined || scopedInput.accountKey !== undefined);

    let accountKey: SettingsAccountKey;
    let login: string;

    if (usesLoginPickerScope) {
      const profilesResult = await this.listSavedAccountProfiles();
      if (isErr(profilesResult)) {
        return profilesResult;
      }
      const targetResult = resolveOcpConnectLoginTarget(
        scopedInput.login ?? "",
        profilesResult.value,
        scopedInput.accountKey,
      );
      if (!targetResult.ok) {
        if (targetResult.reason === "login_required") {
          this.ocpIntegration.projectionHub.setAuthFeedback("LOGIN_REQUIRED");
        }
        return err(
          createPlatformError("validation_failed", targetResult.reason, {
            reason: targetResult.reason,
          }),
        );
      }
      accountKey = targetResult.value.accountKey;
      login = targetResult.value.login;
    } else {
      accountKey = await this.resolveSettingsAccountKey();
      const loginResult = await this.resolveOcpLogin(undefined);
      if (isErr(loginResult)) {
        return loginResult;
      }
      login = loginResult.value;
    }

    let settings: UserSettings;
    try {
      settings = await this.loadUserSettingsForAccountKey(accountKey);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }

    let apiKey = "";
    try {
      const scopeKey = createSecretStorageScopeKey(accountKey);
      this.lastOcpSecretScopeKey = scopeKey;
      apiKey =
        (
          await this.secretStoragePort.loadSecret(scopeKey, OCP_PROXY_API_KEY_SECRET_ID)
        )?.trim() ?? "";
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
    if (apiKey.length === 0) {
      this.ocpIntegration.projectionHub.setAuthFeedback("API_KEY_REQUIRED");
      return err(
        createPlatformError("validation_failed", "api_key_required", {
          reason: "api_key_required",
        }),
      );
    }

    const attemptCorrelationId = correlationId ?? createCorrelationId();
    const domainResult = await this.resolveAndHealOcpProxyDomain({
      accountKey,
      settings,
      correlationId: attemptCorrelationId,
    });
    if (isErr(domainResult)) {
      return domainResult;
    }

    this.recordAuthorizationAttempt({
      kind: usesLoginPickerScope ? "ocp_integrations_connect" : "saved_profile_ocp",
      correlationId: attemptCorrelationId,
      login,
      accountKey,
    });

    const signInResult = await this.ocpIntegration.backedSignIn.execute({
      domain: domainResult.value,
      login,
      apiKey,
      correlationId: attemptCorrelationId,
    });

    if (isErr(signInResult)) {
      return signInResult;
    }

    if (signInResult.value.phase === "ocp_authenticated_sip_failed") {
      // OCP session may still be live; mark linked but surface SIP failure to caller.
      await this.markOcpLinked(settings.ocpIntegration, attemptCorrelationId, accountKey);
      return err(signInResult.value.error);
    }

    const linkedResult = await this.markOcpLinked(
      settings.ocpIntegration,
      attemptCorrelationId,
      accountKey,
    );
    if (isErr(linkedResult)) {
      return linkedResult;
    }

    this.startupRegistrationFailed = false;
    return ok(undefined);
  }

  /**
   * - Purpose: legacy single Retry for the last failed authorization attempt.
   * - Inputs: optional correlationId for observability.
   * - Outputs: routes OCP dual-FSM recoveries via `dispatchAccountRecoveryAction` when possible.
   * Prefer `dispatchAccountRecoveryAction` for new Account UI (WU-04).
   * Modal Reconnect must use `recoverOcpSignInFromModal` (never `signInAccount`).
   */
  async retryAuthorization(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const resolved = this.resolveAuthorizationRetryPlan();
    if (isErr(resolved)) {
      return resolved;
    }
    const retryCorrelationId = correlationId ?? createCorrelationId();
    this.deps.logger.info("authorization_retry_requested", {
      correlationId: retryCorrelationId,
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "retry_authorization",
      strategy: resolved.value.strategy,
      stage: resolved.value.stage,
      result: "requested",
    });
    return this.executeResolvedAuthorizationRetry(
      resolved.value.strategy,
      resolved.value.context,
      retryCorrelationId,
    );
  }

  /**
   * - Purpose: Account modal Reconnect — Application-owned recovery while account session may already be active (ADR-AF-005).
   * - Inputs: optional correlationId for the recovery operation.
   * - Outputs: typed Result; never passes `signInAccount` / identity gate; seeds visible progress immediately.
   * - Side effects: reuses `lastAuthorizationAttempt` + attempt-scoped secrets; may open one fresh OCP socket per ADR-AF-002.
   */
  async recoverOcpSignInFromModal(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    if (this.ocpIntegration.backedSignIn.isInFlight()) {
      return err(
        createPlatformError("operation_failed", "ocp_sign_in_in_flight", {
          reason: "ocp_sign_in_in_flight",
        }),
      );
    }

    const resolved = this.resolveAuthorizationRetryPlan();
    if (isErr(resolved)) {
      return resolved;
    }

    const retryCorrelationId = correlationId ?? createCorrelationId();
    const { strategy, context, stage } = resolved.value;
    this.seedOcpModalRecoveryProgress(strategy, retryCorrelationId);

    this.deps.logger.info("ocp_modal_recovery_requested", {
      correlationId: retryCorrelationId,
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "recover_ocp_sign_in_from_modal",
      strategy,
      stage,
      result: "requested",
    });

    return this.executeResolvedAuthorizationRetry(
      strategy,
      context,
      retryCorrelationId,
    );
  }

  private resolveAuthorizationRetryPlan(): Result<
    Readonly<{
      strategy: AuthorizationRetryStrategy;
      context: AuthorizationAttemptContext;
      stage: AuthorizationProgressStage;
    }>,
    PlatformError
  > {
    const progress =
      this.ocpIntegration.projectionHub.getSessionProjection().authorizationProgress;
    if (!isAuthorizationRetryableStage(progress.stage, progress.retryAvailable)) {
      return err(
        createPlatformError("operation_failed", "authorization_retry_unavailable", {
          reason: "authorization_retry_unavailable",
        }),
      );
    }

    const context = this.lastAuthorizationAttempt;
    const session = this.ocpIntegration.projectionHub.getSessionProjection();
    const strategy = resolveAuthorizationRetryStrategy(progress.stage, context, {
      isOcpSessionLive: this.isOcpSessionLive(),
      primaryOcpRecoveryAction: session.primaryRecoveryAction,
    });
    if (strategy === null || context === null) {
      return err(
        createPlatformError("operation_failed", "authorization_retry_unavailable", {
          reason: "authorization_retry_unavailable",
        }),
      );
    }

    return ok({ strategy, context, stage: progress.stage });
  }

  private seedOcpModalRecoveryProgress(
    strategy: AuthorizationRetryStrategy,
    correlationId: CorrelationId,
  ): void {
    const firstStage = resolveOcpRecoveryFirstVisibleStage(strategy);
    const resetCompleted = shouldResetOcpRecoveryCompletedStages(strategy);
    if (resetCompleted) {
      this.ocpIntegration.backedSignIn.seedVisibleRecoveryStage(
        firstStage,
        correlationId,
        { resetCompletedStages: true },
      );
      return;
    }

    const stageIndex = OCP_SIGN_IN_EXECUTION_STAGES.indexOf(firstStage);
    const completed =
      stageIndex > 0
        ? OCP_SIGN_IN_EXECUTION_STAGES.slice(0, stageIndex)
        : [];
    this.ocpIntegration.projectionHub.setAuthorizationProgress(
      applyAuthorizationExecutionStage(
        {
          ...clearAuthorizationProgress(),
          completedExecutionStages: completed,
        },
        firstStage,
        correlationId,
      ),
    );
  }

  private async executeResolvedAuthorizationRetry(
    strategy: AuthorizationRetryStrategy,
    context: AuthorizationAttemptContext,
    retryCorrelationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    switch (strategy) {
      case "retry_ocp_authorization":
        return this.dispatchAccountRecoveryAction(
          "retry_authorization",
          retryCorrelationId,
        );
      case "retry_ocp_server":
        return this.dispatchAccountRecoveryAction("retry_server", retryCorrelationId);
      case "reconnect_ocp":
        return this.dispatchAccountRecoveryAction("reconnect", retryCorrelationId);
      case "repeat_ocp_sign_in":
        return this.executeOcpRecoveryRepeatSignIn(retryCorrelationId);
      case "repeat_sip_register_only": {
        const account = await this.deps.settingsRepository.getSipAccount();
        if (account === null) {
          return err(
            createPlatformError("not_found", "sip_account_missing", {
              reason: "sip_account_missing",
            }),
          );
        }
        const registerResult = await this.registerAccount.execute({
          account,
          correlationId: retryCorrelationId,
        });
        if (registerResult.ok) {
          this.startupRegistrationFailed = false;
          this.ocpIntegration.backedSignIn.clearProgress();
        }
        return registerResult;
      }
      case "repeat_sip_authorize": {
        const scopedSecrets = this.attemptScopedSecrets.read(context.correlationId);
        if (context.kind === "saved_profile_sip" && context.profileId !== undefined) {
          const savedResult = await this.authorizeSavedAccountProfile(
            context.profileId,
            context.usedRememberedPassword === true
              ? ""
              : (scopedSecrets?.sipPassword ?? ""),
            {
              correlationId: retryCorrelationId,
              recordAttempt: false,
              ...(context.rememberPassword === true ? { rememberPassword: true } : {}),
            },
          );
          if (isErr(savedResult)) {
            return savedResult;
          }
          return ok(undefined);
        }
        if (
          context.sipIdentity !== undefined &&
          scopedSecrets?.sipPassword !== undefined
        ) {
          const manualResult = await this.authorizeManualAccount(
            {
              ...context.sipIdentity,
              password: scopedSecrets.sipPassword,
            },
            {
              correlationId: retryCorrelationId,
              recordAttempt: false,
              ...(context.saveProfile === true ? { saveProfile: true } : {}),
              ...(context.rememberPassword === true ? { rememberPassword: true } : {}),
            },
          );
          if (isErr(manualResult)) {
            return manualResult;
          }
          return ok(undefined);
        }
        return err(
          createPlatformError("operation_failed", "authorization_retry_unavailable", {
            reason: "authorization_retry_unavailable",
          }),
        );
      }
      default: {
        const _exhaustive: never = strategy;
        return _exhaustive;
      }
    }
  }

  /**
   * - Purpose: retry startup SIP registration after `sipAutoRegisterOnStartup` failure.
   * - Inputs: stored SIP account from settings repository.
   * - Outputs: register result; clears persistent startup failure flag on success.
   */
  async retryStartupRegistration(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    if (!this.startupRegistrationFailed) {
      return err(
        createPlatformError("operation_failed", "startup_registration_retry_unavailable", {
          reason: "startup_registration_retry_unavailable",
        }),
      );
    }

    const account = await this.deps.settingsRepository.getSipAccount();
    if (account === null) {
      return err(
        createPlatformError("not_found", "sip_account_missing", {
          reason: "sip_account_missing",
        }),
      );
    }

    const registerResult = await this.registerAccount.execute({
      account,
      correlationId: correlationId ?? createCorrelationId(),
    });
    if (registerResult.ok) {
      this.startupRegistrationFailed = false;
    }
    return registerResult;
  }

  hasStartupRegistrationFailure(): boolean {
    return this.startupRegistrationFailed;
  }

  private recordAuthorizationAttempt(context: AuthorizationAttemptContext): void {
    this.lastAuthorizationAttempt = context;
  }

  private isOcpSessionLive(): boolean {
    const session = this.ocpIntegration.projectionHub.getSessionProjection();
    return (
      session.authorizationState.phase === "authorized" ||
      session.serverState === "connected" ||
      session.serverState === "reconnecting"
    );
  }

  /**
   * - Purpose: saved-account sign-in via OCP (no SIP password).
   * - Inputs: SIP login username + optional saved-profile account key for OCP secrets scope.
   * - Outputs: ok only after SIP registration succeeded (or matching identity already registered).
   * Prefer `signInAccount({ mode: "ocp", ... })` for new Account UI (WU-04).
   */
  async signInViaOcp(
    input: Readonly<{
      login: string;
      accountKey?: SettingsAccountKey;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    const sessionGate = this.rejectIfSipSessionActive();
    if (isErr(sessionGate)) {
      return sessionGate;
    }
    return this.connectOcp({
      login: input.login,
      ...(input.accountKey !== undefined ? { accountKey: input.accountKey } : {}),
      ...(input.correlationId !== undefined
        ? { correlationId: input.correlationId }
        : {}),
    });
  }

  disconnectOcp(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    return this.ocpIntegration.disconnectOcp.execute(
      correlationId === undefined ? {} : { correlationId },
    );
  }

  /**
   * - Purpose: cancel in-flight / modal OCP sign-in and return to pre-login idle.
   * - Inputs: optional correlation id for disconnect logging.
   * - Outputs: OCP socket + projections idle, then local account session + SIP teardown
   *   (`UserSessionEnded`) so Login re-enables without a separate avatar Logout.
   * - If physical disconnect fails: returns typed failure; projections still forced to OCP idle;
   *   transport recovery remains disarmed; account-session teardown is still attempted.
   */
  async cancelOcpSignInAttempt(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const opCorrelationId = correlationId ?? createCorrelationId();
    // Capture/cancel waiters + supersede apply epoch before clearAttempt; then close socket.
    this.ocpIntegration.backedSignIn.cancelUserSignIn("user_cancel");
    // Must run before gateway disconnect — recovery arms synchronously on drop (ADR-AF-002).
    this.ocpIntegration.disarmTransportRecoveryForUserLogout();
    const disconnectResult = await this.disconnectOcp(opCorrelationId);
    this.ocpIntegration.resetProjectionsToIdleAfterUserLogout();

    // Modal Disconnect owns full pre-login idle (not Settings OCP-only disconnect).
    const sessionResult = await this.endUserSession.execute({
      correlationId: opCorrelationId,
    });

    if (isErr(disconnectResult)) {
      this.deps.logger.warn("ocp_sign_in_cancel_disconnect_failed", {
        correlationId: opCorrelationId,
        featureId: "F-028",
        boundedContext: "Integration",
        operation: "cancel_ocp_sign_in_attempt",
        result: disconnectResult.error.message,
      });
      return disconnectResult;
    }

    if (isErr(sessionResult)) {
      this.deps.logger.warn("ocp_sign_in_cancel_session_end_failed", {
        correlationId: opCorrelationId,
        featureId: "F-028",
        boundedContext: "Integration",
        operation: "cancel_ocp_sign_in_attempt",
        result: sessionResult.error.message,
      });
      return err(sessionResult.error);
    }

    this.deps.logger.info("ocp_sign_in_cancel_idle", {
      correlationId: opCorrelationId,
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "cancel_ocp_sign_in_attempt",
      result: "pre_login_idle",
    });
    return ok(undefined);
  }

  /**
   * - Purpose: external authenticate — persist domain/apiKey and HTTP+WS connect.
   * - Inputs: ocpDomain + login + apiKey from future ExternalCommandRouter.
   * - Outputs: connect result; secrets never logged.
   */
  async authenticateOcpFromHost(
    input: Readonly<{
      ocpDomain: string;
      login: string;
      apiKey: string;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    const persistResult = await this.persistOcpHostCredentials(input);
    if (isErr(persistResult)) {
      return persistResult;
    }

    const domain = input.ocpDomain.trim();
    this.deps.logger.info("ocp_host_authenticate_requested", {
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "authenticate_ocp_from_host",
      domain,
      login: input.login.trim(),
      result: "requested",
    });

    const profilesResult = await this.listSavedAccountProfiles();
    if (isErr(profilesResult)) {
      return profilesResult;
    }
    const targetResult = resolveOcpConnectLoginTarget(
      input.login,
      profilesResult.value,
    );
    if (!targetResult.ok) {
      return err(
        createPlatformError("validation_failed", targetResult.reason, {
          reason: targetResult.reason,
        }),
      );
    }

    return this.connectOcp({
      login: targetResult.value.login,
      accountKey: targetResult.value.accountKey,
      ...(input.correlationId !== undefined
        ? { correlationId: input.correlationId }
        : {}),
    });
  }

  /**
   * - Purpose: external operator status change (host = external, SDK = sdk).
   * - Inputs: ready|break target and reason id (future ExternalCommandRouter / DI-07).
   * - Outputs: ChangeOperatorStatus Use Case result.
   */
  changeOcpStatusFromHost(
    input: Readonly<{
      targetStatus: "ready" | "break";
      reasonId: number;
      intent?: "auto" | "apply" | "reserve";
      correlationId?: CorrelationId;
      callType?: "external" | "sdk";
    }>,
  ): Promise<Result<ChangeOperatorStatusOutcome, PlatformError>> {
    return this.ocpIntegration.changeOperatorStatus.execute({
      targetStatus: input.targetStatus,
      reasonId: input.reasonId,
      callType: input.callType ?? "external",
      ...(input.intent !== undefined ? { intent: input.intent } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  getOcpConnectionState(): OcpConnectionState {
    return this.ocpIntegration.projectionHub.getSessionProjection().connectionState;
  }

  /**
   * - Purpose: connect OCP when settings enable autoConnect and apiKey+login exist.
   * - Inputs: loaded UserSettings + SecretStorage api key + SIP account username.
   * - Outputs: authenticate+connect side effect or skipped; secrets never logged.
   */
  async maybeAutoConnectOcp(
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const settingsResult = await this.getUserSettingsForAccount();
    if (isErr(settingsResult)) {
      return settingsResult;
    }

    const ocp = settingsResult.value.ocpIntegration;
    if (!ocp.enabled || !ocp.autoConnect) {
      return ok(undefined);
    }

    const state = this.getOcpConnectionState();
    if (
      state === "connecting" ||
      state === "connected" ||
      state === "authenticated" ||
      state === "reconnecting"
    ) {
      return ok(undefined);
    }

    const apiKeyResult = await this.getOcpProxyApiKey();
    if (isErr(apiKeyResult)) {
      return apiKeyResult;
    }
    if ((apiKeyResult.value?.trim() ?? "").length === 0) {
      this.deps.logger.info("ocp_auto_connect_skipped_missing_api_key", {
        ...(correlationId !== undefined ? { correlationId } : {}),
        featureId: "F-028",
        boundedContext: "Integration",
        operation: "maybe_auto_connect_ocp",
        result: "skipped_missing_api_key",
      });
      return ok(undefined);
    }

    const loginResult = await this.resolveOcpLogin();
    if (isErr(loginResult)) {
      this.deps.logger.info("ocp_auto_connect_skipped_missing_login", {
        ...(correlationId !== undefined ? { correlationId } : {}),
        featureId: "F-028",
        boundedContext: "Integration",
        operation: "maybe_auto_connect_ocp",
        result: "skipped_missing_login",
      });
      return ok(undefined);
    }

    this.deps.logger.info("ocp_auto_connect_requested", {
      ...(correlationId !== undefined ? { correlationId } : {}),
      featureId: "F-028",
      boundedContext: "Integration",
      operation: "maybe_auto_connect_ocp",
      domain: ocp.domain,
      result: "requested",
    });

    // Use active SIP settings bucket (not login-picker resolution) to avoid
    // provisional username-only keys when composite SIP profile already exists.
    const connectResult = await this.connectOcp(correlationId);
    if (isErr(connectResult)) {
      this.deps.logger.error(
        "ocp_auto_connect_failed",
        {
          ...(correlationId !== undefined ? { correlationId } : {}),
          featureId: "F-028",
          boundedContext: "Integration",
          operation: "maybe_auto_connect_ocp",
          result: connectResult.error.code,
        },
        connectResult.error,
      );
      return connectResult;
    }

    return ok(undefined);
  }

  private async persistOcpHostCredentials(
    input: Readonly<{
      ocpDomain: string;
      login: string;
      apiKey: string;
      correlationId?: CorrelationId;
    }>,
  ): Promise<Result<void, PlatformError>> {
    const profilesResult = await this.listSavedAccountProfiles();
    if (isErr(profilesResult)) {
      return profilesResult;
    }
    const targetResult = resolveOcpConnectLoginTarget(
      input.login,
      profilesResult.value,
    );
    if (!targetResult.ok) {
      return err(
        createPlatformError("validation_failed", targetResult.reason, {
          reason: targetResult.reason,
        }),
      );
    }
    const accountKey = targetResult.value.accountKey;

    let currentOcp: OcpIntegrationSettings;
    try {
      const current = await this.loadUserSettingsForAccountKey(accountKey);
      currentOcp = current.ocpIntegration;
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }

    const updateResult = await this.updateOcpSettings(
      {
        ...currentOcp,
        enabled: true,
        domain: input.ocpDomain.trim(),
      },
      {
        accountKey,
        ...(input.correlationId !== undefined
          ? { correlationId: input.correlationId }
          : {}),
      },
    );
    if (isErr(updateResult)) {
      return updateResult;
    }

    return this.saveOcpProxyApiKey(input.apiKey, {
      accountKey,
      ...(input.correlationId !== undefined
        ? { correlationId: input.correlationId }
        : {}),
    });
  }

  private async resolveOcpLogin(
    explicitLogin?: string,
  ): Promise<Result<string, PlatformError>> {
    const trimmed = explicitLogin?.trim() ?? "";
    if (trimmed.length > 0) {
      return ok(trimmed);
    }
    const account = await this.deps.settingsRepository.getSipAccount();
    const username = account?.username.trim() ?? "";
    if (username.length === 0) {
      this.ocpIntegration.projectionHub.setAuthFeedback("LOGIN_REQUIRED");
      return err(
        createPlatformError("validation_failed", "login_required", {
          reason: "login_required",
        }),
      );
    }
    return ok(username);
  }

  private async markOcpLinked(
    current: OcpIntegrationSettings,
    correlationId?: CorrelationId,
    accountKey?: SettingsAccountKey,
  ): Promise<Result<void, PlatformError>> {
    if (current.linked) {
      return ok(undefined);
    }
    const next: OcpIntegrationSettings = {
      ...current,
      linked: true,
      enabled: true,
    };
    const updateResult = await this.updateOcpSettings(next, {
      ...(accountKey !== undefined ? { accountKey } : {}),
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
    if (isErr(updateResult)) {
      return updateResult;
    }
    return ok(undefined);
  }

  private async purgeLegacyOcpAuthToken(): Promise<void> {
    try {
      const scopeKey = await this.resolveOcpSecretScopeKey();
      await this.secretStoragePort.deleteSecret(scopeKey, "ocp-token");
    } catch {
      // best-effort migration cleanup
    }
  }

  private async resolveOcpSecretScopeKey(): Promise<SecretStorageScopeKey> {
    const accountKey = await this.resolveSettingsAccountKey();
    return createSecretStorageScopeKey(accountKey);
  }

  dispose(): void {
    this.deps.externalServicesComposition?.dispose();
    this.sipRecoveryOrchestration.dispose();
    this.ocpIntegration.dispose();
  }

  /**
   * Synthetic F-031 entry for tests and WU-04; real post-store binder lands in WU-11.
   */
  handleExternalServicesCommittedEvent(
    event: DomainEvent,
    snapshot: ExternalServicesProductSnapshot,
  ): void {
    this.deps.externalServicesComposition?.handleCommittedEvent(event, snapshot);
  }

  runExternalServiceRequestNow(
    input: RunExternalServiceRequestNowInput,
  ): Promise<ExternalServiceExecutionResult> {
    const composition = this.deps.externalServicesComposition;
    if (composition === undefined) {
      return Promise.resolve({
        kind: "error",
        category: "validation",
        status: null,
        durationMs: 0,
        body: "",
        bodyTruncated: false,
        code: "external_services_unavailable",
        jsonValidity: "not_applicable",
      });
    }
    return composition.runExternalServiceRequestNow(input);
  }

  async saveExternalServicesSettings(
    externalServices: ExternalServicesSettings,
    expectedSettingsRevision?: number,
  ): Promise<Result<SaveExternalServicesSettingsOutcome, PlatformError>> {
    const composition = this.deps.externalServicesComposition;
    if (composition === undefined) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services runtime is unavailable.",
          { reason: "external_services_unavailable" },
        ),
      );
    }
    try {
      const profileKey = await this.resolveSettingsAccountKey();
      const input: SaveExternalServicesSettingsInput = {
        profileKey,
        externalServices,
        ...(expectedSettingsRevision !== undefined
          ? { expectedSettingsRevision }
          : {}),
      };
      return await composition.saveExternalServicesSettings(input);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  async queryExternalServices(
    input: Omit<QueryExternalServicesInput, "profileKey"> & {
      profileKey?: SettingsAccountKey;
    } = {},
  ): Promise<Result<QueryExternalServicesOutcome, PlatformError>> {
    const composition = this.deps.externalServicesComposition;
    if (composition === undefined) {
      return err(
        createPlatformError(
          "operation_failed",
          "External Services runtime is unavailable.",
          { reason: "external_services_unavailable" },
        ),
      );
    }
    try {
      const profileKey =
        input.profileKey ?? (await this.resolveSettingsAccountKey());
      return await composition.queryExternalServices({
        profileKey,
        ...(input.journalLimit !== undefined
          ? { journalLimit: input.journalLimit }
          : {}),
      });
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  getExternalServicesCompositionForTests(): ExternalServicesComposition | null {
    return this.deps.externalServicesComposition ?? null;
  }

  notifyPeerConnectionAvailable(
    callId: CallId,
    correlationId: CorrelationId,
  ): Promise<void> {
    return this.callEngine.handlePeerConnectionAvailable(callId, correlationId);
  }

  notifyRemoteVideoPresenceFromMedia(callId: CallId, present: boolean): void {
    this.callEngine.handleRemoteVideoPresenceFromMedia(callId, present);
  }
}

type OcpSettingsScopeOptions = Readonly<{
  correlationId?: CorrelationId;
  accountKey?: SettingsAccountKey;
}>;

function appendAccountMetadataWarning(
  outcome: AccountSignInOutcome,
  warning: AccountSignInMetadataWarning,
): AccountSignInOutcome {
  return outcome.metadataWarnings.includes(warning)
    ? outcome
    : {
        ...outcome,
        metadataWarnings: [...outcome.metadataWarnings, warning],
      };
}

function normalizeOcpSettingsScopeOptions(
  options?: CorrelationId | OcpSettingsScopeOptions,
): OcpSettingsScopeOptions {
  if (options === undefined) {
    return {};
  }
  if (typeof options === "string") {
    return { correlationId: options };
  }
  return options;
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

const SIP_PASSWORD_REQUIRED_MESSAGE = "SIP password is required";

function buildContactsCsvExportFileName(): string {
  const datePart = new Date().toISOString().slice(0, 10);
  return `contacts-export-${datePart}.csv`;
}

function buildPreferencesExportFileName(): string {
  const datePart = new Date().toISOString().slice(0, 10);
  return `omnicall-preferences-${datePart}.json`;
}
