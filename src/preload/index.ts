import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseAppShutdownPayload } from "@shared/ipc/AppShutdownContract.js";
import { parseShellWindowLayoutPayload } from "@shared/ipc/ShellWindowLayoutContract.js";
import type { SoftphonePreloadApi } from "@shared/ipc/PreloadApi.js";

const softphoneApi: SoftphonePreloadApi = {
  getPlatformVersion: () => ipcRenderer.invoke(IPC_CHANNELS.platformGetVersion),
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
