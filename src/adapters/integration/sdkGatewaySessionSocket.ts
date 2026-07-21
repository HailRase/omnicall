/**
 * Socket lifecycle helpers for LocalWsSessionRegistry (DI-03/DI-04).
 */

import type { WireMessage } from "@axata/axatalk-protocol";
import type { RawData } from "ws";
import { WebSocket } from "ws";

import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import {
  clearSdkGatewayConnectionTimers,
  recordInboundAndCheckRate,
  type SdkGatewayConnection,
} from "./sdkGatewayConnection.js";
import { rawDataToString } from "./localWsServerHelpers.js";

export function bindSdkGatewaySocketHandlers(input: {
  readonly connection: SdkGatewayConnection;
  readonly onMessage: (connection: SdkGatewayConnection, text: string) => void;
  readonly onActivity: (connection: SdkGatewayConnection) => void;
  readonly onClose: (connection: SdkGatewayConnection) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly limits: SdkGatewayLimits;
  readonly nowMs: () => number;
  readonly logRateLimited: () => void;
}): void {
  const { connection } = input;
  connection.socket.on("message", (data, isBinary) => {
    handleInboundFrame({
      connection,
      data,
      isBinary,
      onMessage: input.onMessage,
      closeConnection: input.closeConnection,
      limits: input.limits,
      nowMs: input.nowMs,
      logRateLimited: input.logRateLimited,
      onActivity: input.onActivity,
    });
  });
  connection.socket.on("pong", () => {
    connection.awaitingPong = false;
    connection.lastActivityMs = input.nowMs();
    input.onActivity(connection);
  });
  connection.socket.on("close", () => {
    input.onClose(connection);
  });
  connection.socket.on("error", () => {
    input.closeConnection(connection, "socket_error");
  });
}

function handleInboundFrame(input: {
  readonly connection: SdkGatewayConnection;
  readonly data: RawData;
  readonly isBinary: boolean;
  readonly onMessage: (connection: SdkGatewayConnection, text: string) => void;
  readonly onActivity: (connection: SdkGatewayConnection) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly limits: SdkGatewayLimits;
  readonly nowMs: () => number;
  readonly logRateLimited: () => void;
}): void {
  if (input.isBinary) {
    input.closeConnection(input.connection, "binary_frame");
    return;
  }
  const text = rawDataToString(input.data);
  if (Buffer.byteLength(text, "utf8") > input.limits.maxMessageBytes) {
    input.closeConnection(input.connection, "oversized_frame");
    return;
  }
  if (
    !recordInboundAndCheckRate(input.connection, input.nowMs(), input.limits)
  ) {
    input.logRateLimited();
    input.closeConnection(input.connection, "rate_limited");
    return;
  }
  input.onActivity(input.connection);
  input.onMessage(input.connection, text);
}

export function sendSdkGatewayJson(input: {
  readonly connection: SdkGatewayConnection;
  readonly message: WireMessage;
  readonly maxOutboundQueue: number;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
}): void {
  const { connection } = input;
  if (connection.socket.readyState !== WebSocket.OPEN) {
    return;
  }
  if (connection.outboundQueueDepth >= input.maxOutboundQueue) {
    input.closeConnection(connection, "outbound_queue_full");
    return;
  }
  connection.outboundQueueDepth += 1;
  connection.socket.send(JSON.stringify(input.message), (error) => {
    connection.outboundQueueDepth = Math.max(0, connection.outboundQueueDepth - 1);
    if (error !== undefined && error !== null) {
      input.closeConnection(connection, "send_failed");
    }
  });
}

export function startSdkGatewayHeartbeat(input: {
  readonly connection: SdkGatewayConnection;
  readonly heartbeatSeconds: number;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
}): void {
  const intervalMs = input.heartbeatSeconds * 1000;
  input.connection.heartbeatTimer = setInterval(() => {
    if (input.connection.awaitingPong) {
      input.closeConnection(input.connection, "heartbeat_missed");
      return;
    }
    if (input.connection.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    input.connection.awaitingPong = true;
    input.connection.socket.ping();
  }, intervalMs);
}

export function armSdkGatewayIdleTimer(input: {
  readonly connection: SdkGatewayConnection;
  readonly unauthIdleMs: number;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
}): void {
  if (input.connection.idleTimer !== null) {
    clearTimeout(input.connection.idleTimer);
  }
  input.connection.idleTimer = setTimeout(() => {
    input.closeConnection(input.connection, "unauth_idle_timeout");
  }, input.unauthIdleMs);
}

export function closeSdkGatewayConnection(input: {
  readonly connection: SdkGatewayConnection;
  readonly reason: string;
  readonly connections: Map<string, SdkGatewayConnection>;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
}): void {
  input.log("sdk_gateway_connection_closed", {
    reason: input.reason,
    connectionCount: Math.max(0, input.connections.size - 1),
  });
  clearSdkGatewayConnectionTimers(input.connection);
  input.connections.delete(input.connection.id);
  if (
    input.connection.socket.readyState === WebSocket.OPEN ||
    input.connection.socket.readyState === WebSocket.CONNECTING
  ) {
    input.connection.socket.close(1008, input.reason.slice(0, 120));
  }
}
