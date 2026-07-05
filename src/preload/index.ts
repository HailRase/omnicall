import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseAppShutdownPayload } from "@shared/ipc/AppShutdownContract.js";
import { parseOpenExternalUrlPayload } from "@shared/ipc/OpenExternalUrlContract.js";
import { parseSetNativeThemePayload } from "@shared/ipc/SetNativeThemeContract.js";
import { parseShellWindowLayoutPayload } from "@shared/ipc/ShellWindowLayoutContract.js";
import { parseProfilesStorageRootResponse } from "@shared/ipc/ProfilesStorageContract.js";
import type { SoftphonePreloadApi } from "@shared/ipc/PreloadApi.js";
import type { OpenExternalUrlResponse } from "@shared/ipc/OpenExternalUrlContract.js";
import {
  parseProfilesFilesystemOperation,
  parseProfilesFilesystemResponse,
} from "@shared/ipc/ProfilesFilesystemContract.js";

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
  acknowledgeShutdown: async (correlationId) => {
    await ipcRenderer.invoke(IPC_CHANNELS.appAcknowledgeShutdown, { correlationId });
  },
  applyShellWindowLayout: async (payload) => {
    const parsed = parseShellWindowLayoutPayload(payload);
    if (parsed === null) {
      return;
    }

    await ipcRenderer.invoke(IPC_CHANNELS.shellApplyWindowLayout, parsed);
  },
};

contextBridge.exposeInMainWorld("softphone", softphoneApi);
