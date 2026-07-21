/**
 * DI-11: Origin matrix activate gate (denyActivateWithoutLocalApproval).
 */

import { describe, expect, it, vi } from "vitest";
import { PROTOCOL_MAJOR, type WireMessage } from "@axata/axatalk-protocol";

import { createSdkGatewayConnection } from "./sdkGatewayConnection.js";
import { denyActivateWithoutLocalApproval } from "./sdkGatewayActivateApproval.js";
import { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
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
  profileRef = "prf_dGVzdA",
): Extract<WireMessage, { kind: "command" }> {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "command",
    type: "account:activate-profile",
    requestId,
    serverInstanceId: IDENTITY.serverInstanceId,
    sessionEpoch: IDENTITY.sessionEpoch,
    occurredAt: "2026-07-21T12:00:00.000Z",
    payload: { profileRef, expectedRevision: 1 },
  };
}

describe("denyActivateWithoutLocalApproval", () => {
  it("matrix account.activate=false → immediate forbidden + permission_denied (no grant side effects)", () => {
    const sent: WireMessage[] = [];
    const log = vi.fn();
    const store = new SdkAccountActivateGrantStore();
    const issued = store.issue({
      clientId: "client_matrix_off_001",
      profileId: "1001@pbx.example",
      nowMs: NOW().getTime(),
    });
    expect(issued.ok).toBe(true);
    if (!issued.ok) {
      return;
    }

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
    const denied = denyActivateWithoutLocalApproval({
      connection,
      requestDedup: new SdkRequestDedupCache(),
      now: NOW,
      sendJson: (_conn, message) => {
        sent.push(message);
      },
      log,
      activateGrantStore: store,
      identity: IDENTITY,
      command: createActivateCommand("req_matrix_off_001", issued.grant.profileRef),
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
    // Grant remains valid — matrix deny must not consume / clear it.
    expect(
      store.hasValidGrant(
        "client_matrix_off_001",
        issued.grant.profileRef,
        NOW().getTime(),
      ),
    ).toBe(true);
    expect(log).toHaveBeenCalledWith(
      "sdk_gateway_command",
      expect.objectContaining({
        commandType: "account:activate-profile",
        result: "forbidden",
      }),
    );
  });

  it("omitted isOriginActivateAllowed still denies without local grant (DI-08 path)", () => {
    const sent: WireMessage[] = [];
    const connection = createSdkGatewayConnection(
      "conn_no_grant_001",
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
    connection.clientId = "client_no_grant_001";

    const denied = denyActivateWithoutLocalApproval({
      connection,
      requestDedup: new SdkRequestDedupCache(),
      now: NOW,
      sendJson: (_conn, message) => {
        sent.push(message);
      },
      log: () => undefined,
      activateGrantStore: new SdkAccountActivateGrantStore(),
      identity: IDENTITY,
      command: createActivateCommand("req_no_grant_001"),
    });

    expect(denied).toBe(true);
    expect(sent[0]).toMatchObject({
      kind: "reply",
      ok: false,
      error: {
        code: "forbidden",
        details: { permission_denied: true },
      },
    });
  });
});
