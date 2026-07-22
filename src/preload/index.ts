import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseAppShutdownCancelPayload,
  parseAppShutdownPayload,
} from "@shared/ipc/AppShutdownContract.js";
import { parseOpenExternalUrlPayload } from "@shared/ipc/OpenExternalUrlContract.js";
import { parseSetNativeThemePayload } from "@shared/ipc/SetNativeThemeContract.js";
import { parseShellWindowLayoutPayload } from "@shared/ipc/ShellWindowLayoutContract.js";
import {
  parseShellOperatorAttentionPayload,
  parseShellWindowRaisePayload,
  parseShellWindowRaiseResponse,
} from "@shared/ipc/ShellWindowRaiseContract.js";
import { parseProfilesStorageRootResponse } from "@shared/ipc/ProfilesStorageContract.js";
import type { SoftphonePreloadApi } from "@shared/ipc/PreloadApi.js";
import type { OpenExternalUrlResponse } from "@shared/ipc/OpenExternalUrlContract.js";
import {
  parseProfilesFilesystemOperation,
  parseProfilesFilesystemResponse,
} from "@shared/ipc/ProfilesFilesystemContract.js";
import {
  parseContactsCsvOpenImportDialogResponse,
  parseContactsCsvSaveExportDialogPayload,
  parseContactsCsvSaveExportDialogResponse,
} from "@shared/ipc/ContactsCsvFileContract.js";
import {
  parseSecretStorageOperation,
  parseSecretStorageResponse,
} from "@shared/ipc/SecretStorageContract.js";
import {
  parseListDisplaySourcesResponse,
  parseSetPendingDisplaySourcePayload,
  parseSetPendingDisplaySourceResponse,
} from "@shared/ipc/DisplayCaptureContract.js";
import {
  parseSdkBrokerAckResponse,
  parseSdkBrokerClientSessionEndedIpcPayload,
  parseSdkBrokerReadyIpcPayload,
  parseSdkBrokerReplyIpcPayload,
  parseSdkBrokerRequestIpcPayload,
} from "@shared/ipc/SdkBrokerContract.js";
import {
  parseSdkGatewayPublishEventIpcPayload,
  parseSdkGatewayPublishEventIpcResponse,
} from "@shared/ipc/SdkGatewayEventContract.js";
import {
  parseSdkGatewaySettingsOperation,
  parseSdkGatewaySettingsResponse,
} from "@shared/ipc/SdkGatewaySettingsContract.js";

