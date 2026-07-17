import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { OcpWebSocketAdapter } from "./OcpWebSocketAdapter.js";

type TestWebSocket = WebSocket & {
  readonly url: string;
  readonly sent: string[];
  simulateOpen(): void;
  simulateMessage(data: unknown): void;
  simulateClose(): void;
};

function createTestWebSocketClass(): {
  WebSocket: typeof WebSocket;
  instances: TestWebSocket[];
} {
  const instances: TestWebSocket[] = [];

  class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly url: string;
    readonly sent: string[] = [];
    readyState = MockWebSocket.CONNECTING;
    onopen: (() => void) | null = null;
    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor(url: string) {
      this.url = url;
      instances.push(this as unknown as TestWebSocket);
    }

    send(data: string): void {
      this.sent.push(data);
    }

    close(): void {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.();
    }

    simulateOpen(): void {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }

    simulateMessage(data: unknown): void {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      this.onmessage?.({ data: payload } as MessageEvent<string>);
    }

    simulateClose(): void {
      this.close();
    }
  }

  return {
    WebSocket: MockWebSocket as unknown as typeof WebSocket,
    instances,
  };
}

describe("OcpWebSocketAdapter", () => {
  let instances: TestWebSocket[] = [];
  let adapter: OcpWebSocketAdapter;
  const stateChanges: OcpServerState[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    const socketHarness = createTestWebSocketClass();
    instances = socketHarness.instances;
    vi.stubGlobal("WebSocket", socketHarness.WebSocket);
    stateChanges.length = 0;

    adapter = new OcpWebSocketAdapter({
      logger: createTestLogger({ featureId: "F-028", boundedContext: "Integration" }),
      webSocketFactory: (url) => new WebSocket(url),
    });
    adapter.onConnectionStateChange((state) => {
      stateChanges.push(state);
    });
  });

  afterEach(() => {
    adapter.dispose();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("connect creates WebSocket with correct URL", () => {
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    expect(instances).toHaveLength(1);
    expect(instances[0]?.url).toBe("wss://ocp.example.com/ws");
  });

  it("onopen does not send auth — Application owns auth command", () => {
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    instances[0]?.simulateOpen();

    expect(adapter.getConnectionState()).toBe("connected");
    expect(instances[0]?.sent).toHaveLength(0);
  });

  it("SESSION_EXIST closes transport as failed and does not reconnect", () => {
    const messages: unknown[] = [];
    adapter.onMessage((msg) => {
      messages.push(msg);
    });
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    instances[0]?.simulateOpen();
    instances[0]?.simulateMessage({
      entity: "Error",
      payload: { code: "SESSION_EXIST" },
    });

    vi.advanceTimersByTime(30000);
    expect(adapter.getConnectionState()).toBe("failed");
    expect(instances).toHaveLength(1);
    expect(messages).toHaveLength(1);
  });

  it("disconnect(terminate) sets disconnected and does not reconnect", () => {
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    instances[0]?.simulateOpen();
    adapter.disconnect("terminate");

    vi.advanceTimersByTime(30000);
    expect(adapter.getConnectionState()).toBe("disconnected");
    expect(instances).toHaveLength(1);
  });

  it("unexpected close sets failed and does not schedule stale-token reconnect", () => {
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    instances[0]?.simulateOpen();
    instances[0]?.simulateClose();

    expect(adapter.getConnectionState()).toBe("failed");
    vi.advanceTimersByTime(30000);
    expect(instances).toHaveLength(1);
    expect(stateChanges).not.toContain("reconnecting");
  });

  it("dispose detaches handlers and does not open new sockets", () => {
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    instances[0]?.simulateOpen();
    adapter.dispose();

    vi.advanceTimersByTime(30000);
    expect(instances).toHaveLength(1);
    expect(adapter.getConnectionState()).toBe("disconnected");
  });

  it("sendCommand returns err when socket is not OPEN", () => {
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    const result = adapter.sendCommand({
      kind: "change_status_to_ready",
      operatorId: 1,
      reasonId: 2,
      callType: "internal",
    });

    expect(result.ok).toBe(false);
  });

  it("sendCommand auth succeeds when open; users does not change transport state", () => {
    adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
    instances[0]?.simulateOpen();
    const sendResult = adapter.sendCommand({ kind: "auth", token: "fresh-token" });
    expect(sendResult.ok).toBe(true);

    instances[0]?.simulateMessage({
      entity: "users",
      payload: [
        {
          id: 7,
          status: { value: OperatorStatus.READY, reason_id: 0 },
          status_time: "2026-07-13T10:00:00.000Z",
        },
      ],
    });

    expect(adapter.getConnectionState()).toBe("connected");
  });
});
