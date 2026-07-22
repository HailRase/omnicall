/**
 * DI-11: Origin matrix activate gate.
 */

import { describe, expect, it, vi } from "vitest";
import { PROTOCOL_MAJOR, type WireMessage } from "@axata/axatalk-protocol";

import { createSdkGatewayConnection } from "./sdkGatewayConnection.js";
import { denyActivateWhenOriginPolicyForbids } from "./sdkGatewayActivateApproval.js";
import { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";

const IDENTITY: SdkGatewayIdentity = {
  desktopVersion: "0.11.2-test",
  serverInstanceId: "srv_act_gate_001",
  sessionEpoch: "epoch_act_gate_001",
  maxMessageBytes: 65_536,
  heartbeatSeconds: 30,
};

const NOW = () => new Date("2026-07-21T12:00:00.000Z");

function createActivateCommand(
  requestId: string,
  login = "agent@example.com",
): Extract<WireMessage, { kind: "command" }> {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "command",
    type: "account:activate-profile",
    requestId,
    serverInstanceId: IDENTITY.serverInstanceId,
    sessionEpoch: IDENTITY.sessionEpoch,
    occurredAt: "2026-07-21T12:00:00.000Z",
    payload: { login, expectedRevision: 1 },
  };
}

describe("denyActivateWhenOriginPolicyForbids", () => {
  it("matrix account.activate=false → immediate forbidden + permission_denied", () => {
    const sent: WireMessage[] = [];
    const log = vi.fn();

    const connection = createSdkGatewayConnection(
      "conn_matrix_off_001",
      {
        readyState: 1,
        send: () => undefined,
        close: () => undefined,
        terminate: () => undefined,
        ping: () => undefined,
        on: () => undefined,
      },
      "https://crm.example.com",
      NOW().getTime(),
    );
    connection.clientId = "client_matrix_off_001";
    connection.authState = "authenticated";

    const isOriginActivateAllowed = vi.fn(() => false);
    const denied = denyActivateWhenOriginPolicyForbids({
      connection,
      requestDedup: new SdkRequestDedupCache(),
      now: NOW,
      sendJson: (_conn, message) => {
        sent.push(message);
      },
      log,
      identity: IDENTITY,
      command: createActivateCommand("req_matrix_off_001"),
      isOriginActivateAllowed,
    });

    expect(denied).toBe(true);
    expect(isOriginActivateAllowed).toHaveBeenCalledWith("https://crm.example.com");
    expect(sent).toHaveLength(1);
    const reply = sent[0];
    expect(reply).toMatchObject({
      kind: "reply",
      ok: false,
      requestId: "req_matrix_off_001",
      commandType: "account:activate-profile",
      error: {
        code: "forbidden",
        retryable: false,
        details: { permission_denied: true },
      },
    });
    expect(log).toHaveBeenCalledWith(
      "sdk_gateway_command",
      expect.objectContaining({
        commandType: "account:activate-profile",
        result: "forbidden",
      }),
    );
  });

  it("matrix account.activate=true permits the command", () => {
    const sent: WireMessage[] = [];
    const connection = createSdkGatewayConnection(
      "conn_matrix_on_001",
      {
        readyState: 1,
        send: () => undefined,
        close: () => undefined,
        terminate: () => undefined,
        ping: () => undefined,
        on: () => undefined,
      },
      "https://crm.example.com",
      NOW().getTime(),
    );
    connection.clientId = "client_matrix_on_001";

    const denied = denyActivateWhenOriginPolicyForbids({
      connection,
      requestDedup: new SdkRequestDedupCache(),
      now: NOW,
      sendJson: (_conn, message) => {
        sent.push(message);
      },
      log: () => undefined,
      identity: IDENTITY,
      command: createActivateCommand("req_matrix_on_001"),
      isOriginActivateAllowed: () => true,
    });

    expect(denied).toBe(false);
    expect(sent).toHaveLength(0);
  });
});
