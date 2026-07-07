export type { DomainEventHandler, DomainEventPublisher } from "./events/DomainEventPublisher.js";
export type {
  OcpAuthenticateCommand,
  ChangeAgentStatusCommand,
  ChangeAgentStatusResult,
  GetAgentStatusCommand,
  GetBreakReasonsCommand,
  UpdatePostCallStatusCommand,
  UpdatePostCallStatusResult,
  RequestLogoutCommand,
  RequestLogoutResult,
  OcpTransportDisconnectedNotification,
  OcpInboundRawHandler,
  OperatorPlatformGateway,
} from "./operator/OperatorPlatformGateway.js";
export type { OcpSyncGateway, RespondToCampaignCommand, RespondToCampaignResult, SendDlgStopCommand, SendDlgStopResult } from "./operator/OcpSyncGateway.js";
export type { OcpCallCorrelationRegistry } from "./operator/OcpCallCorrelationRegistry.js";
export type { OcpSyncReadModel, OcpSyncReadModelSnapshot } from "./operator/OcpSyncReadModel.js";
export type {
  AgentStatusReadModel,
  AgentStatusReadModelSnapshot,
} from "./operator/AgentStatusReadModel.js";
export type {
  ConnectionRecoveryReadModel,
  ConnectionRecoveryReadModelSnapshot,
} from "./operator/ConnectionRecoveryReadModel.js";
export type {
  SipSessionHealthReadModel,
  SipSessionHealthReadModelSnapshot,
} from "./telephony/SipSessionHealthReadModel.js";
export type {
  MediaGateway,
  AttachRemoteAudioCommand,
  PlayIncomingRingtoneCommand,
  PlayRingtoneCommand,
  PlayBusyToneCommand,
  PlayFailedToneCommand,
  PlayRingbackToneCommand,
  RemoteAudioAttachOutcome,
  StopRingtoneCommand,
  StopToneCommand,
  MuteCallCommand,
  UnmuteCallCommand,
  ReleaseAllMediaCommand,
} from "./media/MediaGateway.js";
export type {
  AnswerCallCommand,
  HangupCommand,
  HoldCallCommand,
  MakeCallCommand,
  MakeCallProgress,
  RegisterAccountCommand,
  RejectCallCommand,
  ResumeCallCommand,
  SendDtmfCommand,
  BlindTransferCommand,
  AttendedTransferCommand,
  TelephonyCallEndedNotification,
  TelephonyCallAnsweredNotification,
  TelephonyRemoteHoldNotification,
  TelephonyRemoteResumeNotification,
  TelephonyIncomingCallNotification,
  TelephonyTransportConnectingNotification,
  TelephonyTransportConnectedNotification,
  TelephonyTransportDisconnectedNotification,
  TelephonyRegistrationFailedNotification,
  TelephonyGateway,
} from "./telephony/TelephonyGateway.js";
export type {
  IncomingCallSettings,
  SettingsRepository,
} from "./settings/SettingsRepository.js";
export type { SavedAccountProfileRepository } from "./settings/SavedAccountProfileRepository.js";
export type { CallHistoryRepository } from "./settings/CallHistoryRepository.js";
export type { ContactRepository } from "./settings/ContactRepository.js";
export type { FileSystemPort } from "./filesystem/FileSystemPort.js";
export type {
  SecretStoragePort,
  SecretStorageScopeKey,
} from "./secrets/SecretStoragePort.js";
export {
  SIP_PASSWORD_SECRET_ID,
  createSecretStorageScopeKey,
} from "./secrets/SecretStoragePort.js";
export type {
  EmitSoftPhoneBreakReasonCommand,
  HostIntegrationGateway,
} from "./integration/HostIntegrationGateway.js";
export type { Logger, LogContext, LogEntry, LogLevel } from "./logging/index.js";
export type {
  ApplyShellWindowLayoutCommand,
  ShellWindowGateway,
} from "./platform/ShellWindowGateway.js";
export type { UpdateMetadataGateway } from "./updates/UpdateMetadataGateway.js";
export type {
  InstalledPlatformInfo,
  PlatformInfoGateway,
} from "./updates/PlatformInfoGateway.js";
export type { ExternalUrlGateway } from "./updates/ExternalUrlGateway.js";
export type { UpdateBannerDismissStore } from "./updates/UpdateBannerDismissStore.js";
export type { CodecPreferencesPort } from "./media/CodecPreferencesPort.js";
