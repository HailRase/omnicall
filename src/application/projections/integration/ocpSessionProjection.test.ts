import { describe, expect, it } from "vitest";
import {
  applyOcpSessionDomain,
  initialOcpSessionProjection,
  reduceOcpSessionFromConnectionState,
  reduceOcpSessionFromMessage,
  selectIsOcpConnected,
  selectOcpDomain,
  selectOcpProxyStatus,
} from "./ocpSessionProjection.js";

describe("ocpSessionProjection", () => {
  it("tracks connection lifecycle and clears proxy on authenticate", () => {
    let projection = initialOcpSessionProjection();
    projection = reduceOcpSessionFromConnectionState(projection, "connecting");
    projection = reduceOcpSessionFromConnectionState(projection, "connected");
    expect(selectIsOcpConnected(projection)).toBe(true);
    expect(projection.isAuthenticated).toBe(false);

    projection = reduceOcpSessionFromMessage(projection, {
      entity: "Error",
      data: { code: "SESSION_EXIST" },
    });
    expect(selectOcpProxyStatus(projection)).toBe("SESSION_EXIST");

    projection = reduceOcpSessionFromConnectionState(projection, "authenticated");
    expect(projection.isAuthenticated).toBe(true);
    expect(selectOcpProxyStatus(projection)).toBeNull();
  });

  it("blocks SESSION_EXIST and INVALID_TOKEN proxy statuses", () => {
    let projection = initialOcpSessionProjection();
    projection = reduceOcpSessionFromMessage(projection, {
      entity: "Error",
      data: { code: "INVALID_TOKEN" },
    });
    expect(selectOcpProxyStatus(projection)).toBe("INVALID_TOKEN");
    expect(projection.isAuthenticated).toBe(false);
  });

  it("increments reconnectAttempt while reconnecting", () => {
    let projection = initialOcpSessionProjection();
    projection = reduceOcpSessionFromConnectionState(projection, "reconnecting");
    projection = reduceOcpSessionFromConnectionState(projection, "reconnecting");
    expect(projection.reconnectAttempt).toBe(2);
    projection = reduceOcpSessionFromConnectionState(projection, "connected");
    expect(projection.reconnectAttempt).toBe(0);
  });

  it("captures domain from creds and applySessionDomain", () => {
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
    expect(selectOcpDomain(projection)).toBe("sip.example");
  });

  it("marks sessionClosed and clears auth on terminate", () => {
    let projection = reduceOcpSessionFromConnectionState(
      initialOcpSessionProjection(),
      "authenticated",
    );
    expect(projection.isAuthenticated).toBe(true);
    projection = reduceOcpSessionFromMessage(projection, { entity: "terminate" });
    expect(projection.connectionState).toBe("sessionClosed");
    expect(projection.isAuthenticated).toBe(false);
  });
});
