/**
 * Fail-closed inbound routing for SDK gateway (DI-03…DI-05).
 */

import type {
  AuthProof,
  PairingRequest,
  ProtocolErrorCode,
  WireMessage,
} from "@axatalk/protocol";
import { productDenialCodeForCommand } from "@axatalk/protocol";

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

type CommandMessage = Extract<WireMessage, { kind: "command" }>;

export type SdkInboundRoute =
  | { readonly action: "server_hello" }
  | { readonly action: "pairing_request"; readonly message: PairingRequest }
  | { readonly action: "auth_proof"; readonly message: AuthProof }
  | {
      readonly action: "command_deny";
      readonly requestId: string;
      readonly commandType: CommandMessage["type"];
      readonly code: ProtocolErrorCode;
    }
  | {
      readonly action: "command_ping";
      readonly requestId: string;
    }
  | {
      readonly action: "command_broker";
      readonly requestId: string;
      readonly commandType: CommandMessage["type"];
      readonly message: CommandMessage;
    }
  | {
      readonly action: "command_window";
      readonly requestId: string;
      readonly commandType: "window:show" | "window:get-state";
    }
  | {
      readonly action: "command_not_ready";
      readonly requestId: string;
      readonly commandType: CommandMessage["type"];
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
  message: CommandMessage,
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

  // ADR-0013: v1-unavailable commands (e.g. window:hide) → forbidden before
  // capability / not_ready fall-through.
  const productDenial = productDenialCodeForCommand(message.type);
  if (productDenial !== null) {
    return {
      action: "command_deny",
      requestId: message.requestId,
      commandType: message.type,
      code: productDenial,
    };
  }

  const required = requiredCapabilityForCommand(message.type);
  if (!connectionHasCapability(view.grantedCapabilities, required)) {
    return {
      action: "command_deny",
      requestId: message.requestId,
      commandType: message.type,
      code: "forbidden",
    };
  }

  if (message.type === "sdk:ping") {
    return { action: "command_ping", requestId: message.requestId };
  }

  if (
    message.type === "sdk:get-snapshot" ||
    message.type === "call:originate" ||
    message.type === "call:answer" ||
    message.type === "call:reject" ||
    message.type === "call:hangup" ||
    message.type === "call:hold" ||
    message.type === "call:resume" ||
    message.type === "call:mute" ||
    message.type === "call:unmute" ||
    message.type === "call:send-dtmf"
  ) {
    return {
      action: "command_broker",
      requestId: message.requestId,
      commandType: message.type,
      message,
    };
  }

  if (message.type === "window:show" || message.type === "window:get-state") {
    return {
      action: "command_window",
      requestId: message.requestId,
      commandType: message.type,
    };
  }

  // Operator / account mutations land in DI-07/DI-08.
  return {
    action: "command_not_ready",
    requestId: message.requestId,
    commandType: message.type,
  };
}
