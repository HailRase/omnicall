import type { PlatformVersionResponse } from "./IpcChannels.js";
import type {
  AppShutdownPayload,
  AppShutdownAckPayload,
  AppShutdownCancelPayload,
} from "./AppShutdownContract.js";
import type { ShellWindowLayoutPayload } from "./ShellWindowLayoutContract.js";
import type {
  ShellOperatorAttentionPayload,
  ShellWindowRaisePayload,
  ShellWindowRaiseResponse,
} from "./ShellWindowRaiseContract.js";
import type { ShellTelephonyBusyPayload } from "./ShellTelephonyBusyContract.js";
import type { OpenExternalUrlPayload, OpenExternalUrlResponse } from "./OpenExternalUrlContract.js";
import type { SetNativeThemePayload, SetNativeThemeResponse } from "./SetNativeThemeContract.js";
import type { ShellWindowControlResponse } from "./ShellWindowControlContract.js";
import type {
  ProfilesFilesystemOperation,
  ProfilesFilesystemResponse,
} from "./ProfilesFilesystemContract.js";
import type { ProfilesStorageRootResponse } from "./ProfilesStorageContract.js";
import type {
  ContactsCsvOpenImportDialogResponse,
  ContactsCsvSaveExportDialogPayload,
  ContactsCsvSaveExportDialogResponse,
} from "./ContactsCsvFileContract.js";
import type {
  PreferencesOpenImportDialogResponse,
  PreferencesSaveExportDialogPayload,
  PreferencesSaveExportDialogResponse,
} from "./PreferencesFileContract.js";
import type {
  SecretStorageOperation,
  SecretStorageResponse,
} from "./SecretStorageContract.js";
import type {
  ListDisplaySourcesResponse,
  SetPendingDisplaySourcePayload,
  SetPendingDisplaySourceResponse,
} from "./DisplayCaptureContract.js";
import type {
  SdkBrokerClientSessionEndedIpcPayload,
  SdkBrokerReadyIpcPayload,
  SdkBrokerReadyIpcResponse,
  SdkBrokerReplyIpcPayload,
  SdkBrokerReplyIpcResponse,
  SdkBrokerRequestIpcPayload,
} from "./SdkBrokerContract.js";
import type {
  SdkGatewayPublishEventIpcPayload,
  SdkGatewayPublishEventIpcResponse,
} from "./SdkGatewayEventContract.js";
import type {
  SdkGatewaySettingsOperation,
  SdkGatewaySettingsResponse,
} from "./SdkGatewaySettingsContract.js";
import type {
  ExternalServicesHttpRequestDto,
  ExternalServicesHttpResponseDto,
} from "./ExternalServicesHttpContract.js";
import type {
  ExternalServicesCollectionOpenImportDialogResponse,
  ExternalServicesCollectionSaveExportDialogPayload,
  ExternalServicesCollectionSaveExportDialogResponse,
} from "./ExternalServicesCollectionFileContract.js";

