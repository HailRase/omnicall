import { describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isOk } from "@shared/result/index.js";
import { OcpWebSocketTransport } from "./OcpWebSocketTransport.js";
import { WebSocketOperatorPlatformGateway } from "./WebSocketOperatorPlatformGateway.js";
import {
  createMockOcpWebSocketFactory,
  parseLastSent,
  type MockOcpWebSocket,
} from "./test/MockOcpWebSocket.js";

describe("WebSocketOperatorPlatformGateway", () => {
  it("authenticates and caches agent status and break reasons", async () => {
    const socketRef = { current: null as MockOcpWebSocket | null };
    const transport = new OcpWebSocketTransport({
      wsUrl: "wss://ocp.example/ws/",
      logger: createTestLogger(),
      createWebSocket: createMockOcpWebSocketFactory(socketRef),
      requestTimeoutMs: 2_000,
    });

    const gateway = new WebSocketOperatorPlatformGateway({
      transport,
      logger: createTestLogger(),
    });

    const correlationId = createCorrelationId();
    const authPromise = gateway.authenticate({
      token: "token-1",
      domain: "ocp.example",
      correlationId,
    });

    await vi.waitFor(() => {
      expect(socketRef.current?.sent.length).toBeGreaterThan(0);
    });

    const request = parseLastSent(socketRef.current as MockOcpWebSocket);
    expect(request["event"]).toBe("auth");

    socketRef.current?.simulateMessage({
      event: "auth_success",
      request_id: request["request_id"],
      agent_id: "agent-1",
      sip_username: "200",
      sip_password: "secret",
      sip_domain: "pbx.example",
      sip_server: "wss://pbx.example/ws",
      status: "ready",
      break_reasons: ["break"],
    });

    const authResult = await authPromise;
    expect(authResult.status).toBe("succeeded");
    expect(await gateway.getAgentStatus({ correlationId })).toBe("ready");
    expect(await gateway.getBreakReasons({ correlationId })).toHaveLength(1);
  });

  it("maps auth failure SESSION_EXIST", async () => {
    const socketRef = { current: null as MockOcpWebSocket | null };
    const transport = new OcpWebSocketTransport({
      wsUrl: "wss://ocp.example/ws/",
      logger: createTestLogger(),
      createWebSocket: createMockOcpWebSocketFactory(socketRef),
      requestTimeoutMs: 2_000,
    });
    const gateway = new WebSocketOperatorPlatformGateway({
      transport,
      logger: createTestLogger(),
    });

    const correlationId = createCorrelationId();
    const authPromise = gateway.authenticate({
      token: "bad",
      domain: "ocp.example",
      correlationId,
    });

    await vi.waitFor(() => expect(socketRef.current?.sent.length).toBe(1));
    const request = parseLastSent(socketRef.current as MockOcpWebSocket);

    socketRef.current?.simulateMessage({
      event: "SESSION_EXIST",
      request_id: request["request_id"],
      message: "session exists",
    });

    const result = await authPromise;
    expect(result).toEqual({
      status: "failed",
      reason: "session_exists",
      message: "session exists",
    });
  });

  it("changeAgentStatus confirms before returning success", async () => {
    const socketRef = { current: null as MockOcpWebSocket | null };
    const transport = new OcpWebSocketTransport({
      wsUrl: "wss://ocp.example/ws/",
      logger: createTestLogger(),
      createWebSocket: createMockOcpWebSocketFactory(socketRef),
      requestTimeoutMs: 2_000,
    });
    const gateway = new WebSocketOperatorPlatformGateway({
      transport,
      logger: createTestLogger(),
    });

    const correlationId = createCorrelationId();
    const changePromise = gateway.changeAgentStatus({
      targetStatus: "break",
      reason: null,
      correlationId,
    });

    await vi.waitFor(() => expect(socketRef.current?.sent.length).toBe(1));
    const request = parseLastSent(socketRef.current as MockOcpWebSocket);
    expect(request["event"]).toBe("change_status");

    socketRef.current?.simulateMessage({
      event: "status_change_result",
      request_id: request["request_id"],
      success: true,
      status: "break",
    });

    const result = await changePromise;
    expect(result).toEqual({ status: "succeeded", currentStatus: "break" });
  });

  it("fires transport disconnect handler on socket close", async () => {
    const socketRef = { current: null as MockOcpWebSocket | null };
    const transport = new OcpWebSocketTransport({
      wsUrl: "wss://ocp.example/ws/",
      logger: createTestLogger(),
      createWebSocket: createMockOcpWebSocketFactory(socketRef),
    });
    const gateway = new WebSocketOperatorPlatformGateway({
      transport,
      logger: createTestLogger(),
    });

    const correlationId = createCorrelationId();
    const notifications: string[] = [];
    gateway.setTransportDisconnectedHandler((notification) => {
      notifications.push(notification.reason);
      return Promise.resolve();
    });

    await transport.connect(correlationId);
    socketRef.current?.simulateDisconnect("network_lost");

    await vi.waitFor(() => expect(notifications).toEqual(["network_lost"]));
  });

  it("reconnectTransport re-authenticates stored session", async () => {
    const socketRef = { current: null as MockOcpWebSocket | null };
    const transport = new OcpWebSocketTransport({
      wsUrl: "wss://ocp.example/ws/",
      logger: createTestLogger(),
      createWebSocket: createMockOcpWebSocketFactory(socketRef),
      requestTimeoutMs: 2_000,
    });
    const gateway = new WebSocketOperatorPlatformGateway({
      transport,
      logger: createTestLogger(),
    });

    const correlationId = createCorrelationId();
    const authPromise = gateway.authenticate({
      token: "token-1",
      domain: "ocp.example",
      correlationId,
    });

    await vi.waitFor(() => expect(socketRef.current?.sent.length).toBe(1));
    const authRequest = parseLastSent(socketRef.current as MockOcpWebSocket);
    socketRef.current?.simulateMessage({
      event: "auth_success",
      request_id: authRequest["request_id"],
      agent_id: "agent-1",
      sip_username: "200",
      sip_password: "secret",
      sip_domain: "pbx.example",
      sip_server: "wss://pbx.example/ws",
    });
    await authPromise;

    const reconnectPromise = gateway.reconnectTransport(createCorrelationId());
    await vi.waitFor(() => expect(socketRef.current?.sent.length).toBe(2));
    const reconnectRequest = parseLastSent(socketRef.current as MockOcpWebSocket);
    socketRef.current?.simulateMessage({
      event: "auth_success",
      request_id: reconnectRequest["request_id"],
      agent_id: "agent-1",
      sip_username: "200",
      sip_password: "secret",
      sip_domain: "pbx.example",
      sip_server: "wss://pbx.example/ws",
    });

    const reconnectResult = await reconnectPromise;
    expect(isOk(reconnectResult)).toBe(true);
  });
});
