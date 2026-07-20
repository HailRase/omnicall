/**
 * Protocol message builders for handshake-only SDK gateway (DI-03).
 * No product snapshot / success replies.
 */

import {
  PROTOCOL_MAJOR,
  PROTOCOL_MAX,
  PROTOCOL_MIN,
  type CommandType,
  type ProtocolErrorCode,
  type WireMessage,
} from "@axatalk/protocol";

import {
  createSdkBase64UrlNonce,
  createSdkIsoTimestamp,
  createSdkOpaqueId,
} from "./sdkGatewayIds.js";

export type SdkGatewayIdentity = Readonly<{
  desktopVersion: string;
  serverInstanceId: string;
  sessionEpoch: string;
  maxMessageBytes: number;
  heartbeatSeconds: number;
}>;

export function buildDiscoveryDocument(
  identity: SdkGatewayIdentity,
  wsUrl: string,
): Readonly<{
  discoveryVersion: 1;
  protocolMin: typeof PROTOCOL_MIN;
  protocolMax: typeof PROTOCOL_MAX;
  desktopVersion: string;
  serverInstanceId: string;
  wsUrl: string;
  maxMessageBytes: number;
  heartbeatSeconds: number;
  pairingRequired: true;
}> {
  return {
    discoveryVersion: 1,
    protocolMin: PROTOCOL_MIN,
    protocolMax: PROTOCOL_MAX,
    desktopVersion: identity.desktopVersion,
    serverInstanceId: identity.serverInstanceId,
    wsUrl,
    maxMessageBytes: identity.maxMessageBytes,
    heartbeatSeconds: identity.heartbeatSeconds,
    pairingRequired: true,
  };
}

export function buildServerHello(
  identity: SdkGatewayIdentity,
  now: () => Date,
): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "handshake",
    type: "sdk:server-hello",
    selectedProtocolVersion: PROTOCOL_MAJOR,
    desktopVersion: identity.desktopVersion,
    serverInstanceId: identity.serverInstanceId,
    sessionEpoch: identity.sessionEpoch,
    serverNonce: createSdkBase64UrlNonce(),
    pairingRequired: true,
    maxMessageBytes: identity.maxMessageBytes,
    heartbeatSeconds: identity.heartbeatSeconds,
    occurredAt: createSdkIsoTimestamp(now),
  };
}

export function buildCommandFailureReply(input: {
  readonly requestId: string;
  readonly commandType: CommandType;
  readonly code: ProtocolErrorCode;
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "reply",
    ok: false,
    requestId: input.requestId,
    commandType: input.commandType,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    occurredAt: createSdkIsoTimestamp(input.now),
    error: {
      code: input.code,
      retryable: input.code === "rate_limited" || input.code === "not_ready",
    },
  };
}

export function createGatewayIdentityShell(
  desktopVersion: string,
): Pick<SdkGatewayIdentity, "desktopVersion" | "serverInstanceId" | "sessionEpoch"> {
  return {
    desktopVersion,
    serverInstanceId: createSdkOpaqueId("srv"),
    sessionEpoch: createSdkOpaqueId("epoch"),
  };
}
