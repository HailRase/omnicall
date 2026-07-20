/**
 * Connection registry for handshake-only loopback WS gateway (DI-03).
 */

import type { WireMessage } from "@axatalk/protocol";
import type { RawData } from "ws";
import { WebSocket } from "ws";

import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import {
  clearSdkGatewayConnectionTimers,
  createSdkGatewayConnection,
  recordInboundAndCheckRate,
  type SdkGatewayConnection,
  type SdkGatewaySocket,
} from "./sdkGatewayConnection.js";
import { createSdkOpaqueId } from "./sdkGatewayIds.js";
import {
  buildCommandFailureReply,
  buildServerHello,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import { routeUnauthenticatedInbound } from "./sdkGatewayRouteInbound.js";
import {
  rawDataToString,
  type SdkGatewayLogFn,
} from "./localWsServerHelpers.js";

export type LocalWsSessionRegistryDeps = Readonly<{
  limits: SdkGatewayLimits;
  now: () => Date;
  validateWire: (
    input: unknown,
  ) =>
    | { success: true; data: WireMessage }
    | { success: false; code: string };
  getIdentity: () => SdkGatewayIdentity | null;
  onLog?: SdkGatewayLogFn;
}>;

export class LocalWsSessionRegistry {
  private readonly connections = new Map<string, SdkGatewayConnection>();
  private readonly limits: SdkGatewayLimits;
  private readonly now: () => Date;
  private readonly validateWire: LocalWsSessionRegistryDeps["validateWire"];
  private readonly getIdentity: () => SdkGatewayIdentity | null;
  private readonly onLog: SdkGatewayLogFn | undefined;

  constructor(deps: LocalWsSessionRegistryDeps) {
    this.limits = deps.limits;
    this.now = deps.now;
    this.validateWire = deps.validateWire;
    this.getIdentity = deps.getIdentity;
    this.onLog = deps.onLog;
  }

  get size(): number {
    return this.connections.size;
  }

  attach(socket: SdkGatewaySocket): void {
    const id = createSdkOpaqueId("conn");
    const connection = createSdkGatewayConnection(
      id,
      socket,
      this.now().getTime(),
    );
    this.connections.set(id, connection);
    this.log("sdk_gateway_connection_opened", {
      connectionCount: this.connections.size,
    });

    connection.handshakeTimer = setTimeout(() => {
      this.closeConnection(connection, "handshake_timeout");
    }, this.limits.handshakeTimeoutMs);
    this.armIdleTimer(connection);

    socket.on("message", (data, isBinary) => {
      this.onSocketMessage(connection, data, isBinary);
    });
    socket.on("pong", () => {
      connection.awaitingPong = false;
      connection.lastActivityMs = this.now().getTime();
      this.armIdleTimer(connection);
    });
    socket.on("close", () => {
      this.removeConnection(connection);
    });
    socket.on("error", () => {
      this.closeConnection(connection, "socket_error");
    });
  }

  terminateAll(): void {
    for (const connection of [...this.connections.values()]) {
      clearSdkGatewayConnectionTimers(connection);
      try {
        connection.socket.terminate();
      } catch {
        // ignore
      }
    }
    this.connections.clear();
  }

  private onSocketMessage(
    connection: SdkGatewayConnection,
    data: RawData,
    isBinary: boolean,
  ): void {
    if (isBinary) {
      this.closeConnection(connection, "binary_frame");
      return;
    }
    const text = rawDataToString(data);
    if (Buffer.byteLength(text, "utf8") > this.limits.maxMessageBytes) {
      this.closeConnection(connection, "oversized_frame");
      return;
    }
    if (
      !recordInboundAndCheckRate(connection, this.now().getTime(), this.limits)
    ) {
      this.log("sdk_gateway_rate_limited", {
        connectionCount: this.connections.size,
      });
      this.closeConnection(connection, "rate_limited");
      return;
    }
    this.armIdleTimer(connection);
    this.parseAndDispatch(connection, text);
  }

  private parseAndDispatch(
    connection: SdkGatewayConnection,
    text: string,
  ): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      this.closeConnection(connection, "invalid_json");
      return;
    }
    const validated = this.validateWire(parsed);
    if (!validated.success) {
      this.closeConnection(connection, validated.code);
      return;
    }
    this.dispatchValidated(connection, validated.data);
  }

  private dispatchValidated(
    connection: SdkGatewayConnection,
    message: WireMessage,
  ): void {
    const route = routeUnauthenticatedInbound(
      message,
      connection.handshakeComplete,
    );
    if (route.action === "server_hello") {
      this.completeHandshake(connection);
      return;
    }
    if (route.action === "command_deny") {
      const identity = this.getIdentity();
      if (identity === null) {
        this.closeConnection(connection, "not_ready");
        return;
      }
      this.sendJson(
        connection,
        buildCommandFailureReply({
          requestId: route.requestId,
          commandType: route.commandType,
          code: route.code,
          identity,
          now: this.now,
        }),
      );
      return;
    }
    this.closeConnection(connection, route.code);
  }

  private completeHandshake(connection: SdkGatewayConnection): void {
    const identity = this.getIdentity();
    if (identity === null) {
      this.closeConnection(connection, "not_ready");
      return;
    }
    if (connection.handshakeTimer !== null) {
      clearTimeout(connection.handshakeTimer);
      connection.handshakeTimer = null;
    }
    connection.handshakeComplete = true;
    this.sendJson(connection, buildServerHello(identity, this.now));
    this.startHeartbeat(connection);
    this.log("sdk_gateway_handshake_ok", {
      connectionCount: this.connections.size,
    });
  }

  private sendJson(connection: SdkGatewayConnection, message: WireMessage): void {
    if (connection.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    if (connection.outboundQueueDepth >= this.limits.maxOutboundQueue) {
      this.closeConnection(connection, "outbound_queue_full");
      return;
    }
    connection.outboundQueueDepth += 1;
    connection.socket.send(JSON.stringify(message), (error) => {
      connection.outboundQueueDepth = Math.max(
        0,
        connection.outboundQueueDepth - 1,
      );
      if (error !== undefined && error !== null) {
        this.closeConnection(connection, "send_failed");
      }
    });
  }

  private startHeartbeat(connection: SdkGatewayConnection): void {
    const intervalMs = this.limits.heartbeatSeconds * 1000;
    connection.heartbeatTimer = setInterval(() => {
      if (connection.awaitingPong) {
        this.closeConnection(connection, "heartbeat_missed");
        return;
      }
      if (connection.socket.readyState !== WebSocket.OPEN) {
        return;
      }
      connection.awaitingPong = true;
      connection.socket.ping();
    }, intervalMs);
  }

  private armIdleTimer(connection: SdkGatewayConnection): void {
    if (connection.idleTimer !== null) {
      clearTimeout(connection.idleTimer);
    }
    connection.idleTimer = setTimeout(() => {
      this.closeConnection(connection, "unauth_idle_timeout");
    }, this.limits.unauthIdleMs);
  }

  private closeConnection(
    connection: SdkGatewayConnection,
    reason: string,
  ): void {
    this.log("sdk_gateway_connection_closed", {
      reason,
      connectionCount: Math.max(0, this.connections.size - 1),
    });
    clearSdkGatewayConnectionTimers(connection);
    this.connections.delete(connection.id);
    if (
      connection.socket.readyState === WebSocket.OPEN ||
      connection.socket.readyState === WebSocket.CONNECTING
    ) {
      connection.socket.close(1008, reason.slice(0, 120));
    }
  }

  private removeConnection(connection: SdkGatewayConnection): void {
    clearSdkGatewayConnectionTimers(connection);
    this.connections.delete(connection.id);
  }

  private log(
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ): void {
    this.onLog?.(event, fields);
  }
}
