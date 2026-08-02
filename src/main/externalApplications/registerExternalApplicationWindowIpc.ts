/**
 * - Purpose: register secure main-process screen-pop window IPC.
 * - Inputs: validated HTTPS window requests and call-ended lifecycle commands.
 * - Outputs: focused/new BrowserWindow or lifecycle side effects.
 */

import { join } from "node:path";
import { BrowserWindow, ipcMain, shell } from "electron";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseApplyExternalApplicationCallEndedPayload,
  parseOpenExternalApplicationWindowPayload,
  type OpenExternalApplicationWindowPayload,
  type OpenExternalApplicationWindowResponse,
  type ApplyExternalApplicationCallEndedResponse,
} from "@shared/ipc/OpenExternalApplicationWindowContract.js";
import {
  attachExternalApplicationCloseInterceptor,
  type ExternalApplicationCloseInterceptor,
} from "./attachExternalApplicationCloseInterceptor.js";
import { queryExternalApplicationCloseGuard } from "./queryExternalApplicationCloseGuard.js";

type TrackedWindow = Readonly<{
  browserWindow: BrowserWindow;
  onCallEnded: OpenExternalApplicationWindowPayload["onCallEnded"];
  callId: string;
  closeInterceptor: ExternalApplicationCloseInterceptor;
}>;

export type ExternalApplicationWindowIpcRegistration = Readonly<{ dispose: () => void }>;

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-032",
});

export function registerExternalApplicationWindowIpc(): ExternalApplicationWindowIpcRegistration {
  const windows = new Map<string, TrackedWindow>();

  ipcMain.removeHandler(IPC_CHANNELS.externalApplicationsOpenWindow);
  ipcMain.removeHandler(IPC_CHANNELS.externalApplicationsApplyCallEnded);

  ipcMain.handle(
    IPC_CHANNELS.externalApplicationsOpenWindow,
    async (_event, value: unknown): Promise<OpenExternalApplicationWindowResponse> => {
      const payload = parseOpenExternalApplicationWindowPayload(value);
      if (payload === null) {
        return { ok: false, reason: "invalid_payload" };
      }
      const key = `${payload.applicationId}:${payload.callId}`;
      const existing = windows.get(key);
      if (existing !== undefined && !existing.browserWindow.isDestroyed()) {
        applyRaise(existing.browserWindow, payload.raiseOnOpen);
        existing.browserWindow.setAlwaysOnTop(payload.alwaysOnTopDuringCall);
        windows.set(key, {
          browserWindow: existing.browserWindow,
          onCallEnded: payload.onCallEnded,
          callId: payload.callId,
          closeInterceptor: existing.closeInterceptor,
        });
        return { ok: true, focusedExisting: true };
      }
      try {
        const browserWindow = new BrowserWindow({
          width: payload.width,
          height: payload.height,
          title: payload.title,
          show: false,
          webPreferences: {
            preload: resolveExternalApplicationGuestPreloadPath(),
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
        browserWindow.setAlwaysOnTop(payload.alwaysOnTopDuringCall);
        const closeInterceptor = attachExternalApplicationCloseInterceptor({
          browserWindow,
          queryGuard: (window) =>
            queryExternalApplicationCloseGuard({ webContents: window.webContents }),
          onDenied: () => {
            applyRaise(browserWindow, true);
            logger.info("external_application_close_guard_denied", {
              operation: "close_guard",
              featureId: "F-032",
              applicationId: payload.applicationId,
              callId: payload.callId,
              result: "denied",
            });
          },
        });
        windows.set(key, {
          browserWindow,
          onCallEnded: payload.onCallEnded,
          callId: payload.callId,
          closeInterceptor,
        });
        browserWindow.once("closed", () => {
          closeInterceptor.dispose();
          windows.delete(key);
        });
        await browserWindow.loadURL(payload.url);
        browserWindow.show();
        applyRaise(browserWindow, payload.raiseOnOpen);
        return { ok: true, focusedExisting: false };
      } catch {
        const tracked = windows.get(key);
        tracked?.closeInterceptor.dispose();
        windows.delete(key);
        return { ok: false, reason: "open_failed" };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.externalApplicationsApplyCallEnded,
    (_event, value: unknown): ApplyExternalApplicationCallEndedResponse => {
      const payload = parseApplyExternalApplicationCallEndedPayload(value);
      if (payload === null) {
        return { ok: true, affected: 0 };
      }
      let affected = 0;
      for (const [key, tracked] of [...windows.entries()]) {
        if (tracked.callId !== payload.callId || tracked.browserWindow.isDestroyed()) {
          continue;
        }
        tracked.browserWindow.setAlwaysOnTop(false);
        if (tracked.onCallEnded === "leave") {
          continue;
        }
        if (tracked.onCallEnded === "minimize") {
          tracked.browserWindow.minimize();
          affected += 1;
          continue;
        }
        tracked.closeInterceptor.markForceClose();
        tracked.browserWindow.close();
        windows.delete(key);
        affected += 1;
      }
      return { ok: true, affected };
    },
  );

  return {
    dispose: () => {
      ipcMain.removeHandler(IPC_CHANNELS.externalApplicationsOpenWindow);
      ipcMain.removeHandler(IPC_CHANNELS.externalApplicationsApplyCallEnded);
      for (const tracked of windows.values()) {
        tracked.closeInterceptor.markForceClose();
        tracked.closeInterceptor.dispose();
        if (!tracked.browserWindow.isDestroyed()) {
          tracked.browserWindow.destroy();
        }
      }
      windows.clear();
    },
  };
}

function applyRaise(browserWindow: BrowserWindow, raiseOnOpen: boolean): void {
  if (browserWindow.isMinimized()) {
    browserWindow.restore();
  }
  if (raiseOnOpen) {
    browserWindow.focus();
  }
}

function resolveExternalApplicationGuestPreloadPath(): string {
  return join(__dirname, "../preload/externalApplicationGuest.js");
}
