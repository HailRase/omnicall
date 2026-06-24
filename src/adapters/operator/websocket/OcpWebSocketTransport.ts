import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { Logger } from "@ports/index.js";

export type OcpWebSocketFactory = (url: string) => OcpWebSocketPort;

export type OcpWebSocketPort = Readonly<{
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(
    type: "open" | "message" | "close" | "error",
    listener: (event: OcpWebSocketEvent) => void,
  ): void;
  removeEventListener(
    type: "open" | "message" | "close" | "error",
    listener: (event: OcpWebSocketEvent) => void,
  ): void;
}>;

export type OcpWebSocketEvent = Readonly<{
  type: string;
  data?: string;
  code?: number;
  reason?: string;
}>;

export const OCP_WS_OPEN = 1;

export type OcpWebSocketTransportOptions = Readonly<{
  wsUrl: string;
  logger: Logger;
  createWebSocket?: OcpWebSocketFactory;
  requestTimeoutMs?: number;
}>;

export type OcpInboundPushHandler = (
  raw: unknown,
  correlationId: CorrelationId,
) => void;

export type OcpTransportDisconnectHandler = (
  correlationId: CorrelationId,
  reason: string,
) => void;

/**
 * - Purpose: shared OCP WebSocket transport for operator and sync gateways.
 * - Inputs: ws URL, request payloads, inbound/disconnect handlers.
 * - Outputs: correlated responses, push forwarding, disconnect notifications.
 */
export class OcpWebSocketTransport {
  private readonly wsUrl: string;
  private readonly logger: Logger;
  private readonly createWebSocket: OcpWebSocketFactory;
  private readonly requestTimeoutMs: number;
  private socket: OcpWebSocketPort | null = null;
  private connectPromise: Promise<void> | null = null;
  private intentionalClose = false;
  private requestCounter = 0;
  private readonly pendingRequests = new Map<
    string,
    {
      resolve: (value: Record<string, unknown>) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
      correlationId: CorrelationId;
    }
  >();
  private inboundHandler: OcpInboundPushHandler | null = null;
  private disconnectHandler: OcpTransportDisconnectHandler | null = null;
  private lastCorrelationId: CorrelationId | null = null;

  constructor(options: OcpWebSocketTransportOptions) {
    this.wsUrl = options.wsUrl;
    this.logger = options.logger;
    this.createWebSocket = options.createWebSocket ?? createBrowserWebSocket;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 15_000;
  }

  setInboundHandler(handler: OcpInboundPushHandler | null): void {
    this.inboundHandler = handler;
  }

  setDisconnectHandler(handler: OcpTransportDisconnectHandler | null): void {
    this.disconnectHandler = handler;
  }

  isConnected(): boolean {
    return this.socket?.readyState === OCP_WS_OPEN;
  }

