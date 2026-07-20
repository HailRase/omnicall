/**
 * Fail-closed inbound routing for SDK gateway (DI-03/DI-04).
 * Product snapshots never succeed until DI-05; unauthenticated product → deny.
 */

import type {
  AuthProof,
  PairingRequest,
  ProtocolErrorCode,
  WireMessage,
} from "@axatalk/protocol";

import {
  connectionHasCapability,
  requiredCapabilityForCommand,
} from "./sdkGatewayCapabilities.js";
import type { SdkGatewayAuthState } from "./sdkGatewayConnection.js";
import type { CapabilityId } from "@axatalk/protocol";

export type SdkConnectionRouteView = Readonly<{
  handshakeComplete: boolean;
  authState: SdkGatewayAuthState;
  grantedCapabilities: readonly CapabilityId[];
}>;

export type SdkInboundRoute =
  | { readonly action: "server_hello" }
  | { readonly action: "pairing_request"; readonly message: PairingRequest }
  | { readonly action: "auth_proof"; readonly message: AuthProof }
  | {
      readonly action: "command_deny";
      readonly requestId: string;
      readonly commandType: Extract<WireMessage, { kind: "command" }>["type"];
      readonly code: ProtocolErrorCode;
    }
  | {
      readonly action: "command_ping";
      readonly requestId: string;
    }
  | {
      readonly action: "command_not_ready";
      readonly requestId: string;
      readonly commandType: Extract<WireMessage, { kind: "command" }>["type"];
    }
  | { readonly action: "close"; readonly code: ProtocolErrorCode };

/**
 * Route a validated wire message for the current connection auth view.
 */
export function routeSdkInbound(
  message: WireMessage,
  view: SdkConnectionRouteView,
): SdkInboundRoute {
  if (message.kind === "handshake" && message.type === "sdk:client-hello") {
    if (view.handshakeComplete) {
      return { action: "close", code: "conflict" };
    }
    return { action: "server_hello" };
  }

  if (!view.handshakeComplete) {
    return { action: "close", code: "unauthenticated" };
  }

  if (message.kind === "pairing" && message.type === "pairing:request") {
    if (view.authState === "authenticated") {
      return { action: "close", code: "conflict" };
    }
    return { action: "pairing_request", message };
  }

  if (message.kind === "auth" && message.type === "sdk:auth-proof") {
    return { action: "auth_proof", message };
  }

  if (message.kind === "command") {
    return routeCommand(message, view);
  }

  return { action: "close", code: "invalid_message" };
}

function routeCommand(
  message: Extract<WireMessage, { kind: "command" }>,
  view: SdkConnectionRouteView,
): SdkInboundRoute {
  if (view.authState !== "authenticated") {
    return {
      action: "command_deny",
      requestId: message.requestId,
      commandType: message.type,
      code: "unauthenticated",
    };
  }

  const required = requiredCapabilityForCommand(message.type);
  if (!connectionHasCapability(view.grantedCapabilities, required)) {
    return {
      action: "command_deny",
      requestId: message.requestId,
      commandType: message.type,
      code: required === null ? "forbidden" : "forbidden",
    };
  }

  if (message.type === "sdk:ping") {
    return { action: "command_ping", requestId: message.requestId };
  }

  // Authenticated + capable product paths land in DI-05+.
  return {
    action: "command_not_ready",
    requestId: message.requestId,
    commandType: message.type,
  };
}

