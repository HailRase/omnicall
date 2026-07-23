/**
 * Per-connection state for the loopback SDK gateway (DI-03/DI-04).
 */

import type { CapabilityId } from "@axata/axatalk-protocol";
import type { RawData } from "ws";

import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";

/** Narrow socket surface used by the session registry (avoids leaking full `ws` types). */
export type SdkGatewaySocket = {
  readyState: number;
  on(
    event: "message" | "pong" | "close" | "error",
    listener: ((data: RawData, isBinary: boolean) => void) | (() => void),
  ): void;
  ping(): void;
  send(data: string, cb?: (error?: Error | null) => void): void;
  close(code?: number, reason?: string): void;
  terminate(): void;
};

export type SdkGatewayAuthState =
  | "unauthenticated"
  | "authenticating"
  | "authenticated"
  | "revoked";

export type SdkGatewayConnection = {
  readonly id: string;
  readonly socket: SdkGatewaySocket;
  readonly origin: string;
  handshakeComplete: boolean;
  authState: SdkGatewayAuthState;
  clientId: string | null;
  grantedCapabilities: readonly CapabilityId[];
  sessionExpiresAtMs: number | null;
  eventSequence: number;
  lastActivityMs: number;
  inboundTimestampsMs: number[];
  outboundQueueDepth: number;
  /**
   * Promise chain that serializes async inbound handlers for this socket.
   * Preserves wire order so `sdk:auth-proof` completes before a following `sdk:ping`.
   */
  inboundTail: Promise<void>;
  handshakeTimer: ReturnType<typeof setTimeout> | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  awaitingPong: boolean;
};

export function createSdkGatewayConnection(
  id: string,
  socket: SdkGatewaySocket,
  origin: string,
  nowMs: number,
): SdkGatewayConnection {
  return {
    id,
    socket,
    origin,
    handshakeComplete: false,
    authState: "unauthenticated",
    clientId: null,
    grantedCapabilities: [],
    sessionExpiresAtMs: null,
    eventSequence: 0,
    lastActivityMs: nowMs,
    inboundTimestampsMs: [],
    outboundQueueDepth: 0,
    inboundTail: Promise.resolve(),
    handshakeTimer: null,
    idleTimer: null,
    heartbeatTimer: null,
    awaitingPong: false,
  };
}

/**
 * Enqueue one inbound task so handlers for a connection run strictly in receive order.
 * Prior task failures never skip later frames; task errors are swallowed to keep the chain.
 */
export function enqueueSdkGatewayInbound(
  connection: SdkGatewayConnection,
  task: () => Promise<void>,
): void {
  connection.inboundTail = connection.inboundTail
    .catch(() => undefined)
    .then(task)
    .catch(() => undefined);
}

export function clearSdkGatewayConnectionTimers(
  connection: SdkGatewayConnection,
): void {
  if (connection.handshakeTimer !== null) {
    clearTimeout(connection.handshakeTimer);
    connection.handshakeTimer = null;
  }
  if (connection.idleTimer !== null) {
    clearTimeout(connection.idleTimer);
    connection.idleTimer = null;
  }
  if (connection.heartbeatTimer !== null) {
    clearInterval(connection.heartbeatTimer);
    connection.heartbeatTimer = null;
  }
}

export function recordInboundAndCheckRate(
  connection: SdkGatewayConnection,
  nowMs: number,
  limits: SdkGatewayLimits,
): boolean {
  const windowStart = nowMs - limits.rateLimitWindowMs;
  connection.inboundTimestampsMs = connection.inboundTimestampsMs.filter(
    (ts) => ts >= windowStart,
  );
  if (connection.inboundTimestampsMs.length >= limits.rateLimitMax) {
    return false;
  }
  connection.inboundTimestampsMs.push(nowMs);
  connection.lastActivityMs = nowMs;
  return true;
}
