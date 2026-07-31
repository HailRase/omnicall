/**
 * DI-05: fan-out sequence must not advance on validateWire failure.
 */

import { describe, expect, it, vi } from "vitest";

import { deliverSdkEventToConnection } from "./sdkGatewayEventFanout.js";
import {
  createSdkGatewayConnection,
  type SdkGatewaySocket,
} from "./sdkGatewayConnection.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";

function createSocket(): SdkGatewaySocket {
  return {
    readyState: 1,
    on: vi.fn(),
    ping: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    terminate: vi.fn(),
  };
}

const identity: SdkGatewayIdentity = {
  desktopVersion: "0.0.0-test",
  serverInstanceId: "srv_fanout_001",
  sessionEpoch: "epoch_fanout_001",
  maxMessageBytes: 65_536,
  heartbeatSeconds: 30,
};

describe("deliverSdkEventToConnection", () => {
  it("does not bump sequence when wire validation fails", () => {
    const connection = createSdkGatewayConnection(
      "conn_fanout_001",
      createSocket(),
      "https://crm.example",
      Date.now(),
    );
    connection.authState = "authenticated";
    connection.grantedCapabilities = ["session.read.redacted"];
    connection.eventSequence = 4;
    const sendJson = vi.fn();
    const delivered = deliverSdkEventToConnection({
      connection,
      identity,
      now: () => new Date("2026-07-26T12:00:00.000Z"),
      draft: {
        type: "registration:changed",
        payload: { state: "not-a-real-state" },
        revision: 1,
      },
      sendJson,
    });
    expect(delivered).toBe(false);
    expect(connection.eventSequence).toBe(4);
    expect(sendJson).not.toHaveBeenCalled();
  });

  it("bumps sequence only after successful validation + send", () => {
    const connection = createSdkGatewayConnection(
      "conn_fanout_002",
      createSocket(),
      "https://crm.example",
      Date.now(),
    );
    connection.authState = "authenticated";
    connection.grantedCapabilities = ["session.read.redacted"];
    connection.eventSequence = 4;
    const sendJson = vi.fn();
    const delivered = deliverSdkEventToConnection({
      connection,
      identity,
      now: () => new Date("2026-07-26T12:00:00.000Z"),
      draft: {
        type: "registration:changed",
        payload: { state: "registered" },
        revision: 1,
      },
      sendJson,
    });
    expect(delivered).toBe(true);
    expect(connection.eventSequence).toBe(5);
    expect(sendJson).toHaveBeenCalledTimes(1);
  });
});
