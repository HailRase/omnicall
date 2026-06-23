import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseAppShutdownPayload } from "@shared/ipc/AppShutdownContract.js";
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
};

contextBridge.exposeInMainWorld("softphone", softphoneApi);
