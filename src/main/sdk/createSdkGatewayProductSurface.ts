/**
 * Compose DI-05/DI-07 product surface: broker queries + native window handler.
 */

import type { BrowserWindow } from "electron";
import type { WireMessage } from "@softomnitel/omnicall-protocol";
import type { MainToRendererBroker } from "@adapters/integration/MainToRendererBroker.js";
import type { SdkGatewayProductSurface } from "@adapters/integration/sdkGatewayProductSurface.js";
import { SdkWindowCommandHandler } from "@adapters/integration/sdkGatewayWindowHandler.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSdkBrokerClientSessionEndedIpcPayload,
  type SdkBrokerClientSessionEndedIpcPayload,
} from "@shared/ipc/SdkBrokerContract.js";
import type { SdkHideTrayController } from "../shellWindow/SdkHideTrayController.js";
import type { ShellTelephonyBusyMirror } from "../shellWindow/ShellTelephonyBusyMirror.js";

export function createSdkGatewayProductSurface(input: {
  readonly getBroker: () => MainToRendererBroker | null;
  readonly getMainWindow: () => BrowserWindow | null;
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
    hideWindow: (expectedRevision: number) =>
      windowHandler.hide(expectedRevision),
    getWindowState: () => windowHandler.getState(),
    onClientSessionEnded: (clientId: string) => {
      const payload: SdkBrokerClientSessionEndedIpcPayload = { clientId };
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
