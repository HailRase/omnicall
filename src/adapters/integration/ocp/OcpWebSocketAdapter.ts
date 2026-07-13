/**
 * - Purpose: real OCP WebSocket transport implementing OcpGateway port.
 * - Inputs: OcpConnectionConfig, OcpCommand, lifecycle callbacks.
 * - Outputs: connection state changes and parsed OcpIncomingMessage events.
 */

import type { OcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import { ReconnectScheduler } from "@shared/scheduling/ReconnectScheduler.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { OcpGateway, Unsubscribe } from "@ports/integration/OcpGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { buildOcpCommandPayload } from "./buildOcpCommandPayload.js";
import { parseOcpMessage } from "./parseOcpMessage.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";
const DEFAULT_RECONNECT_DELAY_MS = 5000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 6;

export type WebSocketFactory = (url: string) => WebSocket;

export type OcpWebSocketAdapterDeps = Readonly<{
  logger: Logger;
  webSocketFactory?: WebSocketFactory;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
}>;

export class OcpWebSocketAdapter implements OcpGateway {
  private readonly logger: Logger;
  private readonly webSocketFactory: WebSocketFactory;
  private readonly reconnectDelayMs: number;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectScheduler: ReconnectScheduler;
  private readonly messageHandlers = new Set<(msg: OcpIncomingMessage) => void>();
  private readonly stateHandlers = new Set<(state: OcpConnectionState) => void>();

  private ws: WebSocket | null = null;
  private config: OcpConnectionConfig | null = null;
  private connectionState: OcpConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private hasAuthenticated = false;
  private manualDisconnect = false;
  private disposed = false;

  constructor(deps: OcpWebSocketAdapterDeps) {
    this.logger = deps.logger.child({
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
    });
    this.webSocketFactory =
      deps.webSocketFactory ??
      ((url: string) => new WebSocket(url));
    this.reconnectDelayMs = deps.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
    this.maxReconnectAttempts =
      deps.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
    this.reconnectScheduler = new ReconnectScheduler();
  }

  connect(config: OcpConnectionConfig): void {
    if (this.disposed) {
      return;
    }
    this.config = config;
    this.manualDisconnect = false;
    this.hasAuthenticated = false;
    this.reconnectAttempts = 0;
    this.reconnectScheduler.cancelAll();
    this.createWebSocket();
  }

  disconnect(reason?: "logout" | "error"): void {
    this.manualDisconnect = true;
    this.reconnectScheduler.cancelAll();
    this.closeWebSocket();
    if (reason === "error") {
      this.setConnectionState("failed");
      return;
    }
    this.setConnectionState("disconnected");
  }

  sendCommand(cmd: OcpCommand): Result<void, PlatformError> {
    const payloadResult = buildOcpCommandPayload(cmd);
    if (!payloadResult.ok) {
      return payloadResult;
    }
    if (this.ws === null || this.ws.readyState !== WebSocket.OPEN) {
      return err(
        createPlatformError("operation_failed", "ocp_websocket_not_connected"),
      );
    }
    this.ws.send(JSON.stringify(payloadResult.value));
    return ok(undefined);
  }

  getConnectionState(): OcpConnectionState {
    return this.connectionState;
  }

  onConnectionStateChange(handler: (state: OcpConnectionState) => void): Unsubscribe {
    this.stateHandlers.add(handler);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  onMessage(handler: (msg: OcpIncomingMessage) => void): Unsubscribe {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  dispose(): void {
    this.disposed = true;
    this.manualDisconnect = true;
    this.reconnectScheduler.dispose();
    this.closeWebSocket();
    this.messageHandlers.clear();
    this.stateHandlers.clear();
    this.config = null;
    this.setConnectionState("disconnected");
  }

  private createWebSocket(): void {
    if (this.disposed || this.config === null) {
      return;
    }
    this.closeWebSocket();
    this.setConnectionState(
      this.reconnectAttempts > 0 ? "reconnecting" : "connecting",
    );
    const url = `wss://${this.config.domain}/ws`;
    const socket = this.webSocketFactory(url);
    this.ws = socket;
    socket.onopen = () => {
      this.handleOpen();
    };
    socket.onmessage = (event: MessageEvent<string>) => {
      this.handleMessage(event.data);
    };
    socket.onclose = () => {
      this.handleClose();
    };
    socket.onerror = () => {
      this.logger.error("OcpWS error", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_websocket_error",
      });
    };
  }

  private handleOpen(): void {
    if (this.config === null) {
      return;
    }
    this.reconnectAttempts = 0;
    this.setConnectionState("connected");
    const authResult = this.sendCommand({ kind: "auth", token: this.config.authToken });
    if (!authResult.ok) {
      this.logger.error("OcpWS auth send failed", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_websocket_auth",
        result: "failed",
      });
    }
  }

  private handleMessage(raw: unknown): void {
    const parsed = parseOcpMessage(raw);
    if (!parsed.ok) {
      if (parsed.error === "unknown_entity") {
        this.logger.debug("OcpWS unknown entity", {
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_websocket_parse",
        });
      }
      return;
    }

    const message = parsed.value;
    if (message.entity === "Error") {
      if (message.data.code === "SESSION_EXIST" || message.data.code === "INVALID_TOKEN") {
        this.manualDisconnect = true;
        this.reconnectScheduler.cancelAll();
        this.setConnectionState("sessionClosed");
      }
    }

    if (message.entity === "users" && !this.hasAuthenticated) {
      this.hasAuthenticated = true;
      this.setConnectionState("authenticated");
    }

    this.dispatchMessage(message);
  }

  private handleClose(): void {
    this.ws = null;
    if (this.disposed || this.manualDisconnect || this.connectionState === "sessionClosed") {
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState("failed");
      return;
    }
    this.reconnectAttempts += 1;
    this.setConnectionState("reconnecting");
    this.reconnectScheduler.schedule(this.reconnectDelayMs, () => {
      this.createWebSocket();
    });
  }

  private closeWebSocket(): void {
    if (this.ws === null) {
      return;
    }
    const socket = this.ws;
    this.ws = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
  }

  private dispatchMessage(message: OcpIncomingMessage): void {
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  private setConnectionState(nextState: OcpConnectionState): void {
    if (this.connectionState === nextState) {
      return;
    }
    const previousState = this.connectionState;
    this.connectionState = nextState;
    this.logger.info("OcpWS state change", {
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_websocket_state",
      previousState,
      nextState,
    });
    for (const handler of this.stateHandlers) {
      handler(nextState);
    }
  }
}
