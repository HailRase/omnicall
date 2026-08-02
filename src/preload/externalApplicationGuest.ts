/**
 * - Purpose: minimal sandboxed bridge for External Application guest pages (F-032).
 * - Inputs: close-guard callbacks from the card page; close-guard queries from main.
 * - Outputs: `window.omnicall` + close-guard IPC replies.
 *
 * Keep this file free of shared `@shared` imports so electron-vite does not emit
 * `require("./chunks/…")` under Electron `sandbox: true` (breaks main preload too).
 */

import { contextBridge, ipcRenderer } from "electron";

const GUEST_API_KEY = "omnicall";
const CLOSE_GUARD_QUERY = "external-applications:close-guard-query";
const CLOSE_GUARD_RESULT = "external-applications:close-guard-result";
const MAX_REQUEST_ID_LENGTH = 64;

type CloseGuard = () => boolean | Promise<boolean>;

type GuestApi = Readonly<{
  setCloseGuard: (guard: CloseGuard) => void;
  clearCloseGuard: () => void;
}>;

let closeGuard: CloseGuard | null = null;

const guestApi: GuestApi = Object.freeze({
  setCloseGuard: (guard: CloseGuard): void => {
    if (typeof guard !== "function") {
      closeGuard = null;
      return;
    }
    closeGuard = guard;
  },
  clearCloseGuard: (): void => {
    closeGuard = null;
  },
});

contextBridge.exposeInMainWorld(GUEST_API_KEY, guestApi);

ipcRenderer.on(CLOSE_GUARD_QUERY, (_event, value: unknown) => {
  void handleCloseGuardQuery(value);
});

async function handleCloseGuardQuery(value: unknown): Promise<void> {
  const query = parseCloseGuardQuery(value);
  if (query === null) {
    return;
  }
  const allow = await evaluateCloseGuard(closeGuard);
  ipcRenderer.send(CLOSE_GUARD_RESULT, {
    requestId: query.requestId,
    allow,
  });
}

async function evaluateCloseGuard(guard: CloseGuard | null): Promise<boolean> {
  if (guard === null) {
    return true;
  }
  try {
    return (await guard()) === true;
  } catch {
    return false;
  }
}

function parseCloseGuardQuery(
  value: unknown,
): Readonly<{ requestId: string }> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const requestId = (value as Record<string, unknown>)["requestId"];
  if (
    typeof requestId !== "string" ||
    requestId.length === 0 ||
    requestId.length > MAX_REQUEST_ID_LENGTH
  ) {
    return null;
  }
  return { requestId };
}
