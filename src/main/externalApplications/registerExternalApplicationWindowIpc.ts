/**
 * - Purpose: register secure main-process screen-pop window IPC.
 * - Inputs: validated HTTPS window requests from preload.
 * - Outputs: a focused existing or newly loaded BrowserWindow.
 */
import { BrowserWindow, ipcMain, shell } from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseOpenExternalApplicationWindowPayload,
  type OpenExternalApplicationWindowResponse,
} from "@shared/ipc/OpenExternalApplicationWindowContract.js";

export type ExternalApplicationWindowIpcRegistration = Readonly<{ dispose: () => void }>;

export function registerExternalApplicationWindowIpc(): ExternalApplicationWindowIpcRegistration {
  const windows = new Map<string, BrowserWindow>();
  ipcMain.removeHandler(IPC_CHANNELS.externalApplicationsOpenWindow);
  ipcMain.handle(
    IPC_CHANNELS.externalApplicationsOpenWindow,
    async (_event, value: unknown): Promise<OpenExternalApplicationWindowResponse> => {
      const payload = parseOpenExternalApplicationWindowPayload(value);
      if (payload === null) {
        return { ok: false, reason: "invalid_payload" };
      }
      const key = `${payload.applicationId}:${payload.callId}`;
      const existing = windows.get(key);
      if (existing !== undefined && !existing.isDestroyed()) {
        if (existing.isMinimized()) {
          existing.restore();
        }
        existing.focus();
        return { ok: true, focusedExisting: true };
      }
      try {
        const browserWindow = new BrowserWindow({
          width: payload.width,
          height: payload.height,
          title: payload.title,
          webPreferences: {
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            webSecurity: true,
            partition: "persist:external-applications",
          },
        });
        browserWindow.webContents.setWindowOpenHandler((details) => {
          void shell.openExternal(details.url);
          return { action: "deny" };
        });
        windows.set(key, browserWindow);
        browserWindow.once("closed", () => windows.delete(key));
        await browserWindow.loadURL(payload.url);
        return { ok: true, focusedExisting: false };
      } catch {
        windows.delete(key);
        return { ok: false, reason: "open_failed" };
      }
    },
  );
  return {
    dispose: () => {
      ipcMain.removeHandler(IPC_CHANNELS.externalApplicationsOpenWindow);
      windows.clear();
    },
  };
}
