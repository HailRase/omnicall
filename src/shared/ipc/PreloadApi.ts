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
}>;

declare global {
  interface Window {
    softphone: SoftphonePreloadApi;
  }
}

export {};
