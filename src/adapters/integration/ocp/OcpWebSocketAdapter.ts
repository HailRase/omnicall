/**
 * - Purpose: real OCP WebSocket transport implementing OcpGateway (transport-only).
 * - Inputs: OcpConnectionConfig, OcpCommand, lifecycle callbacks.
 * - Outputs: server/transport state changes and parsed OcpIncomingMessage events.
 *
 * ADR-AF-002: no scheduled reconnect with retained authToken; no auto-auth on open;
 * Application owns fresh-token recovery and auth send.
 */

import type { OcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { Logger } from "@ports/logging/Logger.js";
import type {
  OcpGateway,
  OcpGatewayMessageEnvelope,
  Unsubscribe,
} from "@ports/integration/OcpGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { buildOcpCommandPayload } from "./buildOcpCommandPayload.js";
import { parseOcpMessage } from "./parseOcpMessage.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeParseJsonRecord(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type WebSocketFactory = (url: string) => WebSocket;

export type OcpWebSocketAdapterDeps = Readonly<{
  logger: Logger;
  webSocketFactory?: WebSocketFactory;
}>;

export class OcpWebSocketAdapter implements OcpGateway {
  private readonly logger: Logger;
  private readonly webSocketFactory: WebSocketFactory;
  private readonly messageHandlers = new Set<(msg: OcpIncomingMessage) => void>();
  private readonly envelopeHandlers = new Set<
    (envelope: OcpGatewayMessageEnvelope) => void
  >();
  private readonly stateHandlers = new Set<(state: OcpServerState) => void>();

  private ws: WebSocket | null = null;
  /** Hostname only — ephemeral token is never retained for reconnect. */
  private domain: string | null = null;
  private connectionState: OcpServerState = "disconnected";
  private manualDisconnect = false;
  private disposed = false;
  private socketEpoch = 0;

  constructor(deps: OcpWebSocketAdapterDeps) {
    this.logger = deps.logger.child({
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
    });
    this.webSocketFactory =
      deps.webSocketFactory ?? ((url: string) => new WebSocket(url));
  }

  connect(config: OcpConnectionConfig): void {
    if (this.disposed) {
      return;
    }
    this.domain = config.domain;
    this.manualDisconnect = false;
    this.createWebSocket();
  }

  disconnect(reason?: "logout" | "error" | "terminate"): void {
    this.manualDisconnect = true;
    this.closeWebSocket();
    if (reason === "error") {
      this.setConnectionState("failed");
      return;
    }
    // terminate/logout: transport closes to disconnected; Application maps terminal auth.
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

  getConnectionState(): OcpServerState {
    return this.connectionState;
  }

  onConnectionStateChange(handler: (state: OcpServerState) => void): Unsubscribe {
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

  onMessageEnvelope(
    handler: (envelope: OcpGatewayMessageEnvelope) => void,
  ): Unsubscribe {
    this.envelopeHandlers.add(handler);
    return () => {
      this.envelopeHandlers.delete(handler);
    };
  }

  getSocketEpoch(): number {
    return this.socketEpoch;
  }

  dispose(): void {
    this.disposed = true;
    this.manualDisconnect = true;
    this.closeWebSocket();
    this.messageHandlers.clear();
    this.envelopeHandlers.clear();
    this.stateHandlers.clear();
    this.domain = null;
    this.setConnectionState("disconnected");
  }

  private createWebSocket(): void {
    if (this.disposed || this.domain === null) {
      return;
    }
    this.closeWebSocket();
    this.setConnectionState("connecting");
    const url = `wss://${this.domain}/ws`;
    const socket = this.webSocketFactory(url);
    this.socketEpoch += 1;
    const socketEpoch = this.socketEpoch;
    this.ws = socket;
    socket.onopen = () => {
      if (this.ws === socket) {
        this.handleOpen();
      }
    };
    socket.onmessage = (event: MessageEvent<string>) => {
      if (this.ws === socket) {
        this.handleMessage(event.data, socketEpoch);
      }
    };
    socket.onclose = () => {
      if (this.ws === socket) {
        this.handleClose();
      }
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
    this.setConnectionState("connected");
    // Auth is Application-owned — do not send retained token here.
  }

  private handleMessage(raw: unknown, socketEpoch: number): void {
    const parsed = parseOcpMessage(raw);
    if (!parsed.ok) {
      const envelope =
        typeof raw === "string"
          ? safeParseJsonRecord(raw)
          : isRecord(raw)
            ? raw
            : null;
      const entity =
        envelope !== null && typeof envelope["entity"] === "string"
          ? envelope["entity"]
          : "unknown";
      if (parsed.error === "unknown_entity") {
        this.logger.debug("OcpWS unknown entity", {
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_websocket_parse",
          entity,
        });
      } else {
        this.logger.warn("OcpWS message parse failed", {
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_websocket_parse",
          entity,
          result: parsed.error,
        });
      }
      return;
    }

    const message = parsed.value;
    if (message.entity === "Error") {
      if (
        message.data.code === "SESSION_EXIST" ||
        message.data.code === "INVALID_TOKEN"
      ) {
        // Close transport; do not schedule reconnect. Application classifies recovery.
        this.manualDisconnect = true;
        this.dispatchMessage(message, socketEpoch);
        this.closeWebSocket();
        this.setConnectionState("failed");
        return;
      }
    }

    this.dispatchMessage(message, socketEpoch);
  }

  private handleClose(): void {
    this.ws = null;
    if (this.disposed || this.manualDisconnect) {
      return;
    }
    // Unexpected drop — Application owns fresh-token recovery (no adapter reconnect).
    this.setConnectionState("failed");
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

  private dispatchMessage(
    message: OcpIncomingMessage,
    socketEpoch: number,
  ): void {
    for (const handler of this.messageHandlers) {
      handler(message);
    }
    for (const handler of this.envelopeHandlers) {
      handler({ socketEpoch, message });
    }
  }

  private setConnectionState(nextState: OcpServerState): void {
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
