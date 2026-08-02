/**
 * - Purpose: ask a guest External Application window whether close is allowed.
 * - Inputs: target webContents, timeout, optional request id factory.
 * - Outputs: boolean allow (fail-closed on timeout / destroyed sender mismatch).
 */

import { randomUUID } from "node:crypto";
import { ipcMain, type WebContents } from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseExternalApplicationCloseGuardResultPayload } from "@shared/ipc/ExternalApplicationCloseGuardContract.js";

export const EXTERNAL_APPLICATION_CLOSE_GUARD_TIMEOUT_MS = 10_000;

export type QueryExternalApplicationCloseGuardOptions = Readonly<{
  webContents: WebContents;
  timeoutMs?: number;
  createRequestId?: () => string;
}>;

export function queryExternalApplicationCloseGuard(
  options: QueryExternalApplicationCloseGuardOptions,
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? EXTERNAL_APPLICATION_CLOSE_GUARD_TIMEOUT_MS;
  const createRequestId = options.createRequestId ?? randomUUID;
  const { webContents } = options;

  if (webContents.isDestroyed()) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    const requestId = createRequestId();
    let settled = false;

    const finish = (allow: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      ipcMain.removeListener(
        IPC_CHANNELS.externalApplicationsCloseGuardResult,
        onResult,
      );
      resolve(allow);
    };

    const onResult = (event: Electron.IpcMainEvent, value: unknown): void => {
      if (event.sender !== webContents) {
        return;
      }
      const parsed = parseExternalApplicationCloseGuardResultPayload(value);
      if (parsed === null || parsed.requestId !== requestId) {
        return;
      }
      finish(parsed.allow);
    };

    const timer = setTimeout(() => {
      finish(false);
    }, timeoutMs);

    ipcMain.on(IPC_CHANNELS.externalApplicationsCloseGuardResult, onResult);

    try {
      webContents.send(IPC_CHANNELS.externalApplicationsCloseGuardQuery, {
        requestId,
      });
    } catch {
      finish(false);
    }
  });
}
