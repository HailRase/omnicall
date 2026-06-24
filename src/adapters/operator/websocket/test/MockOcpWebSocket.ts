import type {
  OcpWebSocketEvent,
  OcpWebSocketFactory,
  OcpWebSocketPort,
} from "../OcpWebSocketTransport.js";
import { OCP_WS_OPEN } from "../OcpWebSocketTransport.js";

type Listener = (event: OcpWebSocketEvent) => void;

export class MockOcpWebSocket implements OcpWebSocketPort {
  private readonly listeners = new Map<string, Set<Listener>>();
  readonly sent: string[] = [];
  readyState = 0;

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit("close", { type: "close", code: 1000, reason: "closed" });
  }

  addEventListener(type: "open" | "message" | "close" | "error", listener: Listener): void {
    const bucket = this.listeners.get(type) ?? new Set<Listener>();
    bucket.add(listener);
    this.listeners.set(type, bucket);
  }

  removeEventListener(type: "open" | "message" | "close" | "error", listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  simulateOpen(): void {
    this.readyState = OCP_WS_OPEN;
    this.emit("open", { type: "open" });
  }

  simulateMessage(payload: Record<string, unknown>): void {
    this.emit("message", { type: "message", data: JSON.stringify(payload) });
  }

  simulateDisconnect(reason = "transport_closed"): void {
    this.readyState = 3;
    this.emit("close", { type: "close", code: 1006, reason });
  }

  private emit(type: string, event: OcpWebSocketEvent): void {
    const bucket = this.listeners.get(type);
    if (bucket === undefined) {
      return;
    }
    for (const listener of bucket) {
      listener(event);
    }
  }
}

export function createMockOcpWebSocketFactory(
  socketRef: { current: MockOcpWebSocket | null },
): OcpWebSocketFactory {
  return () => {
    const socket = new MockOcpWebSocket();
    socketRef.current = socket;
    queueMicrotask(() => {
      socket.simulateOpen();
    });
    return socket;
  };
}

export function parseLastSent(socket: MockOcpWebSocket): Record<string, unknown> {
  const raw = socket.sent.at(-1);
  if (raw === undefined) {
    throw new Error("No WebSocket payload sent");
  }
  return JSON.parse(raw) as Record<string, unknown>;
}
