/**
 * Compose DI-05/DI-07 product surface: broker queries + native window handler.
 */

import type { BrowserWindow } from "electron";
import type { WireMessage } from "@axata/axatalk-protocol";
import type { MainToRendererBroker } from "@adapters/integration/MainToRendererBroker.js";
import type { SdkGatewayProductSurface } from "@adapters/integration/sdkGatewayProductSurface.js";
import { SdkWindowCommandHandler } from "@adapters/integration/sdkGatewayWindowHandler.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSdkBrokerClientSessionEndedIpcPayload,
  type SdkBrokerClientSessionEndedIpcPayload,
} from "@shared/ipc/SdkBrokerContract.js";

export function createSdkGatewayProductSurface(input: {
  readonly getBroker: () => MainToRendererBroker | null;
  readonly getMainWindow: () => BrowserWindow | null;
}): SdkGatewayProductSurface {
  const windowHandler = new SdkWindowCommandHandler({
    getMainWindow: input.getMainWindow,
  });
  return {
    isProductReady: () => input.getBroker()?.isReady() ?? false,
    requestProductCommand: async (
      command: WireMessage,
      context?: { readonly clientId?: string },
    ) => {
      const broker = input.getBroker();
      if (broker === null) {
        return { ok: false, code: "not_ready" };
      }
      return broker.request(command, context);
    },
    showWindow: () => windowHandler.show(),
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
