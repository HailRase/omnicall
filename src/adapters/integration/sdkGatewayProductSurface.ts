/**
 * Injectable DI-05 product surface for the loopback gateway.
 * Broker queries + native window ops — no Domain/Facades in adapters.
 */

import type {
  ProtocolErrorCode,
  WireMessage,
} from "@axata/axatalk-protocol";
import type { BrokerRequestResult } from "@ports/integration/MainToRendererBrokerPort.js";

export type SdkWindowShowResult =
  | { readonly ok: true; readonly revision: number; readonly visible: true }
  | { readonly ok: false; readonly code: ProtocolErrorCode };

export type SdkWindowStateResult =
  | { readonly ok: true; readonly visible: boolean; readonly revision: number }
  | { readonly ok: false; readonly code: ProtocolErrorCode };

export type SdkProductCommandContext = Readonly<{
  clientId?: string;
}>;

export type SdkGatewayProductSurface = Readonly<{
  isProductReady: () => boolean;
  requestProductCommand: (
    command: WireMessage,
    context?: SdkProductCommandContext,
  ) => Promise<BrokerRequestResult>;
  showWindow: () => SdkWindowShowResult;
  getWindowState: () => SdkWindowStateResult;
  /** Fan-out already-validated public event drafts from renderer. */
  onPublishPublicEvent?: (draft: unknown) => void;
  /**
   * Authenticated client socket closed/revoked — abandon pending logout only.
   * Must not tear SIP or account sessions (ADR-0017 O-OWN-1).
   */
  onClientSessionEnded?: (clientId: string) => void;
}>;
