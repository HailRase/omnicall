import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { OcpProjectionHub } from "./OcpProjectionHub.js";

describe("OcpProjectionHub socket epoch", () => {
  it("ignores late messages emitted by a superseded socket", () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    gateway.connect({ domain: "ocp.example", authToken: "token-a" });
    const staleEpoch = gateway.getSocketEpoch();
    gateway.connect({ domain: "ocp.example", authToken: "token-b" });
    const activeEpoch = gateway.getSocketEpoch();
    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    hub.bindActiveAttemptToCurrentSocket(attemptId);

    gateway.simulateStaleMessage(
      {
        entity: "users",
        data: {
          operatorId: 10,
          status: OperatorStatus.READY,
          reasonId: 0,
          statusSince: "2026-07-17T10:00:00.000Z",
        },
      },
      staleEpoch,
    );
    expect(hub.getOperatorProjection().operatorId).toBeNull();

    gateway.simulateStaleMessage(
      {
        entity: "users",
        data: {
          operatorId: 20,
          status: OperatorStatus.READY,
          reasonId: 0,
          statusSince: "2026-07-17T10:01:00.000Z",
        },
      },
      activeEpoch,
    );
    expect(hub.getOperatorProjection().operatorId).toBe(20);
    hub.dispose();
  });

  it("resetToIdle clears session operator and campaign like a cold start", () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    gateway.connect({ domain: "ocp.example", authToken: "token" });
    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    gateway.simulateAuthSuccess(7);
    hub.setSessionDomain("ocp.example");
    hub.setSessionAuthenticatedLogin("agent.one");
    hub.setReservedStatus(OperatorStatus.BREAK, 3);

    expect(hub.getSessionProjection().isAuthenticated).toBe(true);
    expect(hub.getSessionProjection().authenticatedLogin).toBe("agent.one");
    expect(hub.getOperatorProjection().operatorId).toBe(7);

    hub.resetToIdle();

    expect(hub.getSessionProjection()).toMatchObject({
      serverState: "disconnected",
      isAuthenticated: false,
      domain: null,
      authenticatedLogin: null,
      activeAttemptId: null,
      reconnectAttempt: 0,
      authFeedback: null,
    });
    expect(hub.getSessionProjection().authorizationState.phase).toBe("idle");
    expect(hub.getOperatorProjection().operatorId).toBeNull();
    expect(hub.getOperatorProjection().reservedStatus).toBeNull();
    expect(hub.getCampaignProjection().activeCampaign).toBeNull();
    hub.dispose();
  });
});
