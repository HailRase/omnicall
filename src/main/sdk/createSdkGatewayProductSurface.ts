/**
 * Compose DI-05/DI-07 product surface: broker queries + native window executor.
 * Window revision validate/advance is Application-owned via broker (WU-02).
 */

import { ipcMain, type BrowserWindow as ElectronBrowserWindow } from "electron";
import type { WireMessage } from "@softomnitel/omnicall-protocol";
import type { MainToRendererBroker } from "@adapters/integration/MainToRendererBroker.js";
import type { SdkGatewayProductSurface } from "@adapters/integration/sdkGatewayProductSurface.js";
import { SdkWindowCommandHandler } from "@adapters/integration/sdkGatewayWindowHandler.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSdkBrokerClientSessionEndedIpcPayload,
  type SdkBrokerClientSessionEndedIpcPayload,
} from "@shared/ipc/SdkBrokerContract.js";
import {
  parseSdkNativeWindowIpcPayload,
  type SdkNativeWindowIpcResponse,
} from "@shared/ipc/SdkNativeWindowContract.js";
import type { SdkHideTrayController } from "../shellWindow/SdkHideTrayController.js";
import type { ShellTelephonyBusyMirror } from "../shellWindow/ShellTelephonyBusyMirror.js";

let nativeWindowHandler: SdkWindowCommandHandler | null = null;
type SdkNativeWindowIpcMainWindow = Readonly<{
  isDestroyed: () => boolean;
  webContents: Readonly<{ id: number }>;
}>;

export function getSdkNativeWindowHandler(): SdkWindowCommandHandler | null {
  return nativeWindowHandler;
}

export function createSdkGatewayProductSurface(input: {
  readonly getBroker: () => MainToRendererBroker | null;
  readonly getMainWindow: () => ElectronBrowserWindow | null;
  readonly telephonyBusy?: ShellTelephonyBusyMirror;
  readonly hideTray?: SdkHideTrayController;
}): SdkGatewayProductSurface {
  const windowHandler = new SdkWindowCommandHandler({
    getMainWindow: input.getMainWindow,
    isTelephonyBusy: () => input.telephonyBusy?.isBusy() ?? false,
    onHidden: () => {
      input.hideTray?.ensureVisible();
    },
    onShown: () => {
      input.hideTray?.dispose();
    },
  });
  nativeWindowHandler = windowHandler;
  return {
    isProductReady: () => input.getBroker()?.isReady() ?? false,
    requestProductCommand: async (
      command: WireMessage,
      context?: { readonly clientId?: string; readonly origin?: string },
    ) => {
      const broker = input.getBroker();
      if (broker === null) {
        return { ok: false, code: "not_ready" };
      }
      return broker.request(command, context);
    },
    showWindow: () => windowHandler.show(),
    hideWindow: () => windowHandler.hide(),
    getWindowState: () => windowHandler.getState(),
    onClientSessionEnded: ({ origin, clientId }) => {
      const payload: SdkBrokerClientSessionEndedIpcPayload = { origin, clientId };
      const parsed = parseSdkBrokerClientSessionEndedIpcPayload(payload);
      if (parsed === null) {
        return;
      }
      const win = input.getMainWindow();
      if (win === null || win.isDestroyed()) {
        return;
      }
      win.webContents.send(IPC_CHANNELS.sdkBrokerClientSessionEnded, parsed);
    },
  };
}

/**
 * Register renderer→main native window IPC (WU-02). Safe to call once at boot.
 */
export function registerSdkNativeWindowIpc(input: {
  readonly getMainWindow: () => SdkNativeWindowIpcMainWindow | null;
}): void {
  ipcMain.removeHandler(IPC_CHANNELS.sdkNativeWindow);
  ipcMain.handle(
    IPC_CHANNELS.sdkNativeWindow,
    (event, payload: unknown): SdkNativeWindowIpcResponse => {
      const mainWindow = input.getMainWindow();
      if (
        mainWindow === null ||
        mainWindow.isDestroyed() ||
        event.sender.id !== mainWindow.webContents.id
      ) {
        return { ok: false, code: "forbidden" };
      }
      const parsed = parseSdkNativeWindowIpcPayload(payload);
      if (parsed === null) {
        return { ok: false, code: "invalid_payload" };
      }
      const handler = nativeWindowHandler;
      if (handler === null) {
        return { ok: false, code: "not_ready" };
      }
      if (parsed.op === "show") {
        return handler.show();
      }
      if (parsed.op === "hide") {
        return handler.hide();
      }
      return handler.getState();
    },
  );
}
