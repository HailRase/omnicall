export { InMemoryDomainEventBus } from "./events/InMemoryDomainEventBus.js";
export { CallEngine } from "./services/CallEngine.js";
export { ActiveCallControlService } from "./services/ActiveCallControlService.js";
export { isDialpadNumberValid } from "./helpers/dialpadValidation.js";
export type { AppBootstrapConfig, PhoneStatus, SipAccountInput } from "@domain/index.js";
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
export { ResolveStartupModeUseCase } from "./use-cases/ResolveStartupModeUseCase.js";
export { SendDtmfUseCase } from "./use-cases/SendDtmfUseCase.js";
export {
  AccountBootstrapFacade,
  type AccountBootstrapFacadeDeps,
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
  type MultiCallProjection,
  type MultiCallDisabledReason,
} from "./projections/multiCallProjection.js";
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
} from "./projections/transferPanelProjection.js";
export {
  isBenignTransferFailureReason,
  BENIGN_TRANSFER_FAILURE_REASONS,
} from "./projections/transferFailureReasons.js";
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
  initialConnectionRecoveryProjection,
  reduceConnectionRecoveryProjection,
  type ConnectionRecoveryProjection,
  type ConnectionState,
} from "./projections/connectionRecoveryProjection.js";
export {
  deriveConnectionRecoveryShell,
  type ConnectionRecoveryShellView,
} from "./projections/deriveConnectionRecoveryShell.js";
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
export { ServerTerminateCleanupService } from "./services/ServerTerminateCleanupService.js";
export { InMemoryConnectionRecoveryReadModel } from "./read-models/InMemoryConnectionRecoveryReadModel.js";
export { RetryConnectionUseCase } from "./use-cases/RetryConnectionUseCase.js";
export type { RetryConnectionInput, RetryConnectionChannel } from "./use-cases/RetryConnectionUseCase.js";
export { SafeLogoutUseCase } from "./use-cases/SafeLogoutUseCase.js";
export { ShutdownCleanupUseCase } from "./use-cases/ShutdownCleanupUseCase.js";
export type { ShutdownCleanupInput } from "./use-cases/ShutdownCleanupUseCase.js";
export { ReconnectScheduler } from "./infrastructure/ReconnectScheduler.js";
export type { SchedulerTimerFns, TimerHandle } from "./infrastructure/ReconnectScheduler.js";
export { InMemoryOcpCallCorrelationRegistry } from "./read-models/InMemoryOcpCallCorrelationRegistry.js";
export { InMemoryOcpSyncReadModel } from "./read-models/InMemoryOcpSyncReadModel.js";
export { deriveOperatorStatusDisabledReason } from "./projections/deriveOperatorStatusDisabledReason.js";
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
