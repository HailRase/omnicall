/**
 * Electron main registration for the typed SDK broker (DI-02 / ADR-0009).
 * Does not import Domain or Facades.
 */

import { BrowserWindow, ipcMain, type WebContents } from "electron";
import { MainToRendererBroker } from "@adapters/integration/MainToRendererBroker.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import type { SdkBrokerRequestIpcPayload } from "@shared/ipc/SdkBrokerContract.js";
import {
  parseSdkBrokerReadyIpcPayload,
  parseSdkBrokerReplyIpcPayload,
} from "@shared/ipc/SdkBrokerContract.js";

import { shouldClearBrokerReadyOnNavigation } from "./sdkBrokerReloadPolicy.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-011",
});

let broker: MainToRendererBroker | null = null;
/** Preferred softphone webContents that last claimed broker readiness. */
let targetWebContentsId: number | null = null;
/** webContents ids that already have a reload listener. */
const reloadHookWebContentsIds = new Set<number>();

function findWebContentsById(id: number): WebContents | null {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) {
      continue;
    }
    const { webContents } = window;
    if (!webContents.isDestroyed() && webContents.id === id) {
      return webContents;
    }
  }
  return null;
}

function resolveTargetWebContents(): WebContents | null {
  if (targetWebContentsId !== null) {
    const preferred = findWebContentsById(targetWebContentsId);
    if (preferred !== null) {
      return preferred;
    }
  }
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) {
      continue;
    }
    const { webContents } = window;
    if (!webContents.isDestroyed()) {
      return webContents;
    }
  }
  return null;
}

function sendRequest(payload: SdkBrokerRequestIpcPayload): boolean {
  const webContents = resolveTargetWebContents();
  if (webContents === null || webContents.isDestroyed()) {
    return false;
  }
  webContents.send(IPC_CHANNELS.sdkBrokerRequest, payload);
  return true;
}

function installReloadHook(webContents: WebContents): void {
  const webContentsId = webContents.id;
  if (reloadHookWebContentsIds.has(webContentsId)) {
    return;
  }
  reloadHookWebContentsIds.add(webContentsId);

  // Prefer main-frame document navigations over `did-start-loading`, which also
  // fires for DevTools/subframes/spurious loads and left compositionReady=false
  // while React stayed mounted (no second setSdkBrokerReady).
  webContents.on("did-start-navigation", (details) => {
    if (broker === null) {
      return;
    }
    if (
      targetWebContentsId !== null &&
      webContentsId !== targetWebContentsId
    ) {
      return;
    }
    if (
      !shouldClearBrokerReadyOnNavigation({
        isMainFrame: details.isMainFrame,
        isSameDocument: details.isSameDocument,
      })
    ) {
      return;
    }
    logger.info("sdk_broker_renderer_reload", {
      correlationId: createCorrelationId(),
      operation: "sdk_broker_reload",
      result: "pending_rejected",
      webContentsId,
      isMainFrame: details.isMainFrame,
      isSameDocument: details.isSameDocument,
    });
    broker.notifyRendererReload();
  });

  webContents.once("destroyed", () => {
    reloadHookWebContentsIds.delete(webContentsId);
    if (targetWebContentsId === webContentsId) {
      targetWebContentsId = null;
      broker?.notifyRendererReload();
    }
  });
}

/**
 * Create the singleton main-side broker and register IPC handlers.
 * Call once during main bootstrap. Safe if SDK is unused — inert until ready.
 */
export function registerSdkBrokerIpc(): MainToRendererBroker {
  if (broker !== null) {
    return broker;
  }

  broker = new MainToRendererBroker({
    transport: { sendRequest },
    onLog: (event, fields) => {
      logger.info(event, {
        correlationId: createCorrelationId(),
        operation: "sdk_broker",
        ...fields,
      });
    },
  });

  ipcMain.handle(IPC_CHANNELS.sdkBrokerSetReady, (event, payload: unknown) => {
    if (broker === null) {
      return { ok: false as const };
    }
    const parsed = parseSdkBrokerReadyIpcPayload(payload);
    if (parsed === null) {
      logger.error("sdk_broker_ready_rejected", {
        correlationId: createCorrelationId(),
        operation: "sdk_broker_set_ready",
        result: "invalid_payload",
      });
      return { ok: false as const };
    }

    targetWebContentsId = event.sender.id;
    installReloadHook(event.sender);
    broker.setReady(parsed.ready);
    return { ok: true as const };
  });

  ipcMain.handle(IPC_CHANNELS.sdkBrokerReply, (_event, payload: unknown) => {
    if (broker === null) {
      return { ok: false as const };
    }
    const parsed = parseSdkBrokerReplyIpcPayload(payload);
    if (parsed === null) {
      logger.error("sdk_broker_reply_envelope_rejected", {
        correlationId: createCorrelationId(),
        operation: "sdk_broker_reply",
        result: "invalid_payload",
      });
      return { ok: false as const };
    }

    const accepted = broker.acceptReply(parsed);
    return { ok: accepted };
  });

  return broker;
}

/** Quit started: reject pending before renderer telephony cleanup (ADR-0009). */
export function beginSdkBrokerAppShutdown(): void {
  broker?.beginAppShutdown();
}

/**
 * Quit/restart cancelled: restore product acceptance when composition was ready.
 */
export function cancelSdkBrokerAppShutdown(): void {
  broker?.cancelAppShutdown();
}

/** Confirmed quit: stop accepting broker work permanently for this process. */
export function shutdownSdkBroker(): void {
  broker?.shutdown();
}

export function getSdkBroker(): MainToRendererBroker | null {
  return broker;
}

/** Test-only reset for focused main registration tests. */
export function resetSdkBrokerRegistrationForTests(): void {
  broker?.shutdown();
  broker = null;
  targetWebContentsId = null;
  reloadHookWebContentsIds.clear();
  ipcMain.removeHandler(IPC_CHANNELS.sdkBrokerSetReady);
  ipcMain.removeHandler(IPC_CHANNELS.sdkBrokerReply);
}
