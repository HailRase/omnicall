import { describe, expect, it } from "vitest";

import { routeSdkInbound } from "./sdkGatewayRouteInbound.js";

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

const pairingRequest = {
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

const unauthView = {
  handshakeComplete: true,
  authState: "unauthenticated" as const,
  grantedCapabilities: [] as const,
};

describe("routeSdkInbound", () => {
  it("accepts first client-hello", () => {
    expect(
      routeSdkInbound(clientHello, {
        handshakeComplete: false,
        authState: "unauthenticated",
        grantedCapabilities: [],
      }),
    ).toEqual({ action: "server_hello" });
  });

  it("denies product snapshot with unauthenticated", () => {
    expect(routeSdkInbound(getSnapshot, unauthView)).toEqual({
      action: "command_deny",
      requestId: "req_test_001",
      commandType: "sdk:get-snapshot",
      code: "unauthenticated",
    });
  });

  it("routes pairing request after handshake", () => {
    expect(routeSdkInbound(pairingRequest, unauthView)).toEqual({
      action: "pairing_request",
      message: pairingRequest,
    });
  });

  it("denies snapshot without capability when authenticated", () => {
    expect(
      routeSdkInbound(getSnapshot, {
        handshakeComplete: true,
        authState: "authenticated",
        grantedCapabilities: [],
      }),
    ).toEqual({
      action: "command_deny",
      requestId: "req_test_001",
      commandType: "sdk:get-snapshot",
      code: "forbidden",
    });
  });

  it("routes capable snapshot to broker path (DI-05)", () => {
    expect(
      routeSdkInbound(getSnapshot, {
        handshakeComplete: true,
        authState: "authenticated",
        grantedCapabilities: ["session.read.redacted"],
      }),
    ).toEqual({
      action: "command_broker",
      requestId: "req_test_001",
      commandType: "sdk:get-snapshot",
      message: getSnapshot,
    });
  });

  it("routes window:show to main window path", () => {
    const show = {
      ...getSnapshot,
      type: "window:show" as const,
      payload: {},
    };
    expect(
      routeSdkInbound(show, {
        handshakeComplete: true,
        authState: "authenticated",
        grantedCapabilities: ["window.show"],
      }),
    ).toEqual({
      action: "command_window",
      requestId: "req_test_001",
      commandType: "window:show",
    });
  });

  it("allows sdk:ping when authenticated", () => {
    const ping = {
      ...getSnapshot,
      type: "sdk:ping" as const,
      payload: {},
    };
    expect(
      routeSdkInbound(ping, {
        handshakeComplete: true,
        authState: "authenticated",
        grantedCapabilities: [],
      }),
    ).toEqual({
      action: "command_ping",
      requestId: "req_test_001",
    });
  });

  it("denies window:hide as forbidden on v1 product surface (ADR-0013)", () => {
    const hide = {
      ...getSnapshot,
      type: "window:hide" as const,
      // Schema-valid deny fixture (protocol requires expectedRevision); product still forbidden (ADR-0013).
      payload: { expectedRevision: 12 },
    };
    expect(
      routeSdkInbound(hide, {
        handshakeComplete: true,
        authState: "authenticated",
        grantedCapabilities: ["window.hide"],
      }),
    ).toEqual({
      action: "command_deny",
      requestId: "req_test_001",
      commandType: "window:hide",
      code: "forbidden",
    });
  });

  it("denies window:show without window.show capability", () => {
    const show = {
      ...getSnapshot,
      type: "window:show" as const,
      payload: {},
    };
    expect(
      routeSdkInbound(show, {
        handshakeComplete: true,
        authState: "authenticated",
        grantedCapabilities: ["session.read.redacted"],
      }),
    ).toEqual({
      action: "command_deny",
      requestId: "req_test_001",
      commandType: "window:show",
      code: "forbidden",
    });
  });
});
