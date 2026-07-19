export { InMemoryDomainEventBus } from "./events/InMemoryDomainEventBus.js";
export { CallEngine } from "./services/telephony/CallEngine.js";
export { ActiveCallControlService } from "./services/telephony/ActiveCallControlService.js";
export { isDialpadNumberValid } from "./helpers/dialpadValidation.js";
export {
  buildDialpadHistoryNumbers,
  resolveDialpadCallIntent,
  resolveHistoryWalkStep,
  type DialpadCallIntent,
} from "./helpers/dialpadHistoryRecall.js";
export type { AppBootstrapConfig, PhoneStatus, SipAccountInput, MultiCallSettings } from "@domain/index.js";
export { phoneStatusLabel } from "@domain/index.js";
export { AuthorizeSipAccountUseCase } from "./use-cases/settings/AuthorizeSipAccountUseCase.js";
export { PersistDraftAccountArtifactsUseCase } from "./use-cases/settings/PersistDraftAccountArtifactsUseCase.js";
export { PromoteAuthorizedSipSessionUseCase } from "./use-cases/settings/PromoteAuthorizedSipSessionUseCase.js";
export { ResolveSavedAccountProfileAvailabilityUseCase } from "./use-cases/settings/ResolveSavedAccountProfileAvailabilityUseCase.js";
export {
  deriveSavedAccountProfileAvailability,
  type SavedAccountProfileAvailabilityView,
} from "./projections/settings/deriveSavedAccountProfileAvailability.js";
export { ChangePhoneStatusUseCase } from "./use-cases/settings/ChangePhoneStatusUseCase.js";
export { MakeCallUseCase } from "./use-cases/telephony/MakeCallUseCase.js";
export { AnswerCallUseCase } from "./use-cases/telephony/AnswerCallUseCase.js";
export { RejectCallUseCase } from "./use-cases/telephony/RejectCallUseCase.js";
export { HangupCallUseCase } from "./use-cases/telephony/HangupCallUseCase.js";
export { HoldCallUseCase } from "./use-cases/telephony/HoldCallUseCase.js";
export { ResumeCallUseCase } from "./use-cases/telephony/ResumeCallUseCase.js";
export { MuteCallUseCase } from "./use-cases/telephony/MuteCallUseCase.js";
export { UnmuteCallUseCase } from "./use-cases/telephony/UnmuteCallUseCase.js";
export { HandleIncomingCallUseCase } from "./use-cases/telephony/HandleIncomingCallUseCase.js";
export { AutoAnswerIncomingCallUseCase } from "./use-cases/telephony/AutoAnswerIncomingCallUseCase.js";
export { RejectIncomingCallByDndUseCase } from "./use-cases/telephony/RejectIncomingCallByDndUseCase.js";
export { BlindTransferUseCase } from "./use-cases/telephony/BlindTransferUseCase.js";
export { StartConsultationUseCase } from "./use-cases/telephony/StartConsultationUseCase.js";
export { AttendedTransferUseCase } from "./use-cases/telephony/AttendedTransferUseCase.js";
export { StartTransferUseCase } from "./use-cases/telephony/StartTransferUseCase.js";
export { CancelTransferUseCase } from "./use-cases/telephony/CancelTransferUseCase.js";
export { RegisterAccountUseCase } from "./use-cases/settings/RegisterAccountUseCase.js";
export { UnregisterAccountUseCase } from "./use-cases/settings/UnregisterAccountUseCase.js";
export type { UnregisterAccountInput } from "./use-cases/settings/UnregisterAccountUseCase.js";
export { ResolveStartupModeUseCase } from "./use-cases/platform/ResolveStartupModeUseCase.js";
export { SendDtmfUseCase } from "./use-cases/telephony/SendDtmfUseCase.js";
export {
  AccountBootstrapFacade,
  type AccountBootstrapFacadeDeps,
  type AuthorizeAccountOutcome,
  type AuthorizeAccountMetadataWarning,
} from "./facades/AccountBootstrapFacade.js";
export {
  createReadyAccountSignInOutcome,
  createSipRegistrationFailedAccountSignInOutcome,
  type AccountSignInOutcome,
  type AccountTelephonyOutcome,
} from "@domain/index.js";
export {
  validateAccountSignInCommand,
  createAccountSignInLogoutRequiredError,
  ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE,
  type AccountSignInCommand,
  type AccountSignInMode,
  type AccountSignInProfileRef,
  type AccountSignInSavePreferences,
  type AccountSignInRejectReasonKey,
} from "./facades/accountSignInCommand.js";
export {
  deriveAccountSignInViewModel,
  deriveAccountOcpProfileOptions,
  deriveAllowedAccountRecoveryActions,
  type AccountSignInViewModel,
  type AccountSignInSelectedProfileView,
  type AccountSignInLoginDisabledReasonKey,
} from "./projections/settings/accountSignInViewModel.js";
export {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
  type AccountBootstrapProjection,
  type AuthUiState,
} from "./projections/settings/accountBootstrapProjection.js";
export {
  deriveDialpadDisabledReason,
  initialCallProjection,
  reduceCallProjection,
  setDialpadMode,
  type CallProjection,
  type DialpadDisabledContext,
  type DialpadMode,
  type DialpadUiState,
} from "./projections/telephony/callProjection.js";
export {
  createActiveCallControlsProjection,
  initialActiveCallControlsProjection,
  reduceActiveCallControlsProjection,
  type ActiveCallControlsProjection,
  type ActiveControlDisabledReason,
  type ActiveCallControlOperationError,
} from "./projections/telephony/activeCallControlsProjection.js";
export {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
  setIncomingCallUiState,
  setIncomingRejectReasonRequired,
  type IncomingCallProjection,
  type IncomingCallUiState,
} from "./projections/telephony/incomingCallProjection.js";
export {
  computeAutoAnswerExpiresAt,
  deriveAutoAnswerSecondsRemaining,
} from "./projections/telephony/deriveAutoAnswerCountdown.js";
export {
  decideAutoAnswer,
  type AutoAnswerDecision,
} from "./policies/AutoAnswerPolicy.js";
export {
  decideDndIncomingReject,
  type DndRejectDecision,
} from "./policies/DndRejectPolicy.js";
export {
  initialMultiCallProjection,
  reduceMultiCallProjection,
  setMultiCallSettings,
  deriveIncomingAnswerDisabledReason,
  deriveResumeMultiCallDisabledReason,
  type MultiCallProjection,
  type MultiCallDisabledReason,
  type MultiCallPolicyViolation,
} from "./projections/telephony/multiCallProjection.js";
export {
  deriveCallLineStatusLabel,
  type CallLineStatusInput,
} from "./projections/telephony/deriveCallLineStatusLabel.js";
export { deriveCallControlTarget } from "./projections/telephony/deriveCallControlTarget.js";
export { resolveOutgoingInProgressCallId } from "./projections/telephony/resolveOutgoingInProgressCallId.js";

