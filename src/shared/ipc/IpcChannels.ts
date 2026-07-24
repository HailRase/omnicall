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
  /** Renderer → main: raise softphone above other apps (ADR-0013). */
  shellWindowRaise: "shell:window-raise",
  /** Main → renderer: operator must decide SDK pairing / Origin trust. */
  shellOperatorAttention: "shell:operator-attention",
  profilesGetStorageRoot: "profiles:get-storage-root",
  profilesInvokeFilesystem: "profiles:invoke-filesystem",
  secretsInvoke: "secrets:invoke",
  contactsCsvOpenImportDialog: "contacts-csv:open-import-dialog",
  contactsCsvSaveExportDialog: "contacts-csv:save-export-dialog",
  preferencesOpenImportDialog: "preferences:open-import-dialog",
  preferencesSaveExportDialog: "preferences:save-export-dialog",
  headsetSetPreferredDeviceId: "headset:set-preferred-device-id",
  mediaListDisplaySources: "media:list-display-sources",
  mediaSetPendingDisplaySource: "media:set-pending-display-source",
  /** Main → renderer: push validated SDK broker product request (ADR-0009 / DI-02). */
  sdkBrokerRequest: "sdk-broker:request",
  /** Renderer → main: reply for a pending SDK broker request. */
  sdkBrokerReply: "sdk-broker:reply",
  /** Renderer → main: composition readiness for product broker traffic. */
  sdkBrokerSetReady: "sdk-broker:set-ready",
  /** Main → renderer: authenticated SDK client socket ended (DI-07 pending-logout clear). */
  sdkBrokerClientSessionEnded: "sdk-broker:client-session-ended",
  /** Renderer → main: publish redacted public SDK event for per-client fan-out (DI-05). */
  sdkGatewayPublishEvent: "sdk-gateway:publish-event",
  /** Renderer → main: Settings operational controls for local SDK gateway (DI-09). */
  sdkGatewaySettingsInvoke: "sdk-gateway:settings-invoke",
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
export type {
  PreferencesOpenImportDialogResponse,
  PreferencesSaveExportDialogPayload,
  PreferencesSaveExportDialogResponse,
} from "./PreferencesFileContract.js";
export type { SetNativeThemePayload, SetNativeThemeResponse } from "./SetNativeThemeContract.js";
