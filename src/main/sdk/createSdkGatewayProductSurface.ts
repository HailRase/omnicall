/**
 * Compose DI-05 product surface: broker queries + native window handler.
 */

import type { BrowserWindow } from "electron";
import type { WireMessage } from "@axatalk/protocol";
import type { MainToRendererBroker } from "@adapters/integration/MainToRendererBroker.js";
import type { SdkGatewayProductSurface } from "@adapters/integration/sdkGatewayProductSurface.js";
import { SdkWindowCommandHandler } from "@adapters/integration/sdkGatewayWindowHandler.js";

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
  };
}
