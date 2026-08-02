/**
 * Injectable DI-05 product surface for the loopback gateway.
 * Broker queries + native window ops — no Domain/Facades in adapters.
 * Public revision for window joins Application coordinator via broker (WU-02).
 */

import type {
  ProtocolErrorCode,
  WireMessage,
} from "@softomnitel/omnicall-protocol";
import type { BrokerRequestResult } from "@ports/integration/MainToRendererBrokerPort.js";

/** Native-only result — no revision field (Application owns the public clock). */
export type SdkNativeWindowSurfaceResult =
  | { readonly ok: true; readonly visible: boolean }
  | { readonly ok: false; readonly code: ProtocolErrorCode };

export type SdkProductCommandContext = Readonly<{
  clientId?: string;
  origin?: string;
}>;

export type SdkGatewayProductSurface = Readonly<{
  isProductReady: () => boolean;
  requestProductCommand: (
    command: WireMessage,
    context?: SdkProductCommandContext,
  ) => Promise<BrokerRequestResult>;
  /** Native show (no revision). Used by renderer→main IPC after coordinator validate. */
  showWindow: () => SdkNativeWindowSurfaceResult;
  /** Native hide (no revision / no expectedRevision). Busy → conflict. */
  hideWindow: () => SdkNativeWindowSurfaceResult;
  /** Native get-state (no revision). */
  getWindowState: () => SdkNativeWindowSurfaceResult;
  /** Fan-out already-validated public event drafts from renderer. */
  onPublishPublicEvent?: (draft: unknown) => void;
  /**
   * Authenticated client socket closed/revoked — abort only owned pending work.
   * Must not tear SIP or account sessions (ADR-0017 O-OWN-1).
   */
  onClientSessionEnded?: (identity: Readonly<{ origin: string; clientId: string }>) => void;
}>;
