/**
 * Per-connection state for the handshake-only loopback SDK gateway (DI-03).
 */

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

export type SdkGatewayConnection = {
  readonly id: string;
  readonly socket: SdkGatewaySocket;
  handshakeComplete: boolean;
  lastActivityMs: number;
  inboundTimestampsMs: number[];
  outboundQueueDepth: number;
  handshakeTimer: ReturnType<typeof setTimeout> | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  awaitingPong: boolean;
};

export function createSdkGatewayConnection(
  id: string,
  socket: SdkGatewaySocket,
  nowMs: number,
): SdkGatewayConnection {
  return {
    id,
    socket,
    handshakeComplete: false,
    lastActivityMs: nowMs,
    inboundTimestampsMs: [],
    outboundQueueDepth: 0,
    handshakeTimer: null,
    idleTimer: null,
    heartbeatTimer: null,
    awaitingPong: false,
  };
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
