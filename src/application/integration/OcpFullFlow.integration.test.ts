/**
 * - Purpose: E-13 full OCP lifecycle integration — Use Cases + projections + bridge + WS reconnect.
 * - Inputs: MockOcpGateway / OcpWebSocketAdapter with synthetic sockets.
 * - Outputs: commanded gateway payloads, updated projections, failed/sessionClosed states.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { OcpWebSocketAdapter } from "@adapters/integration/ocp/OcpWebSocketAdapter.js";
import {
  createCallEndedEvent,
  createCallId,
  createIncomingCallReceivedEvent,
  createPhoneNumber,
} from "@domain/index.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { OcpProjectionHub } from "../read-models/OcpProjectionHub.js";
import { InMemoryDndReadModel } from "../read-models/InMemoryDndReadModel.js";
import { ChangeOperatorStatusUseCase } from "../use-cases/integration/ocp/ChangeOperatorStatusUseCase.js";
import { ConnectOcpUseCase } from "../use-cases/integration/ocp/ConnectOcpUseCase.js";
import { LogoutOperatorUseCase } from "../use-cases/integration/ocp/LogoutOperatorUseCase.js";
import { OcpTelephonyBridgeService } from "../services/integration/OcpTelephonyBridgeService.js";
import { OcpSessionLifecycleService } from "../services/integration/OcpSessionLifecycleService.js";

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

describe("OcpFullFlow integration (E-13)", () => {
  describe("application lifecycle (MockOcpGateway)", () => {
    it("connect → auth → changeStatus → dlg_stop → logout", async () => {
      const gateway = new MockOcpGateway();
      const bus = new InMemoryDomainEventBus();
      const logger = createTestLogger({
        featureId: "F-028",
        boundedContext: "Integration",
      });
      const hub = new OcpProjectionHub({ ocpGateway: gateway });
      const dnd = new InMemoryDndReadModel(bus, false);
      const connectOcp = new ConnectOcpUseCase(gateway, logger);
      const changeStatus = new ChangeOperatorStatusUseCase({
        ocpGateway: gateway,
        operatorReadModel: hub,
        dndReadModel: dnd,
        logger,
        eventPublisher: bus,
        reservedStatusWriter: {
          setReservedStatus: (reservedStatus, reservedReasonId) => {
            hub.setReservedStatus(reservedStatus, reservedReasonId);
          },
        },
      });
      const logout = new LogoutOperatorUseCase({
        ocpGateway: gateway,
        operatorReadModel: hub,
        eventPublisher: bus,
        logger,
      });
      const bridge = new OcpTelephonyBridgeService({
        eventPublisher: bus,
        ocpGateway: gateway,
        isOcpAuthenticated: () => hub.getSessionProjection().isAuthenticated,
        getOcpUserLogin: () => hub.getSessionProjection().authenticatedLogin,
        logger,
        callContext: {
          markPending: (callId, direction) => {
            hub.markCallOcpContextPending(callId, direction);
          },
          resolve: (callId, input) => {
            hub.resolveCallOcpContext(callId, input);
          },
          markUnavailable: (callId) => {
            hub.markCallOcpContextUnavailable(callId);
          },
          clear: (callId) => {
            hub.clearCallOcpContext(callId);
          },
        },
        clearCampaignOnCallTerminal: () => {
          hub.clearActiveCampaign();
        },
      });

      const connectResult = await connectOcp.execute({
        domain: "ocp.example",
        authToken: "token-e13",
        correlationId: createCorrelationId(),
      });
      expect(connectResult.ok).toBe(true);
      expect(gateway.getConnectionState()).toBe("connected");

      gateway.simulateMessage({
        entity: "users",
        data: {
          operatorId: 42,
          status: OperatorStatus.READY,
          reasonId: 0,
          statusSince: "2026-07-14T12:00:00.000Z",
        },
      });
      hub.setSessionAuthenticatedLogin("op42");

      const session = hub.getSessionProjection();
      const operator = hub.getOperatorProjection();
      expect(session.isAuthenticated).toBe(true);
      expect(session.connectionState).toBe("authenticated");
      expect(session.authenticatedLogin).toBe("op42");
      expect(operator.status).toBe(OperatorStatus.READY);
      expect(operator.operatorId).toBe(42);

      gateway.clearSentCommands();
      const breakResult = await changeStatus.execute({
        targetStatus: "break",
        reasonId: 7,
        callType: "internal",
        correlationId: createCorrelationId(),
      });
      expect(breakResult.ok).toBe(true);
      expect(gateway.getLastSentCommand()).toEqual({
        kind: "change_status_to_break",
        operatorId: 42,
        reasonId: 7,
        callType: "internal",
      });

      const callId = createCallId("e13-call");
      gateway.clearSentCommands();
      bus.publish(
        createIncomingCallReceivedEvent(createCorrelationId(), {
          callId,
          phoneNumber: createPhoneNumber("+700"),
          direction: "incoming",
        }),
      );
      expect(gateway.getLastSentCommand()).toEqual({
        kind: "get_main_acallid",
        callId,
        userLogin: "op42",
        callerId: "+700",
        calledId: "op42",
        lifecycleEvent: "incomingCallProgress",
      });

      gateway.simulateMessage({
        entity: "calls",
        data: { acallId: "acall-e13", userLogin: "op42" },
      });
      gateway.clearSentCommands();
      bus.publish(createCallEndedEvent(createCorrelationId(), { callId }));
      expect(gateway.getLastSentCommand()).toEqual({
        kind: "dlg_stop",
        callId,
        acallId: "acall-e13",
      });

      gateway.clearSentCommands();
      const logoutResult = await logout.execute({
        reasonId: 3,
        callType: "internal",
        correlationId: createCorrelationId(),
      });
      expect(logoutResult.ok).toBe(true);
      expect(gateway.getSentCommands()).toEqual([
        {
          kind: "change_status_to_logout",
          operatorId: 42,
          reasonId: 3,
          callType: "internal",
        },
      ]);
      expect(gateway.getConnectionState()).toBe("disconnected");

      bridge.dispose();
      hub.dispose();
      dnd.dispose();
    });

    it("authenticate → terminate → sessionClosed + cascade events (LF-049)", async () => {
      const gateway = new MockOcpGateway();
      const bus = new InMemoryDomainEventBus();
      const published: string[] = [];
      bus.subscribe((event) => {
        published.push(event.type);
      });
      const logger = createTestLogger({
        featureId: "F-028",
        boundedContext: "Integration",
      });
      const hub = new OcpProjectionHub({ ocpGateway: gateway });
      const connectOcp = new ConnectOcpUseCase(gateway, logger);
      const lifecycle = new OcpSessionLifecycleService({
        ocpGateway: gateway,
        operatorReadModel: hub,
        eventPublisher: bus,
        logger,
        getSessionDomain: () => hub.getSessionProjection().domain,
        applyCampaignOffer: (payload) => hub.applyCampaignOffer(payload),
      });

      await connectOcp.execute({
        domain: "ocp.example",
        authToken: "token-terminate",
        correlationId: createCorrelationId(),
      });
      gateway.simulateAuthSuccess(77);
      expect(hub.getSessionProjection().isAuthenticated).toBe(true);
      expect(published).toContain("OperatorSessionStarted");

      gateway.simulateMessage({ entity: "terminate" });

      // Transport closes to disconnected; projection keeps legacy sessionClosed.
      expect(gateway.getConnectionState()).toBe("disconnected");
      expect(hub.getSessionProjection().connectionState).toBe("sessionClosed");
      expect(hub.getSessionProjection().isAuthenticated).toBe(false);
      expect(published).toContain("OperatorSessionEnded");
      expect(published).toContain("OperatorLoggedOut");
      expect(gateway.getSentCommands()).toHaveLength(0);

      lifecycle.dispose();
      hub.dispose();
    });

    it("SESSION_EXIST via mock marks projection authFeedback without reconnect commands", async () => {
      const gateway = new MockOcpGateway();
      const hub = new OcpProjectionHub({ ocpGateway: gateway });
      const logger = createTestLogger({
        featureId: "F-028",
        boundedContext: "Integration",
      });
      const connectOcp = new ConnectOcpUseCase(gateway, logger);

      const attemptId = createCorrelationId();
      hub.beginAttempt(attemptId);
      await connectOcp.execute({
        domain: "ocp.example",
        authToken: "token-exist",
      });
      hub.bindActiveAttemptToCurrentSocket(attemptId);
      gateway.simulateAuthSuccess(99);
      expect(hub.getSessionProjection().isAuthenticated).toBe(true);
      expect(hub.getSessionProjection().serverState).toBe("connected");

      gateway.simulateMessage({
        entity: "Error",
        data: { code: "SESSION_EXIST" },
      });

      const session = hub.getSessionProjection();
      expect(session.authFeedback?.reason).toBe("SESSION_EXIST");
      expect(session.authorizationState).toEqual({
        phase: "rejected",
        reason: "SESSION_EXIST",
      });
      expect(session.serverState).toBe("failed");
      expect(session.isAuthenticated).toBe(false);
      expect(gateway.getSentCommands()).toHaveLength(0);

      hub.dispose();
    });
  });

  describe("WebSocket transport-only (OcpWebSocketAdapter, ADR-AF-002)", () => {
    let instances: TestWebSocket[] = [];
    let adapter: OcpWebSocketAdapter;

    beforeEach(() => {
      vi.useFakeTimers();
      const socketHarness = createTestWebSocketClass();
      instances = socketHarness.instances;
      vi.stubGlobal("WebSocket", socketHarness.WebSocket);

      adapter = new OcpWebSocketAdapter({
        logger: createTestLogger({
          featureId: "F-028",
          boundedContext: "Integration",
        }),
        webSocketFactory: (url) => new WebSocket(url),
      });
    });

    afterEach(() => {
      adapter.dispose();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it("unexpected close sets failed and does not open stale-token sockets", () => {
      const states: string[] = [];
      adapter.onConnectionStateChange((state) => {
        states.push(state);
      });

      adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
      instances[0]?.simulateOpen();
      instances[0]?.simulateClose();

      vi.advanceTimersByTime(30_000);
      expect(adapter.getConnectionState()).toBe("failed");
      expect(states).not.toContain("reconnecting");
      expect(instances).toHaveLength(1);
    });

    it("SESSION_EXIST → failed and no reconnect sockets", () => {
      adapter.connect({ domain: "ocp.example.com", authToken: "token-1" });
      instances[0]?.simulateOpen();
      instances[0]?.simulateMessage({
        entity: "Error",
        payload: { code: "SESSION_EXIST" },
      });

      vi.advanceTimersByTime(30_000);
      expect(adapter.getConnectionState()).toBe("failed");
      expect(instances).toHaveLength(1);
    });
  });
});