  async connect(correlationId: CorrelationId): Promise<void> {
    this.lastCorrelationId = correlationId;
    if (this.isConnected()) {
      return;
    }
    if (this.connectPromise !== null) {
      return this.connectPromise;
    }

    this.intentionalClose = false;
    this.connectPromise = this.openSocket(correlationId).finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  async request(
    event: string,
    payload: Record<string, unknown>,
    correlationId: CorrelationId,
  ): Promise<Record<string, unknown>> {
    this.lastCorrelationId = correlationId;
    await this.connect(correlationId);

    const requestId = this.nextRequestId();
    const message = { event, request_id: requestId, ...payload };

    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`OCP request timed out: ${event}`));
      }, this.requestTimeoutMs);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
        correlationId,
      });

      this.sendJson(message, correlationId, event);
    });
  }

  send(
    event: string,
    payload: Record<string, unknown>,
    correlationId: CorrelationId,
  ): void {
    this.lastCorrelationId = correlationId;
    void this.connect(correlationId).then(() => {
      this.sendJson({ event, ...payload }, correlationId, event);
    });
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.rejectAllPending("transport_closed");
    this.socket?.close(1000, "client_disconnect");
    this.socket = null;
  }

  private async openSocket(correlationId: CorrelationId): Promise<void> {
    const socket = this.createWebSocket(this.wsUrl);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const onOpen = (): void => {
        cleanup();
        this.logger.info("ocp_ws_connected", {
          correlationId,
          featureId: "F-009",
          boundedContext: "Operator",
          operation: "ocp_ws_connect",
          result: "succeeded",
        });
        resolve();
      };

      const onError = (): void => {
        cleanup();
        reject(new Error("OCP WebSocket connection failed"));
      };

      const onClose = (event: OcpWebSocketEvent): void => {
        if (socket.readyState !== OCP_WS_OPEN) {
          cleanup();
          reject(new Error(event.reason ?? "OCP WebSocket closed before open"));
        }
      };

      const cleanup = (): void => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("error", onError);
        socket.removeEventListener("close", onClose);
      };

      socket.addEventListener("open", onOpen);
      socket.addEventListener("error", onError);
      socket.addEventListener("close", onClose);
    });

    socket.addEventListener("message", (event) => {
      this.handleMessage(event, correlationId);
    });

    socket.addEventListener("close", (event) => {
      this.handleClose(event, correlationId);
    });
  }

  private handleMessage(event: OcpWebSocketEvent, fallbackCorrelationId: CorrelationId): void {
    const raw = parseJsonMessage(event.data);
    if (raw === null) {
      return;
    }

    const requestId = readRequestId(raw);
    if (requestId !== null) {
      const pending = this.pendingRequests.get(requestId);
      if (pending !== undefined) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(requestId);
        pending.resolve(raw);
        return;
      }
    }

    const correlationId = this.lastCorrelationId ?? fallbackCorrelationId;
    this.inboundHandler?.(raw, correlationId);
  }

  private handleClose(event: OcpWebSocketEvent, correlationId: CorrelationId): void {
    this.socket = null;
    this.rejectAllPending(event.reason ?? "transport_closed");

    if (this.intentionalClose) {
      return;
    }

    const reason = event.reason ?? "transport_closed";
    this.logger.warn("ocp_ws_disconnected", {
      correlationId,
      featureId: "F-009",
      boundedContext: "Operator",
      operation: "ocp_ws_disconnect",
      result: reason,
      code: event.code,
    });
    this.disconnectHandler?.(correlationId, reason);
  }

  private sendJson(
    payload: Record<string, unknown>,
    correlationId: CorrelationId,
    operation: string,
  ): void {
    if (this.socket === null || !this.isConnected()) {
      throw new Error(`OCP WebSocket not connected for ${operation}`);
    }

    this.socket.send(JSON.stringify(payload));
    this.logger.info("ocp_ws_outbound", {
      correlationId,
      featureId: "F-009",
      boundedContext: "Operator",
      operation,
      result: "sent",
    });
  }

  private rejectAllPending(reason: string): void {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  private nextRequestId(): string {
    this.requestCounter += 1;
    return `ocp-req-${this.requestCounter}`;
  }
}

function createBrowserWebSocket(url: string): OcpWebSocketPort {
  const socket = new WebSocket(url);
  return {
    readyState: socket.readyState,
    send: (data) => {
      socket.send(data);
    },
    close: (code, reason) => {
      socket.close(code, reason);
    },
    addEventListener: (type, listener) => {
      socket.addEventListener(type, listener as EventListener);
    },
    removeEventListener: (type, listener) => {
      socket.removeEventListener(type, listener as EventListener);
    },
  };
}

function parseJsonMessage(data: string | undefined): Record<string, unknown> | null {
  if (typeof data !== "string" || data.length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function readRequestId(record: Record<string, unknown>): string | null {
  const value = record["request_id"] ?? record["requestId"];
  return typeof value === "string" && value.length > 0 ? value : null;
}
