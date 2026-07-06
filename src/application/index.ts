export { InMemoryDomainEventBus } from "./events/InMemoryDomainEventBus.js";
export { CallEngine } from "./services/CallEngine.js";
export { ActiveCallControlService } from "./services/ActiveCallControlService.js";
export { isDialpadNumberValid } from "./helpers/dialpadValidation.js";
export type { AppBootstrapConfig, PhoneStatus, SipAccountInput, MultiCallSettings } from "@domain/index.js";
export { phoneStatusLabel } from "@domain/index.js";
export { AuthenticateOcpUseCase } from "./use-cases/AuthenticateOcpUseCase.js";
export { AuthorizeSipAccountUseCase } from "./use-cases/AuthorizeSipAccountUseCase.js";
export { ChangePhoneStatusUseCase } from "./use-cases/ChangePhoneStatusUseCase.js";
export { ChangeAgentStatusUseCase } from "./use-cases/ChangeAgentStatusUseCase.js";
export { UpdatePostCallStatusUseCase } from "./use-cases/UpdatePostCallStatusUseCase.js";
export { MakeCallUseCase } from "./use-cases/MakeCallUseCase.js";
export { AnswerCallUseCase } from "./use-cases/AnswerCallUseCase.js";
export { RejectCallUseCase } from "./use-cases/RejectCallUseCase.js";
export { HangupCallUseCase } from "./use-cases/HangupCallUseCase.js";
export { HoldCallUseCase } from "./use-cases/HoldCallUseCase.js";
export { ResumeCallUseCase } from "./use-cases/ResumeCallUseCase.js";
export { MuteCallUseCase } from "./use-cases/MuteCallUseCase.js";
export { UnmuteCallUseCase } from "./use-cases/UnmuteCallUseCase.js";
export { HandleIncomingCallUseCase } from "./use-cases/HandleIncomingCallUseCase.js";
export { SelectRejectReasonUseCase } from "./use-cases/SelectRejectReasonUseCase.js";
export { AutoAnswerIncomingCallUseCase } from "./use-cases/AutoAnswerIncomingCallUseCase.js";
export { RejectIncomingCallByDndUseCase } from "./use-cases/RejectIncomingCallByDndUseCase.js";
export { BlindTransferUseCase } from "./use-cases/BlindTransferUseCase.js";
export { StartConsultationUseCase } from "./use-cases/StartConsultationUseCase.js";
export { AttendedTransferUseCase } from "./use-cases/AttendedTransferUseCase.js";
export { StartTransferUseCase } from "./use-cases/StartTransferUseCase.js";
export { CancelTransferUseCase } from "./use-cases/CancelTransferUseCase.js";
export { RegisterAccountUseCase } from "./use-cases/RegisterAccountUseCase.js";
export { UnregisterAccountUseCase } from "./use-cases/UnregisterAccountUseCase.js";
export type { UnregisterAccountInput } from "./use-cases/UnregisterAccountUseCase.js";
export { ResolveStartupModeUseCase } from "./use-cases/ResolveStartupModeUseCase.js";
export { SendDtmfUseCase } from "./use-cases/SendDtmfUseCase.js";
export {
  AccountBootstrapFacade,
  type AccountBootstrapFacadeDeps,
  type AuthorizeAccountOutcome,
  type AuthorizeAccountMetadataWarning,
} from "./facades/AccountBootstrapFacade.js";
export {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
  setBootstrapMode,
  type AccountBootstrapProjection,
  type AuthUiState,
} from "./projections/accountBootstrapProjection.js";
export {
  deriveDialpadDisabledReason,
  initialCallProjection,
  reduceCallProjection,
  setDialpadMode,
  type CallProjection,
  type DialpadDisabledContext,
  type DialpadMode,
  type DialpadUiState,
} from "./projections/callProjection.js";
export {
  createActiveCallControlsProjection,
  initialActiveCallControlsProjection,
  reduceActiveCallControlsProjection,
  type ActiveCallControlsProjection,
  type ActiveControlDisabledReason,
  type ActiveCallControlOperationError,
} from "./projections/activeCallControlsProjection.js";
export {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
  setIncomingCallUiState,
  setIncomingRejectReasonRequired,
  type IncomingCallProjection,
  type IncomingCallUiState,
} from "./projections/incomingCallProjection.js";
export {
  computeAutoAnswerExpiresAt,
  deriveAutoAnswerSecondsRemaining,
} from "./projections/deriveAutoAnswerCountdown.js";
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
} from "./projections/multiCallProjection.js";
export {
  deriveCallLineStatusLabel,
  type CallLineStatusInput,
} from "./projections/deriveCallLineStatusLabel.js";
export { deriveCallControlTarget } from "./projections/deriveCallControlTarget.js";
export { deriveIncomingCallControlLine } from "./projections/deriveIncomingCallControlLine.js";
export {
  deriveCallLinesShell,
  type CallLineCardViewModel,
  type CallLinePrimaryAction,
  type CallLinesShellDeriveInput,
  type CallLinesShellViewModel,
} from "./projections/deriveCallLinesShell.js";
export {
  deriveTransferTargetCandidates,
  type DeriveTransferTargetCandidatesInput,
  type TransferTargetCandidate,
} from "./projections/deriveTransferTargetCandidates.js";
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
} from "./projections/transferProjection.js";
export {
  isTransferPanelVisible,
  isTransferInProgress,
  resolveTransferFailureMessage,
  resolveTransferFailureBanner,
  type TransferFailureBanner,
} from "./projections/transferPanelProjection.js";
export {
  isBenignTransferFailureReason,
  BENIGN_TRANSFER_FAILURE_REASONS,
} from "./projections/transferFailureReasons.js";
export {
  isTransferSuccessCelebrationEvent,
  TRANSFER_SUCCESS_CELEBRATION_TTL_MS,
} from "./projections/transferSuccessCelebration.js";
export {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
  type MultiLineCallProjection,
  type CallLine,
  type CallLineRole,
} from "./projections/multiLineCallProjection.js";
export {
  initialOperatorStatusProjection,
  reduceOperatorStatusProjection,
  type OperatorStatusProjection,
  type OperatorStatusDisabledReason,
} from "./projections/operatorStatusProjection.js";
export {
  initialQueueInfoProjection,
  reduceQueueInfoProjection,
  getQueueNameForCall,
  getQueueLoadingSinceForCall,
  deriveQueueLabelState,
  QUEUE_LABEL_NA_TIMEOUT_MS,
  type QueueInfoProjection,
  type QueueLabelState,
} from "./projections/queueInfoProjection.js";
export {
  initialOcpNotificationProjection,
  reduceOcpNotificationProjection,
  type OcpNotificationProjection,
  type OcpToastItem,
} from "./projections/ocpNotificationProjection.js";
export {
  initialOcpConnectionRecoveryProjection,
  reduceOcpConnectionRecoveryProjection,
  type OcpConnectionRecoveryProjection,
  type OcpConnectionState,
} from "./projections/ocpConnectionRecoveryProjection.js";
export {
  initialSipSessionHealthProjection,
  reduceSipSessionHealthProjection,
  type SipSessionHealthProjection,
} from "./projections/sipSessionHealthProjection.js";
export {
  isSipManualRetryAvailable,
  isSipRecoveryInProgress,
} from "./projections/deriveSipManualRetryGate.js";
export {
  deriveSipStatusShell,
  type SipStatusDotTone,
  type SipStatusShellInput,
  type SipStatusShellView,
} from "./projections/deriveSipStatusShell.js";
export {
  deriveSipSystemStateShell,
  type SipSystemStateShellInput,
  type SipSystemStateShellView,
} from "./projections/deriveSipSystemStateShell.js";
export {
  deriveSessionLogoutShell,
  pickSessionLogoutProjectionInput,
  type SessionLogoutShellInput,
  type SessionLogoutProjectionInput,
  type SessionLogoutShellView,
} from "./projections/deriveSessionLogoutShell.js";
export {
  initialCampaignProjection,
  reduceCampaignProjection,
  getCampaignForCall,
  deriveCampaignContextState,
  type CampaignProjection,
  type CampaignContext,
  type CampaignContextState,
} from "./projections/campaignProjection.js";
export { RegisterOcpCallCorrelationUseCase } from "./use-cases/RegisterOcpCallCorrelationUseCase.js";
export { ProcessOcpInboundMessageUseCase } from "./use-cases/ProcessOcpInboundMessageUseCase.js";
export type { ProcessOcpInboundMessageOutcome } from "./use-cases/ProcessOcpInboundMessageUseCase.js";
export { RespondToCampaignUseCase } from "./use-cases/RespondToCampaignUseCase.js";
export { SendDlgStopUseCase } from "./use-cases/SendDlgStopUseCase.js";
export { CallEndDlgStopOrchestrationService } from "./services/CallEndDlgStopOrchestrationService.js";
export { ConnectionRecoveryOrchestrationService } from "./services/ConnectionRecoveryOrchestrationService.js";
export type { ConnectionRecoveryOrchestrationDeps } from "./services/ConnectionRecoveryOrchestrationService.js";
export { SipRecoveryOrchestrationService } from "./services/SipRecoveryOrchestrationService.js";
export type { SipRecoveryOrchestrationDeps } from "./services/SipRecoveryOrchestrationService.js";
export { SipConnectionJournal } from "./services/SipConnectionJournal.js";
export type {
  SipConnectionJournalEntry,
  SipConnectionJournalCategory,
} from "./services/SipConnectionJournal.js";
export { ShellWindowLayoutService } from "./services/ShellWindowLayoutService.js";
export type { ShellWindowLayoutServiceInput } from "./services/ShellWindowLayoutService.js";
export { ServerTerminateCleanupService } from "./services/ServerTerminateCleanupService.js";
export { SessionTeardownOrchestrationService } from "./services/SessionTeardownOrchestrationService.js";
export type {
  SessionTeardownInput,
  SessionTeardownOutcome,
  SessionTeardownOperation,
} from "./services/SessionTeardownOrchestrationService.js";
export { InMemoryConnectionRecoveryReadModel } from "./read-models/InMemoryConnectionRecoveryReadModel.js";
export { InMemorySipSessionHealthReadModel } from "./read-models/InMemorySipSessionHealthReadModel.js";
export { RetryConnectionUseCase } from "./use-cases/RetryConnectionUseCase.js";
export type { RetryConnectionInput, RetryConnectionChannel } from "./use-cases/RetryConnectionUseCase.js";
export { ManualSipTransportReconnectUseCase } from "./use-cases/ManualSipTransportReconnectUseCase.js";
export type { ManualSipTransportReconnectInput } from "./use-cases/ManualSipTransportReconnectUseCase.js";
export { ReregisterSipUseCase } from "./use-cases/ReregisterSipUseCase.js";
export type { ReregisterSipInput } from "./use-cases/ReregisterSipUseCase.js";
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
  DEFAULT_SUPPORTED_LANGUAGE,
  SUPPORTED_LANGUAGES,
  parseSupportedLanguage,
  type SupportedLanguage,
} from "@domain/settings/SupportedLanguage.js";
export {
  createDefaultUserSettings,
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_AUTO_ANSWER_TIMEOUT_SEC,
  type UserSettings,
} from "@domain/index.js";
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
export { isAudioCodecToggleDisabled } from "./settings/deriveCodecCheckboxDisabled.js";
export { SafeLogoutUseCase } from "./use-cases/SafeLogoutUseCase.js";
export { EndUserSessionUseCase } from "./use-cases/EndUserSessionUseCase.js";
export type { EndUserSessionInput } from "./use-cases/EndUserSessionUseCase.js";
export { ShutdownCleanupUseCase } from "./use-cases/ShutdownCleanupUseCase.js";
export type { ShutdownCleanupInput } from "./use-cases/ShutdownCleanupUseCase.js";
export { ReconnectScheduler } from "./infrastructure/ReconnectScheduler.js";
export type { SchedulerTimerFns, TimerHandle } from "./infrastructure/ReconnectScheduler.js";
export { InMemoryOcpCallCorrelationRegistry } from "./read-models/InMemoryOcpCallCorrelationRegistry.js";
export { InMemoryOcpSyncReadModel } from "./read-models/InMemoryOcpSyncReadModel.js";
export { deriveOperatorStatusDisabledReason } from "./projections/deriveOperatorStatusDisabledReason.js";
export {
  buildOperatorBreakReasonContext,
  deriveOperatorControlDisabledReason,
} from "./projections/deriveOperatorControlDisabledReason.js";
export { deriveAuthShellFlags } from "./projections/deriveAuthShellFlags.js";
export {
  deriveActiveProfileSettingsSyncKey,
} from "./projections/deriveSettingsAccountProfileShell.js";
export {
  deriveSavedAccountProfileSelectorOptions,
  type SavedAccountProfileSelectorOption,
} from "./projections/deriveSavedAccountProfileSelectorOptions.js";
export {
  createSettingsAccountKey,
  type SavedAccountProfile,
  type SavedAccountProfileId,
} from "@domain/index.js";
export {
  deriveAccountPanelActionsShell,
  type AccountPanelActionsShell,
  type AccountPanelActionsShellInput,
  type AccountPanelActionReasonKey,
} from "./projections/deriveAccountPanelActionsShell.js";
export {
  mapAccountAuthorizationError,
  type AccountAuthorizationErrorKey,
  type AccountAuthorizationErrorProjection,
} from "./projections/mapAccountAuthorizationError.js";
export {
  deriveSavedProfilePanelMode,
  type SavedProfilePanelMode,
} from "./projections/deriveSavedProfilePanelMode.js";
export { deriveRegisteredAccountIdentity } from "./projections/deriveRegisteredAccountIdentity.js";
export { resolveAccountAuthorizeTargetIdentity } from "./projections/resolveAccountAuthorizeTargetIdentity.js";
export { formatAccountSwitchLoginLabel } from "./projections/formatAccountSwitchLoginLabel.js";
export { sanitizeRegistrationServerMessage } from "./projections/sanitizeRegistrationServerMessage.js";
export {
  findSavedAccountProfileByInput,
  matchesSipAccountIdentity,
  type SettingsAccountIdentity,
} from "./projections/savedProfileIdentity.js";
export {
  deriveHeaderChromeShell,
  type HeaderChromeShellInput,
  type HeaderChromeShellViewModel,
  type RegistrationDotVariant,
} from "./projections/deriveHeaderChromeShell.js";
export { deriveActiveCallControlsShell } from "./projections/deriveActiveCallControlsShell.js";
export {
  agentStatusLabel,
  type AgentStatus,
  type AgentStatusRejectionReason,
} from "./view-models/operatorStatusViewModel.js";
export { AgentStatusValidationService } from "./services/AgentStatusValidationService.js";
export { AgentStatusSyncService } from "./services/AgentStatusSyncService.js";
export { BreakReasonsSyncService } from "./services/BreakReasonsSyncService.js";
export { DndAgentStatusOrchestrationService } from "./services/DndAgentStatusOrchestrationService.js";
export { OcpAuthBootstrapService } from "./services/OcpAuthBootstrapService.js";
export { PostCallRejectOrchestrationService } from "./services/PostCallRejectOrchestrationService.js";
export {
  deriveStatusDurationSeconds,
  deriveStatusTimerRunning,
} from "./projections/operatorStatusTimerProjection.js";
export { InMemoryAgentStatusReadModel } from "./read-models/InMemoryAgentStatusReadModel.js";