const softphoneApi: SoftphonePreloadApi = {
  getPlatformVersion: () => ipcRenderer.invoke(IPC_CHANNELS.platformGetVersion),
  getProfilesStorageRoot: async () => {
    const response: unknown = await ipcRenderer.invoke(IPC_CHANNELS.profilesGetStorageRoot);
    const parsed = parseProfilesStorageRootResponse(response);
    if (parsed === null) {
      throw new Error("invalid_profiles_storage_root_response");
    }
    return parsed;
  },
  invokeProfilesFilesystem: async (operation) => {
    const parsed = parseProfilesFilesystemOperation(operation);
    if (parsed === null) {
      throw new Error("invalid_profiles_filesystem_operation");
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.profilesInvokeFilesystem,
      parsed,
    );
    const parsedResponse = parseProfilesFilesystemResponse(response);
    if (parsedResponse === null) {
      throw new Error("invalid_profiles_filesystem_response");
    }
    return parsedResponse;
  },
  invokeSecretStorage: async (operation) => {
    const parsed = parseSecretStorageOperation(operation);
    if (parsed === null) {
      throw new Error("invalid_secret_storage_operation");
    }
    const response: unknown = await ipcRenderer.invoke(IPC_CHANNELS.secretsInvoke, parsed);
    const parsedResponse = parseSecretStorageResponse(response);
    if (parsedResponse === null) {
      throw new Error("invalid_secret_storage_response");
    }
    return parsedResponse;
  },
  openExternalUrl: async (payload): Promise<OpenExternalUrlResponse> => {
    const parsed = parseOpenExternalUrlPayload(payload);
    if (parsed === null) {
      return { ok: false, reason: "invalid_url" };
    }

    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.platformOpenExternalUrl,
      parsed,
    );
    if (
      typeof response !== "object" ||
      response === null ||
      typeof (response as Record<string, unknown>)["ok"] !== "boolean"
    ) {
      return { ok: false, reason: "invalid_response" };
    }

    const candidate = response as OpenExternalUrlResponse;
    return candidate.ok
      ? { ok: true }
      : { ok: false, reason: candidate.reason ?? "open_failed" };
  },
  setNativeTheme: async (payload) => {
    const parsed = parseSetNativeThemePayload(payload);
    if (parsed === null) {
      return { ok: false };
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.platformSetNativeTheme,
      parsed,
    );
    if (
      typeof response !== "object" ||
      response === null ||
      typeof (response as Record<string, unknown>)["ok"] !== "boolean"
    ) {
      return { ok: false };
    }
    return { ok: (response as Record<string, unknown>)["ok"] === true };
  },
  onBeforeClose: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown): void => {
      const parsed = parseAppShutdownPayload(payload);
      if (parsed !== null) {
        handler(parsed);
      }
    };
    ipcRenderer.on(IPC_CHANNELS.appBeforeClose, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.appBeforeClose, listener);
    };
  },
  acknowledgeShutdown: async (payload) => {
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.appAcknowledgeShutdown,
      payload,
    );
    if (
      typeof response !== "object" ||
      response === null ||
      typeof (response as Record<string, unknown>)["ok"] !== "boolean"
    ) {
      return { ok: false, reason: "invalid_response" };
    }
    const candidate = response as { ok: boolean; reason?: string };
    return candidate.ok
      ? { ok: true }
      : { ok: false, reason: candidate.reason ?? "ack_failed" };
  },
  cancelShutdown: async (payload) => {
    const parsed = parseAppShutdownCancelPayload(payload);
    if (parsed === null) {
      return { ok: false, reason: "invalid_payload" };
    }
    const response: unknown = await ipcRenderer.invoke(IPC_CHANNELS.appCancelShutdown, parsed);
    if (
      typeof response !== "object" ||
      response === null ||
      typeof (response as Record<string, unknown>)["ok"] !== "boolean"
    ) {
      return { ok: false, reason: "invalid_response" };
    }
    const candidate = response as { ok: boolean; reason?: string };
    return candidate.ok
      ? { ok: true }
      : { ok: false, reason: candidate.reason ?? "cancel_failed" };
  },
  requestAppRestart: () => ipcRenderer.invoke(IPC_CHANNELS.appRequestRestart),
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.shellWindowMinimize),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.shellWindowClose),
  applyShellWindowLayout: async (payload) => {
    const parsed = parseShellWindowLayoutPayload(payload);
    if (parsed === null) {
      return;
    }

    await ipcRenderer.invoke(IPC_CHANNELS.shellApplyWindowLayout, parsed);
  },
  raiseShellWindow: async (payload) => {
    const parsed = parseShellWindowRaisePayload(payload);
    if (parsed === null) {
      return { ok: false, reason: "invalid_payload" };
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.shellWindowRaise,
      parsed,
    );
    const parsedResponse = parseShellWindowRaiseResponse(response);
    if (parsedResponse === null) {
      return { ok: false, reason: "invalid_payload" };
    }
    return parsedResponse;
  },
  onShellOperatorAttention: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown): void => {
      const parsed = parseShellOperatorAttentionPayload(payload);
      if (parsed === null) {
        return;
      }
      handler(parsed);
    };
    ipcRenderer.on(IPC_CHANNELS.shellOperatorAttention, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.shellOperatorAttention, listener);
    };
  },
  openContactsCsvImportDialog: async () => {
    const response: unknown = await ipcRenderer.invoke(IPC_CHANNELS.contactsCsvOpenImportDialog);
    const parsed = parseContactsCsvOpenImportDialogResponse(response);
    if (parsed === null) {
      return { ok: false, reason: "invalid_response" };
    }
    return parsed;
  },
  saveContactsCsvExportDialog: async (payload) => {
    const parsedPayload = parseContactsCsvSaveExportDialogPayload(payload);
    if (parsedPayload === null) {
      return { ok: false, reason: "invalid_payload" };
    }

    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.contactsCsvSaveExportDialog,
      parsedPayload,
    );
    const parsed = parseContactsCsvSaveExportDialogResponse(response);
    if (parsed === null) {
      return { ok: false, reason: "invalid_response" };
    }
    return parsed;
  },
  setHeadsetPreferredDeviceId: async (deviceId) => {
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.headsetSetPreferredDeviceId,
      { deviceId },
    );
    if (
      typeof response !== "object" ||
      response === null ||
      typeof (response as Record<string, unknown>)["ok"] !== "boolean"
    ) {
      return { ok: false };
    }
    return { ok: (response as Record<string, unknown>)["ok"] === true };
  },
  listDisplaySources: async () => {
    const response: unknown = await ipcRenderer.invoke(IPC_CHANNELS.mediaListDisplaySources);
    const parsed = parseListDisplaySourcesResponse(response);
    if (parsed === null) {
      return { ok: false, reason: "invalid_response" };
    }
    return parsed;
  },
  setPendingDisplaySource: async (payload) => {
    const parsedPayload = parseSetPendingDisplaySourcePayload(payload);
    if (parsedPayload === null) {
      return { ok: false, reason: "invalid_payload" };
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.mediaSetPendingDisplaySource,
      parsedPayload,
    );
    const parsed = parseSetPendingDisplaySourceResponse(response);
    if (parsed === null) {
      return { ok: false, reason: "invalid_response" };
    }
    return parsed;
  },
  onSdkBrokerRequest: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown): void => {
      const parsed = parseSdkBrokerRequestIpcPayload(payload);
      if (parsed !== null) {
        handler(parsed);
      }
    };
    ipcRenderer.on(IPC_CHANNELS.sdkBrokerRequest, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.sdkBrokerRequest, listener);
    };
  },
  replySdkBrokerRequest: async (payload) => {
    const parsed = parseSdkBrokerReplyIpcPayload(payload);
    if (parsed === null) {
      return { ok: false };
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.sdkBrokerReply,
      parsed,
    );
    return parseSdkBrokerAckResponse(response) ?? { ok: false };
  },
  setSdkBrokerReady: async (payload) => {
    const parsed = parseSdkBrokerReadyIpcPayload(payload);
    if (parsed === null) {
      return { ok: false };
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.sdkBrokerSetReady,
      parsed,
    );
    return parseSdkBrokerAckResponse(response) ?? { ok: false };
  },
  onSdkClientSessionEnded: (handler) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: unknown,
    ): void => {
      const parsed = parseSdkBrokerClientSessionEndedIpcPayload(payload);
      if (parsed !== null) {
        handler(parsed);
      }
    };
    ipcRenderer.on(IPC_CHANNELS.sdkBrokerClientSessionEnded, listener);
    return () => {
      ipcRenderer.removeListener(
        IPC_CHANNELS.sdkBrokerClientSessionEnded,
        listener,
      );
    };
  },
  publishSdkGatewayEvent: async (payload) => {
    const parsed = parseSdkGatewayPublishEventIpcPayload(payload);
    if (parsed === null) {
      return { ok: false, delivered: 0 };
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.sdkGatewayPublishEvent,
      parsed,
    );
    return (
      parseSdkGatewayPublishEventIpcResponse(response) ?? {
        ok: false,
        delivered: 0,
      }
    );
  },
  invokeSdkGatewaySettings: async (operation) => {
    const parsed = parseSdkGatewaySettingsOperation(operation);
    if (parsed === null) {
      return { ok: false, reason: "invalid_operation" };
    }
    const response: unknown = await ipcRenderer.invoke(
      IPC_CHANNELS.sdkGatewaySettingsInvoke,
      parsed,
    );
    return (
      parseSdkGatewaySettingsResponse(response) ?? {
        ok: false,
        reason: "invalid_response",
      }
    );
  },
};

contextBridge.exposeInMainWorld("softphone", softphoneApi);
