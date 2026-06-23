import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import type { SoftphonePreloadApi } from "@shared/ipc/PreloadApi.js";

const softphoneApi: SoftphonePreloadApi = {
  getPlatformVersion: () => ipcRenderer.invoke(IPC_CHANNELS.platformGetVersion),
};

contextBridge.exposeInMainWorld("softphone", softphoneApi);
