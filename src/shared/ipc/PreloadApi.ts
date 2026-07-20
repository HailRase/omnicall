import type { PlatformVersionResponse } from "./IpcChannels.js";
import type {
  AppShutdownPayload,
  AppShutdownAckPayload,
  AppShutdownCancelPayload,
} from "./AppShutdownContract.js";
import type { ShellWindowLayoutPayload } from "./ShellWindowLayoutContract.js";
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
  SecretStorageOperation,
  SecretStorageResponse,
} from "./SecretStorageContract.js";
import type {
  ListDisplaySourcesResponse,
  SetPendingDisplaySourcePayload,
  SetPendingDisplaySourceResponse,
} from "./DisplayCaptureContract.js";
import type {
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
  openContactsCsvImportDialog: () => Promise<ContactsCsvOpenImportDialogResponse>;
  saveContactsCsvExportDialog: (
    payload: ContactsCsvSaveExportDialogPayload,
  ) => Promise<ContactsCsvSaveExportDialogResponse>;
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
  /** DI-05: publish redacted public SDK event for per-client gateway fan-out. */
  publishSdkGatewayEvent: (
    payload: SdkGatewayPublishEventIpcPayload,
  ) => Promise<SdkGatewayPublishEventIpcResponse>;
}>;

declare global {
  interface Window {
    softphone: SoftphonePreloadApi;
  }
}

export {};
