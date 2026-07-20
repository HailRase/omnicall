/**
 * Injectable DI-05 product surface for the loopback gateway.
 * Broker queries + native window ops — no Domain/Facades in adapters.
 */

import type {
  ProtocolErrorCode,
  WireMessage,
} from "@axatalk/protocol";
import type { BrokerRequestResult } from "@ports/integration/MainToRendererBrokerPort.js";

export type SdkWindowShowResult =
  | { readonly ok: true; readonly revision: number; readonly visible: true }
  | { readonly ok: false; readonly code: ProtocolErrorCode };

export type SdkWindowStateResult =
  | { readonly ok: true; readonly visible: boolean; readonly revision: number }
  | { readonly ok: false; readonly code: ProtocolErrorCode };

export type SdkGatewayProductSurface = Readonly<{
  isProductReady: () => boolean;
  requestProductCommand: (command: WireMessage) => Promise<BrokerRequestResult>;
  showWindow: () => SdkWindowShowResult;
  getWindowState: () => SdkWindowStateResult;
  /** Fan-out already-validated public event drafts from renderer. */
  onPublishPublicEvent?: (draft: unknown) => void;
}>;
