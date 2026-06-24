import { describe, expect, it, vi } from "vitest";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { OcpWebSocketTransport } from "./OcpWebSocketTransport.js";
import { WebSocketOcpSyncGateway } from "./WebSocketOcpSyncGateway.js";
import {
  createMockOcpWebSocketFactory,
  parseLastSent,
  type MockOcpWebSocket,
} from "./test/MockOcpWebSocket.js";

describe("WebSocketOcpSyncGateway", () => {
  it("parses inbound queue_info via domain parser", () => {
    const gateway = new WebSocketOcpSyncGateway({
      transport: new OcpWebSocketTransport({
        wsUrl: "wss://ocp.example/ws/",
        logger: createTestLogger(),
      }),
    });

    const parsed = gateway.parseInboundMessage({
      event: "queue_info",
      main_acallid: "acall-1",
      queue_name: "Support",
    });

    expect(parsed).toEqual({
      kind: "queue_info",
      mainAcallId: "acall-1",
      queueName: "Support",
    });
  });

  it("respondToCampaign sends campaign_respond and confirms success", async () => {
    const socketRef = { current: null as MockOcpWebSocket | null };
    const transport = new OcpWebSocketTransport({
      wsUrl: "wss://ocp.example/ws/",
      logger: createTestLogger(),
      createWebSocket: createMockOcpWebSocketFactory(socketRef),
      requestTimeoutMs: 2_000,
    });
    const gateway = new WebSocketOcpSyncGateway({ transport });
    const correlationId = createCorrelationId();

    const respondPromise = gateway.respondToCampaign({
      campaignId: "camp-1",
      decision: "accept",
      correlationId,
    });

    await vi.waitFor(() => expect(socketRef.current?.sent.length).toBe(1));
    const request = parseLastSent(socketRef.current as MockOcpWebSocket);
    expect(request["event"]).toBe("campaign_respond");

    socketRef.current?.simulateMessage({
      event: "campaign_respond_result",
      request_id: request["request_id"],
      success: true,
    });

    const result = await respondPromise;
    expect(result).toEqual({ status: "succeeded" });
  });

  it("sendDlgStop sends dlg_stop payload", async () => {
    const socketRef = { current: null as MockOcpWebSocket | null };
    const transport = new OcpWebSocketTransport({
      wsUrl: "wss://ocp.example/ws/",
      logger: createTestLogger(),
      createWebSocket: createMockOcpWebSocketFactory(socketRef),
      requestTimeoutMs: 2_000,
    });
    const gateway = new WebSocketOcpSyncGateway({ transport });
    const correlationId = createCorrelationId();

    const dlgPromise = gateway.sendDlgStop({
      callId: createCallId("call-1"),
      mainAcallId: createMainAcallId("acall-1"),
      correlationId,
    });

    await vi.waitFor(() => expect(socketRef.current?.sent.length).toBe(1));
    const request = parseLastSent(socketRef.current as MockOcpWebSocket);
    expect(request["event"]).toBe("dlg_stop");
    expect(request["main_acallid"]).toBe("acall-1");

    socketRef.current?.simulateMessage({
      event: "dlg_stop_result",
      request_id: request["request_id"],
      success: true,
    });

    const result = await dlgPromise;
    expect(result).toEqual({ status: "succeeded" });
  });
});
