/**
 * Fail-closed inbound routing for handshake-only gateway (DI-03).
 * Product commands / snapshots never succeed while unauthenticated.
 */

import type { ProtocolErrorCode, WireMessage } from "@axatalk/protocol";

export type SdkInboundRoute =
  | { readonly action: "server_hello" }
  | {
      readonly action: "command_deny";
      readonly requestId: string;
      readonly commandType: Extract<WireMessage, { kind: "command" }>["type"];
      readonly code: ProtocolErrorCode;
    }
  | { readonly action: "close"; readonly code: ProtocolErrorCode };

/**
 * Route a validated wire message for an unauthenticated connection.
 * Pairing/auth product paths are deferred to DI-04 — deny closed.
 */
export function routeUnauthenticatedInbound(
  message: WireMessage,
  handshakeComplete: boolean,
): SdkInboundRoute {
  if (message.kind === "handshake" && message.type === "sdk:client-hello") {
    if (handshakeComplete) {
      return { action: "close", code: "conflict" };
    }
    return { action: "server_hello" };
  }

  if (message.kind === "command") {
    return {
      action: "command_deny",
      requestId: message.requestId,
      commandType: message.type,
      code: "unauthenticated",
    };
  }

  if (message.kind === "pairing" || message.kind === "auth") {
    return { action: "close", code: "forbidden" };
  }

  return { action: "close", code: "invalid_message" };
}