export { deriveIncomingCallControlLine } from "./projections/telephony/deriveIncomingCallControlLine.js";
export {
  deriveIncomingCallIdentityShell,
  type IncomingCallIdentityShellViewModel,
} from "./projections/telephony/deriveIncomingCallIdentityShell.js";
export {
  deriveIncomingCallSessionCardVisible,
  type DeriveIncomingCallSessionCardVisibleInput,
} from "./projections/telephony/deriveIncomingCallSessionCardVisible.js";
export {
  deriveIncomingCallGlobalOverlayVisible,
  type DeriveIncomingCallGlobalOverlayVisibleInput,
  type IncomingCallOverlayShellRouteName,
} from "./projections/telephony/deriveIncomingCallGlobalOverlayVisible.js";
export {
  deriveCallLinesShell,
  type CallLineCardViewModel,
  type CallLinePrimaryAction,
  type CallLinesShellDeriveInput,
  type CallLinesShellViewModel,
} from "./projections/telephony/deriveCallLinesShell.js";
export {
  deriveTransferTargetCandidates,
  type DeriveTransferTargetCandidatesInput,
  type TransferTargetCandidate,
} from "./projections/telephony/deriveTransferTargetCandidates.js";
export {
  initialTransferProjection,
  reduceTransferProjection,
  deriveBlindTransferDisabledReason,
  deriveStartConsultationDisabledReason,
  deriveAttendedTransferDisabledReason,
  deriveStartTransferDisabledReason,
  type TransferProjection,
  type TransferPhase,
  type BlindTransferDisabledContext,
  type StartConsultationDisabledContext,
  type AttendedTransferDisabledContext,
  type StartTransferDisabledContext,
} from "./projections/telephony/transferProjection.js";
export {
  isTransferPanelVisible,
  isTransferInProgress,
  resolveTransferFailureMessage,
  resolveTransferFailureBanner,
  type TransferFailureBanner,
} from "./projections/telephony/transferPanelProjection.js";
export {
  isBenignTransferFailureReason,
  BENIGN_TRANSFER_FAILURE_REASONS,
} from "./projections/telephony/transferFailureReasons.js";
export {
  isTransferSuccessCelebrationEvent,
  TRANSFER_SUCCESS_CELEBRATION_TTL_MS,
} from "./projections/telephony/transferSuccessCelebration.js";
export {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
  type MultiLineCallProjection,
  type CallLine,
  type CallLineRole,
} from "./projections/telephony/multiLineCallProjection.js";
export {
  initialSipSessionHealthProjection,
  reduceSipSessionHealthProjection,
  type SipSessionHealthProjection,
} from "./projections/telephony/sipSessionHealthProjection.js";
export {
  isSipManualRetryAvailable,
  isSipRecoveryInProgress,
} from "./projections/telephony/deriveSipManualRetryGate.js";
export {
  deriveSipStatusShell,
  type SipStatusDotTone,
  type SipStatusShellInput,
  type SipStatusShellView,
} from "./projections/telephony/deriveSipStatusShell.js";
export {
  deriveSipSystemStateShell,
  type SipSystemStateShellInput,
  type SipSystemStateShellView,
} from "./projections/telephony/deriveSipSystemStateShell.js";
export {
  deriveSessionLogoutShell,
  pickSessionLogoutProjectionInput,
  type SessionLogoutShellInput,
  type SessionLogoutProjectionInput,
  type SessionLogoutShellView,
} from "./projections/platform/deriveSessionLogoutShell.js";
export { SipRecoveryOrchestrationService } from "./services/recovery/SipRecoveryOrchestrationService.js";
export type { SipRecoveryOrchestrationDeps } from "./services/recovery/SipRecoveryOrchestrationService.js";
export { SipConnectionJournal } from "./services/recovery/SipConnectionJournal.js";
export type {
  SipConnectionJournalEntry,
  SipConnectionJournalCategory,
} from "./services/recovery/SipConnectionJournal.js";
export { ShellWindowLayoutService } from "./services/platform/ShellWindowLayoutService.js";
export type { ShellWindowLayoutServiceInput } from "./services/platform/ShellWindowLayoutService.js";
export { SessionTeardownOrchestrationService } from "./services/platform/SessionTeardownOrchestrationService.js";
export type {
  SessionTeardownInput,
  SessionTeardownOutcome,
  SessionTeardownOperation,
} from "./services/platform/SessionTeardownOrchestrationService.js";
export { InMemorySipSessionHealthReadModel } from "./read-models/InMemorySipSessionHealthReadModel.js";
export { RetryConnectionUseCase } from "./use-cases/platform/RetryConnectionUseCase.js";
export type { RetryConnectionInput, RetryConnectionChannel } from "./use-cases/platform/RetryConnectionUseCase.js";
export { ManualSipTransportReconnectUseCase } from "./use-cases/telephony/ManualSipTransportReconnectUseCase.js";
export type { ManualSipTransportReconnectInput } from "./use-cases/telephony/ManualSipTransportReconnectUseCase.js";
export { ReregisterSipUseCase } from "./use-cases/telephony/ReregisterSipUseCase.js";
export type { ReregisterSipInput } from "./use-cases/telephony/ReregisterSipUseCase.js";
export {
  MIN_SIP_REREGISTER_INTERVAL_SEC,
  MIN_SIP_RECONNECT_INTERVAL_SEC,
  DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
  DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
  DEFAULT_SIP_RECONNECT_INTERVAL_SEC,
  DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
} from "@domain/settings/SipRecoverySettings.js";
export { APP_THEMES, DEFAULT_APP_THEME, parseAppTheme, type AppTheme } from "@domain/settings/AppTheme.js";
export {
  NOTIFICATION_PLACEMENTS,
  NOTIFICATION_STACKING_MODES,
  MIN_NOTIFICATION_DURATION_MS,
  MAX_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_MAX_VISIBLE,
  MAX_NOTIFICATION_MAX_VISIBLE,
  type NotificationPlacement,
  type NotificationStacking,
} from "@domain/settings/NotificationSettings.js";
export {
  DEFAULT_SUPPORTED_LANGUAGE,
  SUPPORTED_LANGUAGES,
  parseSupportedLanguage,
  type SupportedLanguage,
} from "@domain/settings/SupportedLanguage.js";
export {
  createDefaultUserSettings,
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_AUTO_ANSWER_TIMEOUT_SEC,
  OCP_INTEGRATION_DEFAULTS,
  parseOcpIntegrationSettings,
  type OcpIntegrationSettings,
  type UserSettings,
} from "@domain/index.js";
export type { HeadsetFaultReason } from "@domain/index.js";
export {
  reorderAudioCodecs,
  reorderVideoCodecs,
  setAudioCodecEnabled,
  setVideoCodecEnabled,
  type AudioCodecId,
  type CodecPreferences,
  type VideoCodecId,
} from "@domain/index.js";
export {
  mapCodecPreferenceMutationError,
  type CodecPreferenceMutationMessageKey,
} from "./settings/mapCodecPreferenceMutationError.js";
export {
  isAudioCodecToggleDisabled,
  isVideoCodecToggleDisabled,
} from "./settings/deriveCodecCheckboxDisabled.js";
export { SafeLogoutUseCase } from "./use-cases/platform/SafeLogoutUseCase.js";
export { EndUserSessionUseCase } from "./use-cases/platform/EndUserSessionUseCase.js";
export type { EndUserSessionInput } from "./use-cases/platform/EndUserSessionUseCase.js";
export { ShutdownCleanupUseCase } from "./use-cases/platform/ShutdownCleanupUseCase.js";
export type { ShutdownCleanupInput } from "./use-cases/platform/ShutdownCleanupUseCase.js";
export { ReconnectScheduler } from "./infrastructure/ReconnectScheduler.js";
export type { SchedulerTimerFns, TimerHandle } from "./infrastructure/ReconnectScheduler.js";
export { deriveAuthShellFlags } from "./projections/settings/deriveAuthShellFlags.js";
export {
  deriveDefaultSettingsSection,
  type SettingsEntrySection,
} from "./projections/settings/deriveDefaultSettingsSection.js";
export {
  deriveSettingsNavigationAvailability,
  isSettingsNavSectionId,
  resolveAllowedSettingsSection,
  SETTINGS_NAV_SECTION_IDS,
  type SettingsNavDisabledReasonKey,
  type SettingsNavSectionId,
  type SettingsNavigationAvailability,
  type SettingsSectionAvailability,
} from "./projections/settings/deriveSettingsNavigationAvailability.js";
export {
  deriveOcpModuleEditShell,
  type OcpModuleEditShell,
  type OcpModuleEditShellInput,
} from "./projections/settings/deriveOcpModuleEditShell.js";
export {
  deriveOcpSystemStateShell,
  type OcpSystemStateShellInput,
  type OcpSystemStateShellView,
  type OcpServerStateLabelKey,
  type OcpAuthorizationStateLabelKey,
  type OcpRecoveryActionLabelKey,
} from "./projections/integration/deriveOcpSystemStateShell.js";
export {
  deriveActiveProfileSettingsSyncKey,
} from "./projections/settings/deriveSettingsAccountProfileShell.js";
export {
  deriveSavedAccountProfileSelectorOptions,
  type SavedAccountProfileSelectorOption,
} from "./projections/settings/deriveSavedAccountProfileSelectorOptions.js";
export {
  createSettingsAccountKey,
  type SettingsAccountKey,
  type SavedAccountProfile,
  type SavedAccountProfileId,
  type Contact,
  type ContactInput,
  type ContactUpdateInput,
  type ContactValidationError,
  type CallHistoryEntry,
} from "@domain/index.js";
export type { ContactsCsvImportSummary } from "./use-cases/contacts/ImportContactsCsvUseCase.js";
export {
  deriveContactsShell,
  type ContactsShellViewModel,
  type ContactShellViewModel,
  type ContactCallDisabledReasonKey,
} from "./projections/contacts/deriveContactsShell.js";
export {
  deriveAccountPanelActionsShell,
  type AccountPanelActionsShell,
  type AccountPanelActionsShellInput,
  type AccountPanelActionReasonKey,
} from "./projections/settings/deriveAccountPanelActionsShell.js";
export type { OcpRecoveryAction } from "@domain/integration/ocp/ocpDualFsm.js";
export type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
export type { OcpAuthorizationState } from "@domain/integration/ocp/OcpAuthorizationState.js";
export {
  mapAccountAuthorizationError,
  type AccountAuthorizationErrorKey,
  type AccountAuthorizationErrorProjection,
} from "./projections/settings/mapAccountAuthorizationError.js";
export {
  deriveAccountSignInNotificationFeedback,
  shouldAttachOpenSystemStateAction,
  type AccountSignInNotificationFeedback,
  type AccountSignInSuccessMessageKey,
} from "./projections/settings/deriveAccountSignInNotificationFeedback.js";
export {
  deriveSavedProfilePanelMode,
  type SavedProfilePanelMode,
} from "./projections/settings/deriveSavedProfilePanelMode.js";
export { deriveRegisteredAccountIdentity } from "./projections/settings/deriveRegisteredAccountIdentity.js";
export { resolveAccountAuthorizeTargetIdentity } from "./projections/settings/resolveAccountAuthorizeTargetIdentity.js";
export { formatAccountSwitchLoginLabel } from "./projections/settings/formatAccountSwitchLoginLabel.js";
export { sanitizeRegistrationServerMessage } from "./projections/settings/sanitizeRegistrationServerMessage.js";
export {
  findSavedAccountProfileByInput,
  matchesSipAccountIdentity,
  type SettingsAccountIdentity,
} from "./projections/settings/savedProfileIdentity.js";
export {
  buildContactDirectory,
  resolveCallLineDisplayName,
  resolveCallerPresentation,
  type CallerPresentation,
  type CallerPresentationSource,
  type ContactDirectory,
} from "./read-models/contactDirectory.js";
export {
  deriveHeaderChromeShell,
  type HeaderChromeShellInput,
  type HeaderChromeShellViewModel,
  type RegistrationDotVariant,
} from "./projections/platform/deriveHeaderChromeShell.js";
export {
  deriveActiveCallControlsShell,
} from "./projections/telephony/deriveActiveCallControlsShell.js";
export {
  initialCallVideoMediaUiProjection,
  reduceCallVideoMediaUiProjection,
  type CallVideoMediaUiProjection,
} from "./projections/media/callVideoMediaUiProjection.js";
export {
  resolveFullscreenVideoSession,
  type FullscreenVideoSession,
} from "./projections/media/resolveFullscreenVideoSession.js";
export {
  initialOcpSessionProjection,
  reduceOcpSessionFromConnectionState,
  reduceOcpSessionFromServerState,
  reduceOcpSessionFromMessage,
  applyOcpSessionDomain,
  applyOcpAuthFeedback,
  clearOcpAuthFeedback,
  applyAuthorizationProgress,
  selectIsOcpConnected,
  selectOcpAuthFeedback,
  selectOcpDomain,
  selectOcpServerState,
  selectOcpAuthorizationState,
  selectPrimaryRecoveryAction,
  type OcpSessionProjection,
  type OcpAuthFeedback,
  type OcpAuthFeedbackReason,
} from "./projections/integration/ocpSessionProjection.js";
export {
  initialAuthorizationProgressProjection,
  applyAuthorizationProgressStage,
  clearAuthorizationProgress,
  mapAuthorizationFailureStage,
  type AuthorizationProgressProjection,
  type AuthorizationProgressStage,
} from "./projections/settings/authorizationProgressProjection.js";
export {
  isAuthorizationRetryableStage,
  resolveAuthorizationRetryStrategy,
  type AuthorizationAttemptContext,
  type AuthorizationAttemptKind,
  type AuthorizationRetryStrategy,
} from "./projections/settings/authorizationRetryContext.js";
export {
  OcpBackedSignInOrchestrationService,
  type OcpBackedSignInOutcome,
  type OcpBackedSignInInput,
} from "./services/integration/OcpBackedSignInOrchestrationService.js";
export type {
  OcpConnectLoginOption,
  OcpConnectLoginTarget,
  OcpConnectLoginTargetResult,
} from "@domain/index.js";
export {
  buildOcpConnectLoginOptions,
  resolveOcpConnectLoginTarget,
} from "@domain/index.js";
export type { OcpNotificationPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
export {
  initialOperatorStatusProjection,
  reduceOperatorStatusFromUsers,
  applyOperatorReservedStatus,
  clearOperatorReservedStatus,
  selectOperatorStatus,
  selectOperatorIsBusy,
  selectIsCallButtonBlocked,
  toOperatorProfile,
  type OperatorStatusProjection,
} from "./projections/integration/operatorStatusProjection.js";
export {
  OperatorStatus,
  OPERATOR_STATUS_LABEL_KEY,
  OCP_MAX_RECONNECT_ATTEMPTS,
  resolveOperatorStatusTone,
  resolveOperatorStatusColorVar,
  resolveOperatorStatusLabelKey,
  isOperatorStatusBusy,
  isOperatorStatusSelectorDisabled,
  isPostCallProcessing,
  resolveOperatorStatusChangeMode,
  resolveOperatorStatusChangeModeFromProjection,
  resolvePostCallFinishTarget,
  resolvePostCallFinishAppealProjection,
  type OcpOperatorStatusLabelKey,
  type OperatorStatusChangeMode,
  type OperatorStatusValue,
  type OperatorStatusTone,
  type PostCallFinishTarget,
  type PostCallFinishAppealProjection,
} from "./projections/integration/operatorStatusPresentation.js";
export { FinishPostCallAppealUseCase } from "./use-cases/integration/ocp/FinishPostCallAppealUseCase.js";
export type { FinishPostCallAppealInput } from "./use-cases/integration/ocp/FinishPostCallAppealUseCase.js";
export {
  initialOcpReasonsProjection,
  reduceOcpReasonsFromPayload,
  type OcpReasonsProjection,
} from "./projections/integration/ocpReasonsProjection.js";
export {
  initialCampaignEventProjection,
  reduceCampaignEventFromPayload,
  clearCampaignEvent,
  type CampaignEventProjection,
} from "./projections/integration/campaignEventProjection.js";
export { OcpProjectionHub } from "./read-models/OcpProjectionHub.js";
export { OcpIntegrationComposition } from "./services/integration/OcpIntegrationComposition.js";
export {
  areCameraControlsEnabled,
  isScreenShareAllowed,
  shouldShowRemoteVideoSurface,
  shouldShowVideoSurfaces,
  resolveVideoCallAvailability,
  isSessionViewMode,
  parseSessionViewMode,
  SESSION_VIEW_MODES,
} from "@domain/index.js";
export type { CallVideoMediaState, SessionViewMode, VideoCallDisabledReason } from "@domain/index.js";
export type {
  LocalMediaStreamHandle,
  MediaInputDeviceInfo,
  StartCameraPreviewResult,
} from "@ports/index.js";