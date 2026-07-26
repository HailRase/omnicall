import { describe, expect, it } from "vitest";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import {
  applyOcpAuthFeedback,
  applyOcpSessionAuthenticatedLogin,
  applyOcpSessionDomain,
  initialOcpSessionProjection,
  reduceOcpSessionFromConnectionState,
  reduceOcpSessionFromMessage,
  reduceOcpSessionFromServerState,
  selectIsOcpConnected,
  selectOcpAuthFeedback,
  selectOcpAuthenticatedLogin,
  selectOcpAuthorizationState,
  selectOcpDomain,
  selectOcpServerState,
  selectPrimaryRecoveryAction,
} from "./ocpSessionProjection.js";

describe("ocpSessionProjection", () => {
  it("tracks dual server/auth FSM and clears feedback on authorize", () => {
    let projection = initialOcpSessionProjection();
    projection = reduceOcpSessionFromServerState(projection, "connecting");
    projection = reduceOcpSessionFromServerState(projection, "connected");
    expect(selectIsOcpConnected(projection)).toBe(true);
    expect(selectOcpServerState(projection)).toBe("connected");
    expect(projection.isAuthenticated).toBe(false);

    projection = reduceOcpSessionFromMessage(projection, {
      entity: "Error",
      data: { code: "SESSION_EXIST" },
    });
    expect(selectOcpAuthFeedback(projection)?.reason).toBe("SESSION_EXIST");
    expect(selectOcpAuthorizationState(projection)).toEqual({
      phase: "rejected",
      reason: "SESSION_EXIST",
    });
    expect(selectPrimaryRecoveryAction(projection)).toBe("retry_server");

    projection = reduceOcpSessionFromServerState(
      initialOcpSessionProjection(),
      "connected",
    );
    projection = reduceOcpSessionFromMessage(projection, {
      entity: "users",
      data: {
        operatorId: 1,
        status: OperatorStatus.READY,
        reasonId: 0,
        statusSince: "2026-07-16T00:00:00.000Z",
      },
    });
    expect(projection.isAuthenticated).toBe(true);
    expect(projection.connectionState).toBe("authenticated");
    expect(selectOcpAuthFeedback(projection)).toBeNull();
  });

  it("maps INVALID_TOKEN to authFeedback and rejected authorization", () => {
    let projection = initialOcpSessionProjection();
    projection = reduceOcpSessionFromMessage(projection, {
      entity: "Error",
      data: { code: "INVALID_TOKEN" },
    });
    expect(selectOcpAuthFeedback(projection)?.reason).toBe("INVALID_TOKEN");
    expect(projection.isAuthenticated).toBe(false);
    expect(selectOcpAuthorizationState(projection).phase).toBe("rejected");
  });

  it("increments reconnectAttempt while reconnecting", () => {
    let projection = initialOcpSessionProjection();
    projection = reduceOcpSessionFromServerState(projection, "reconnecting");
    projection = reduceOcpSessionFromServerState(projection, "reconnecting");
    expect(projection.reconnectAttempt).toBe(2);
    projection = reduceOcpSessionFromServerState(projection, "connected");
    expect(projection.reconnectAttempt).toBe(0);
  });

  it("keeps OCP proxy domain when creds carry a distinct SIP domain", () => {
    let projection = applyOcpSessionDomain(initialOcpSessionProjection(), "ocp.example");
    expect(selectOcpDomain(projection)).toBe("ocp.example");
    projection = reduceOcpSessionFromMessage(projection, {
      entity: "creds",
      data: {
        username: "u",
        password: "p",
        domain: "sip.example",
        server: "sip.example",
      },
    });
    expect(selectOcpDomain(projection)).toBe("ocp.example");
  });

  it("preserves authenticatedLogin across transport reconnect", () => {
    let projection = applyOcpSessionAuthenticatedLogin(
      applyOcpSessionDomain(initialOcpSessionProjection(), "ocp.example"),
      "yura.supervisor",
    );
    expect(selectOcpAuthenticatedLogin(projection)).toBe("yura.supervisor");
    projection = reduceOcpSessionFromServerState(projection, "reconnecting");
    projection = reduceOcpSessionFromServerState(projection, "connected");
    expect(selectOcpAuthenticatedLogin(projection)).toBe("yura.supervisor");
    expect(selectOcpDomain(projection)).toBe("ocp.example");
  });

  it("marks sessionClosed and clears auth on terminate", () => {
    let projection = reduceOcpSessionFromConnectionState(
      initialOcpSessionProjection(),
      "authenticated",
    );
    expect(projection.isAuthenticated).toBe(true);
    projection = reduceOcpSessionFromMessage(projection, { entity: "terminate" });
    expect(projection.connectionState).toBe("sessionClosed");
    expect(projection.serverState).toBe("disconnected");
    expect(projection.isAuthenticated).toBe(false);
    expect(selectPrimaryRecoveryAction(projection)).toBeNull();
  });

  it("applyOcpAuthFeedback uses nonce and auth timeout allows retry_authorization", () => {
    let projection = reduceOcpSessionFromServerState(
      initialOcpSessionProjection(),
      "connected",
    );
    projection = applyOcpAuthFeedback(projection, "AUTH_TIMEOUT", 42);
    expect(selectOcpAuthFeedback(projection)).toEqual({
      reason: "AUTH_TIMEOUT",
      nonce: 42,
    });
    expect(selectOcpAuthorizationState(projection).phase).toBe("timeout");
    expect(selectPrimaryRecoveryAction(projection)).toBe("retry_authorization");
  });

  it("legacy authenticated bridge still works via reduceOcpSessionFromConnectionState", () => {
    const projection = reduceOcpSessionFromConnectionState(
      initialOcpSessionProjection(),
      "authenticated",
    );
    expect(projection.connectionState).toBe("authenticated");
    expect(projection.authorizationState.phase).toBe("authorized");
  });
});
