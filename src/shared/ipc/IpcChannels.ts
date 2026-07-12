export const IPC_CHANNELS = {
  platformGetVersion: "platform:get-version",
  platformOpenExternalUrl: "platform:open-external-url",
  platformSetNativeTheme: "platform:set-native-theme",
  appBeforeClose: "app:before-close",
  appAcknowledgeShutdown: "app:acknowledge-shutdown",
  appCancelShutdown: "app:cancel-shutdown",
  appRequestRestart: "app:request-restart",
  shellWindowMinimize: "shell:window-minimize",
  shellWindowClose: "shell:window-close",
  shellApplyWindowLayout: "shell:apply-window-layout",
  profilesGetStorageRoot: "profiles:get-storage-root",
  profilesInvokeFilesystem: "profiles:invoke-filesystem",
  secretsInvoke: "secrets:invoke",
  contactsCsvOpenImportDialog: "contacts-csv:open-import-dialog",
  contactsCsvSaveExportDialog: "contacts-csv:save-export-dialog",
  headsetSetPreferredDeviceId: "headset:set-preferred-device-id",
  mediaListDisplaySources: "media:list-display-sources",
  mediaSetPendingDisplaySource: "media:set-pending-display-source",
} as const;

export type IpcChannel =
  (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export type PlatformVersionResponse = Readonly<{
  version: string;
  name: string;
  platform: "win32" | "darwin" | "linux";
}>;

export type { AppShutdownPayload, AppShutdownAckPayload } from "./AppShutdownContract.js";
export type { OpenExternalUrlPayload, OpenExternalUrlResponse } from "./OpenExternalUrlContract.js";
export type {
  ContactsCsvOpenImportDialogResponse,
  ContactsCsvSaveExportDialogPayload,
  ContactsCsvSaveExportDialogResponse,
} from "./ContactsCsvFileContract.js";
export type { SetNativeThemePayload, SetNativeThemeResponse } from "./SetNativeThemeContract.js";
