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
  shellWindowToggleMaximize: "shell:window-toggle-maximize",
  shellWindowGetMaximized: "shell:window-get-maximized",
  /** Main → renderer: BrowserWindow maximize/restore changed (settings-only). */
  shellWindowMaximizedChanged: "shell:window-maximized-changed",
  /** Renderer → main: set shell always-on-top pin (F-016). */
  shellWindowSetAlwaysOnTop: "shell:window-set-always-on-top",
  /** Renderer → main: toggle shell always-on-top pin (F-016). */
  shellWindowToggleAlwaysOnTop: "shell:window-toggle-always-on-top",
  /** Renderer → main: read shell always-on-top pin (F-016). */
  shellWindowGetAlwaysOnTop: "shell:window-get-always-on-top",
  /** Main → renderer: always-on-top pin changed (F-016). */
  shellWindowAlwaysOnTopChanged: "shell:window-always-on-top-changed",
  shellApplyWindowLayout: "shell:apply-window-layout",
  /** Renderer → main: raise softphone above other apps (ADR-0013). */
  shellWindowRaise: "shell:window-raise",
  /** Renderer → main: telephony busy mirror for SDK window:hide deny (ADR-0013). */
  shellTelephonyBusy: "shell:telephony-busy",
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
  /** Renderer → main: External Services outbound HTTP (F-031 / ADR-0022). */
  externalServicesHttpExecute: "external-services:http-execute",
  /** Renderer → main: External Services single-collection import dialog (F-031). */
  externalServicesCollectionOpenImportDialog:
    "external-services:collection-open-import-dialog",
  /** Renderer → main: External Services single-collection export dialog (F-031). */
  externalServicesCollectionSaveExportDialog:
    "external-services:collection-save-export-dialog",
  /** Renderer → main: F-032 External Application screen-pop window. */
  externalApplicationsOpenWindow: "external-applications:open-window",
  /** Renderer → main: F-032 apply call-ended window lifecycle for one callId. */
  externalApplicationsApplyCallEnded: "external-applications:apply-call-ended",
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
export type {
  ExternalServicesHttpRequestDto,
  ExternalServicesHttpResponseDto,
} from "./ExternalServicesHttpContract.js";
export type {
  ExternalServicesCollectionOpenImportDialogResponse,
  ExternalServicesCollectionSaveExportDialogPayload,
  ExternalServicesCollectionSaveExportDialogResponse,
} from "./ExternalServicesCollectionFileContract.js";
export type {
  ApplyExternalApplicationCallEndedPayload,
  ApplyExternalApplicationCallEndedResponse,
  OpenExternalApplicationWindowPayload,
  OpenExternalApplicationWindowResponse,
} from "./OpenExternalApplicationWindowContract.js";
