/**
 * Unit tests for activate grant session sync (DI-08 Low remediation).
 */

import { describe, expect, it } from "vitest";

import { createSdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  elevateAccountActivateCapability,
  stripAccountActivateCapability,
} from "./sdkAccountActivateCapability.js";
import { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
import {
  clearAccountActivateGrantsForClient,
  syncAccountActivateCapabilityForConnection,
} from "./sdkAccountActivateSession.js";

describe("sdkAccountActivateSession", () => {
  it("strips account.activate after grant TTL prune", () => {
    const store = new SdkAccountActivateGrantStore();
    const issued = store.issue({
      clientId: "client_sync_1",
      profileId: "1001@pbx.example",
      nowMs: 1_000,
      ttlMs: 50,
    });
    expect(issued.ok).toBe(true);
    const connection = createSdkGatewayConnection(
      "conn_1",
      {
        readyState: 1,
        send: () => undefined,
        close: () => undefined,
        terminate: () => undefined,
        ping: () => undefined,
        on: () => undefined,
      },
      "https://crm.example",
      1_000,
    );
    connection.clientId = "client_sync_1";
    connection.authState = "authenticated";
    elevateAccountActivateCapability(connection);
    expect(connection.grantedCapabilities).toContain("account.activate");

    syncAccountActivateCapabilityForConnection(connection, store, 1_000 + 51);
    expect(connection.grantedCapabilities).not.toContain("account.activate");
  });

  it("clearAccountActivateGrantsForClient strips live connections", () => {
    const store = new SdkAccountActivateGrantStore();
    store.issue({
      clientId: "client_clear_1",
      profileId: "1001@pbx.example",
      nowMs: 0,
    });
    const connection = createSdkGatewayConnection(
      "conn_2",
      {
        readyState: 1,
        send: () => undefined,
        close: () => undefined,
        terminate: () => undefined,
        ping: () => undefined,
        on: () => undefined,
      },
      "https://crm.example",
      0,
    );
    connection.clientId = "client_clear_1";
    elevateAccountActivateCapability(connection);
    clearAccountActivateGrantsForClient({
      activateGrantStore: store,
      connections: [connection],
      clientId: "client_clear_1",
    });
    expect(connection.grantedCapabilities).not.toContain("account.activate");
    expect(store.hasAnyValidGrant("client_clear_1", 1)).toBe(false);
    // idempotent strip path
    stripAccountActivateCapability(connection);
  });
});
