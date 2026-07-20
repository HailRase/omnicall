import { describe, expect, it } from "vitest";

import { routeUnauthenticatedInbound } from "./sdkGatewayRouteInbound.js";

const clientHello = {
  protocolVersion: 1,
  kind: "handshake" as const,
  type: "sdk:client-hello" as const,
  protocolMin: 1,
  protocolMax: 1,
  sdkVersion: "0.0.0-test",
  application: { name: "fixture-crm", version: "1.0.0" },
  requestedCapabilities: ["session.read.redacted" as const],
  clientNonce: "Y2xpZW50bm9uY2UxMjM",
  occurredAt: "2026-07-20T09:00:00.000Z",
};

const getSnapshot = {
  protocolVersion: 1,
  kind: "command" as const,
  type: "sdk:get-snapshot" as const,
  requestId: "req_test_001",
  serverInstanceId: "srv_test_001",
  sessionEpoch: "epoch_test_001",
  occurredAt: "2026-07-20T09:00:00.000Z",
  payload: {},
};

describe("routeUnauthenticatedInbound", () => {
  it("accepts first client-hello", () => {
    expect(routeUnauthenticatedInbound(clientHello, false)).toEqual({
      action: "server_hello",
    });
  });

  it("denies product snapshot with unauthenticated", () => {
    const route = routeUnauthenticatedInbound(getSnapshot, true);
    expect(route).toEqual({
      action: "command_deny",
      requestId: "req_test_001",
      commandType: "sdk:get-snapshot",
      code: "unauthenticated",
    });
  });

  it("closes pairing/auth before DI-04", () => {
    const pairing = {
      protocolVersion: 1,
      kind: "pairing" as const,
      type: "pairing:request" as const,
      clientId: "client_test_001",
      clientPublicKey: "YWJj",
      keyAlgorithm: "ECDSA-P256-SHA256" as const,
      application: { name: "fixture-crm", version: "1.0.0" },
      requestedProfile: "presentation" as const,
      requestedCapabilities: ["session.read.redacted" as const],
      occurredAt: "2026-07-20T09:00:00.000Z",
    };
    expect(routeUnauthenticatedInbound(pairing, true)).toEqual({
      action: "close",
      code: "forbidden",
    });
  });
});