export type SoftphonePreloadApi = Readonly<{
  getPlatformVersion: () => Promise<PlatformVersionResponse>;
  getProfilesStorageRoot: () => Promise<ProfilesStorageRootResponse>;
  invokeProfilesFilesystem: (
    operation: ProfilesFilesystemOperation,
  ) => Promise<ProfilesFilesystemResponse>;
  invokeSecretStorage: (operation: SecretStorageOperation) => Promise<SecretStorageResponse>;
  openExternalUrl: (payload: OpenExternalUrlPayload) => Promise<OpenExternalUrlResponse>;
  setNativeTheme: (payload: SetNativeThemePayload) => Promise<SetNativeThemeResponse>;
  onBeforeClose: (handler: (payload: AppShutdownPayload) => void) => () => void;
  acknowledgeShutdown: (payload: AppShutdownAckPayload) => Promise<ShellWindowControlResponse>;
  cancelShutdown: (payload: AppShutdownCancelPayload) => Promise<ShellWindowControlResponse>;
  requestAppRestart: () => Promise<ShellWindowControlResponse>;
  minimizeWindow: () => Promise<ShellWindowControlResponse>;
  closeWindow: () => Promise<ShellWindowControlResponse>;
  applyShellWindowLayout: (payload: ShellWindowLayoutPayload) => Promise<void>;
  /** ADR-0013: raise softphone above other apps (telephony / consent). */
  raiseShellWindow: (
    payload: ShellWindowRaisePayload,
  ) => Promise<ShellWindowRaiseResponse>;
  /** ADR-0013: mirror telephony busy for SDK window:hide deny. */
  setShellTelephonyBusy: (
    payload: ShellTelephonyBusyPayload,
  ) => Promise<Readonly<{ ok: boolean; reason?: "invalid_payload" }>>;
  /** Main → renderer: SDK pairing / Origin trust needs operator decision. */
  onShellOperatorAttention: (
    handler: (payload: ShellOperatorAttentionPayload) => void,
  ) => () => void;
  openContactsCsvImportDialog: () => Promise<ContactsCsvOpenImportDialogResponse>;
  saveContactsCsvExportDialog: (
    payload: ContactsCsvSaveExportDialogPayload,
  ) => Promise<ContactsCsvSaveExportDialogResponse>;
  openPreferencesImportDialog: () => Promise<PreferencesOpenImportDialogResponse>;
  savePreferencesExportDialog: (
    payload: PreferencesSaveExportDialogPayload,
  ) => Promise<PreferencesSaveExportDialogResponse>;
  setHeadsetPreferredDeviceId: (
    deviceId: string | null,
  ) => Promise<Readonly<{ ok: boolean }>>;
  listDisplaySources: () => Promise<ListDisplaySourcesResponse>;
  setPendingDisplaySource: (
    payload: SetPendingDisplaySourcePayload,
  ) => Promise<SetPendingDisplaySourceResponse>;
  /** DI-02: subscribe to main→renderer SDK broker product requests. */
  onSdkBrokerRequest: (
    handler: (payload: SdkBrokerRequestIpcPayload) => void,
  ) => () => void;
  /** DI-02: reply to a pending SDK broker request. */
  replySdkBrokerRequest: (
    payload: SdkBrokerReplyIpcPayload,
  ) => Promise<SdkBrokerReplyIpcResponse>;
  /** DI-02: signal Application composition readiness for product broker traffic. */
  setSdkBrokerReady: (
    payload: SdkBrokerReadyIpcPayload,
  ) => Promise<SdkBrokerReadyIpcResponse>;
  /**
   * DI-07: subscribe to authenticated SDK client socket end (pending-logout clear only).
   */
  onSdkClientSessionEnded: (
    handler: (payload: SdkBrokerClientSessionEndedIpcPayload) => void,
  ) => () => void;
  /** DI-05: publish redacted public SDK event for per-client gateway fan-out. */
  publishSdkGatewayEvent: (
    payload: SdkGatewayPublishEventIpcPayload,
  ) => Promise<SdkGatewayPublishEventIpcResponse>;
  /** DI-09: Settings operational invoke for local SDK gateway (no secrets). */
  invokeSdkGatewaySettings: (
    operation: SdkGatewaySettingsOperation,
  ) => Promise<SdkGatewaySettingsResponse>;
  /** F-031: execute one outbound External Services HTTP request in main. */
  executeExternalServiceHttp: (
    request: ExternalServicesHttpRequestDto,
  ) => Promise<ExternalServicesHttpResponseDto>;
  /** F-031: open JSON dialog for single-collection import. */
  openExternalServicesCollectionImportDialog: () => Promise<ExternalServicesCollectionOpenImportDialogResponse>;
  /** F-031: save JSON dialog for single-collection export. */
  saveExternalServicesCollectionExportDialog: (
    payload: ExternalServicesCollectionSaveExportDialogPayload,
  ) => Promise<ExternalServicesCollectionSaveExportDialogResponse>;
}>;

declare global {
  interface Window {
    softphone: SoftphonePreloadApi;
  }
}

export {};
