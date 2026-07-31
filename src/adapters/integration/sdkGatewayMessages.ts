/**
 * Protocol message builders for SDK gateway (DI-03…DI-05).
 */

import {
  PROTOCOL_MAJOR,
  PROTOCOL_MAX,
  PROTOCOL_MIN,
  type AuthChallenge,
  type CapabilityId,
  type CommandType,
  type PairingProfile,
  type ProtocolErrorCode,
  type WireJsonObject,
  type WireMessage,
} from "@softomnitel/omnicall-protocol";

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

export function buildServerHello(input: {
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly pairingRequired: boolean;
  readonly authChallenge?: AuthChallenge;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "handshake",
    type: "sdk:server-hello",
    selectedProtocolVersion: PROTOCOL_MAJOR,
    desktopVersion: input.identity.desktopVersion,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    serverNonce: createSdkBase64UrlNonce(),
    pairingRequired: input.pairingRequired,
    ...(input.authChallenge !== undefined
      ? { authChallenge: input.authChallenge }
      : {}),
    maxMessageBytes: input.identity.maxMessageBytes,
    heartbeatSeconds: input.identity.heartbeatSeconds,
    occurredAt: createSdkIsoTimestamp(input.now),
  };
}

export function buildCommandFailureReply(input: {
  readonly requestId: string;
  readonly commandType: CommandType;
  readonly code: ProtocolErrorCode;
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly currentRevision?: number;
  readonly details?: WireJsonObject;
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
      ...(input.currentRevision !== undefined
        ? { currentRevision: input.currentRevision }
        : {}),
      ...(input.details !== undefined ? { details: input.details } : {}),
    },
  };
}

export function buildCommandSuccessReply(input: {
  readonly requestId: string;
  readonly commandType: CommandType;
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly revision?: number;
  readonly result?: WireJsonObject;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "reply",
    ok: true,
    requestId: input.requestId,
    commandType: input.commandType,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    occurredAt: createSdkIsoTimestamp(input.now),
    revision: input.revision ?? 0,
    result: input.result ?? {},
  };
}

export function buildPairingPending(input: {
  readonly pairingRequestId: string;
  readonly expiresAt: string;
  readonly now: () => Date;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "pairing",
    type: "pairing:pending",
    pairingRequestId: input.pairingRequestId,
    expiresAt: input.expiresAt,
    occurredAt: createSdkIsoTimestamp(input.now),
  };
}

export function buildPairingApproved(input: {
  readonly clientId: string;
  readonly profile: PairingProfile;
  readonly grantedCapabilities: readonly CapabilityId[];
  readonly now: () => Date;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "pairing",
    type: "pairing:approved",
    clientId: input.clientId,
    profile: input.profile,
    grantedCapabilities: [...input.grantedCapabilities],
    occurredAt: createSdkIsoTimestamp(input.now),
  };
}

export function buildPairingDenied(input: {
  readonly clientId: string;
  readonly now: () => Date;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "pairing",
    type: "pairing:denied",
    clientId: input.clientId,
    occurredAt: createSdkIsoTimestamp(input.now),
  };
}

export function buildSdkRevokedEvent(input: {
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly sequence: number;
  readonly reasonCode: string;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "event",
    type: "sdk:revoked",
    eventId: createSdkOpaqueId("evt"),
    sequence: input.sequence,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    occurredAt: createSdkIsoTimestamp(input.now),
    revision: 0,
    payload: { reasonCode: input.reasonCode },
  };
}

export function buildSdkPermissionChangedEvent(input: {
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly sequence: number;
  readonly grantedCapabilities: readonly import("@softomnitel/omnicall-protocol").CapabilityId[];
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "event",
    type: "sdk:permission-changed",
    eventId: createSdkOpaqueId("evt"),
    sequence: input.sequence,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    occurredAt: createSdkIsoTimestamp(input.now),
    revision: 0,
    payload: { grantedCapabilities: [...input.grantedCapabilities] },
  };
}

/** ADR-0009: graceful desktop/gateway stop signal for authenticated clients. */
export function buildSdkServerShutdownEvent(input: {
  readonly identity: SdkGatewayIdentity;
  readonly now: () => Date;
  readonly sequence: number;
  readonly reasonCode?: string;
}): WireMessage {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "event",
    type: "sdk:server-shutdown",
    eventId: createSdkOpaqueId("evt"),
    sequence: input.sequence,
    serverInstanceId: input.identity.serverInstanceId,
    sessionEpoch: input.identity.sessionEpoch,
    occurredAt: createSdkIsoTimestamp(input.now),
    revision: 0,
    payload:
      input.reasonCode !== undefined && input.reasonCode.length > 0
        ? { reasonCode: input.reasonCode.slice(0, 64) }
        : {},
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
