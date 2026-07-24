export type { DomainEventHandler, DomainEventPublisher } from "./events/DomainEventPublisher.js";
export type {
  SipSessionHealthReadModel,
  SipSessionHealthReadModelSnapshot,
} from "./telephony/SipSessionHealthReadModel.js";
export type {
  BindCallVideoSurfacesCommand,
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
  CaptureLocalMediaCommand,
  CaptureLocalMediaResult,
  LocalMediaCapturePort,
  LocalMediaProbeResult,
  LocalMediaStreamHandle,
  MediaInputDeviceInfo,
  ProbeLocalMediaCommand,
  ReleaseLocalMediaCommand,
  ReplaceOutboundVideoTrackCommand,
  SetLocalVideoMutedCommand,
  EnsureOutboundVideoSenderSyncedCommand,
  StartCameraPreviewCommand,
  StartCameraPreviewResult,
  StopCameraPreviewCommand,
} from "./media/LocalMediaCapturePort.js";
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
  TelephonyRemoteVideoPresenceNotification,
  TelephonyIncomingRemoteVideoOfferedNotification,
  TelephonyCameraAvailabilityNotification,
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
export type {
  SavedAccountProfileRepository,
  SaveSavedAccountProfileOptions,
} from "./settings/SavedAccountProfileRepository.js";
export type { CallHistoryRepository } from "./settings/CallHistoryRepository.js";
export type { UserNotificationJournalRepository } from "./settings/UserNotificationJournalRepository.js";
export type { ContactRepository } from "./settings/ContactRepository.js";
export type {
  ContactCsvExportDialogInput,
  ContactCsvExportDialogResult,
  ContactCsvFileGateway,
  ContactCsvImportDialogResult,
} from "./settings/ContactCsvFileGateway.js";
export type {
  PreferencesExportDialogInput,
  PreferencesExportDialogResult,
  PreferencesFileGateway,
  PreferencesImportDialogResult,
} from "./settings/PreferencesFileGateway.js";
export type { FileSystemPort } from "./filesystem/FileSystemPort.js";
export type {
  SecretStoragePort,
  SecretStorageScopeKey,
} from "./secrets/SecretStoragePort.js";
export {
  OCP_PROXY_API_KEY_SECRET_ID,
  SDK_PAIRED_CLIENTS_INDEX_SECRET_ID,
  SDK_PAIRED_CLIENT_SECRET_ID_PREFIX,
  SDK_PAIRING_SCOPE_KEY,
  SIP_PASSWORD_SECRET_ID,
  createSecretStorageScopeKey,
} from "./secrets/SecretStoragePort.js";
export type {
  EmitSoftPhoneBreakReasonCommand,
  HostIntegrationGateway,
} from "./integration/HostIntegrationGateway.js";
export type {
  ExternalClientGateway,
  ExternalClientGatewayStatus,
  ExternalGatewayValidationFailure,
  ExternalGatewayValidationResult,
  ExternalGatewayValidationSuccess,
} from "./integration/ExternalClientGateway.js";
export type {
  BrokerProductRequest,
  BrokerRequestFailure,
  BrokerRequestResult,
  BrokerRequestSuccess,
  MainToRendererBrokerPort,
} from "./integration/MainToRendererBrokerPort.js";
export type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerFailure,
  ExternalHandlerResult,
  ExternalHandlerSuccess,
  ExternalQueryHandler,
} from "./integration/ExternalCommandHandler.js";
export type { OcpGateway, Unsubscribe } from "./integration/OcpGateway.js";
export type { OcpOperatorReadModel } from "./integration/OcpOperatorReadModel.js";
export type { OcpReasonsCachePort } from "./integration/OcpReasonsCachePort.js";
export { buildOcpBreakReasonsCacheKey } from "./integration/OcpReasonsCachePort.js";
export type { OcpNotificationPresenter } from "./integration/OcpNotificationPresenter.js";
export type {
  OcpProxyAuthenticateInput,
  OcpProxyAuthenticateOutcome,
  OcpProxyAuthenticatePort,
} from "./integration/OcpProxyAuthenticatePort.js";
export type { DndReadModel } from "./settings/DndReadModel.js";
export type { Logger, LogContext, LogEntry, LogLevel } from "./logging/index.js";
export type {
  ApplyShellWindowLayoutCommand,
  ShellWindowGateway,
} from "./platform/ShellWindowGateway.js";
export type { UpdateMetadataGateway } from "./updates/UpdateMetadataGateway.js";
export type { HeadsetGateway } from "./headset/HeadsetGateway.js";
export type {
  InstalledPlatformInfo,
  PlatformInfoGateway,
} from "./updates/PlatformInfoGateway.js";
export type { ExternalUrlGateway } from "./updates/ExternalUrlGateway.js";
export type { UpdateBannerDismissStore } from "./updates/UpdateBannerDismissStore.js";
export type { CodecPreferencesPort } from "./media/CodecPreferencesPort.js";
