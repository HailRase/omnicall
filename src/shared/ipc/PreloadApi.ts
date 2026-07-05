import type { PlatformVersionResponse } from "./IpcChannels.js";
import type { AppShutdownPayload } from "./AppShutdownContract.js";
import type { ShellWindowLayoutPayload } from "./ShellWindowLayoutContract.js";
import type { OpenExternalUrlPayload, OpenExternalUrlResponse } from "./OpenExternalUrlContract.js";
import type { SetNativeThemePayload, SetNativeThemeResponse } from "./SetNativeThemeContract.js";
import type {
  ProfilesFilesystemOperation,
  ProfilesFilesystemResponse,
} from "./ProfilesFilesystemContract.js";
import type { ProfilesStorageRootResponse } from "./ProfilesStorageContract.js";

export type SoftphonePreloadApi = Readonly<{
  getPlatformVersion: () => Promise<PlatformVersionResponse>;
  getProfilesStorageRoot: () => Promise<ProfilesStorageRootResponse>;
  invokeProfilesFilesystem: (
    operation: ProfilesFilesystemOperation,
  ) => Promise<ProfilesFilesystemResponse>;
  openExternalUrl: (payload: OpenExternalUrlPayload) => Promise<OpenExternalUrlResponse>;
  setNativeTheme: (payload: SetNativeThemePayload) => Promise<SetNativeThemeResponse>;
  onBeforeClose: (handler: (payload: AppShutdownPayload) => void) => () => void;
  acknowledgeShutdown: (correlationId: AppShutdownPayload["correlationId"]) => Promise<void>;
  applyShellWindowLayout: (payload: ShellWindowLayoutPayload) => Promise<void>;
}>;

declare global {
  interface Window {
    softphone: SoftphonePreloadApi;
  }
}

export {};
