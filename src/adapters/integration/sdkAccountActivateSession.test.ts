/**
 * Unit tests for Origin matrix activate capability sync.
 */

import { describe, expect, it } from "vitest";

import { createSdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  originPolicyAllowsAccountActivate,
  syncAccountActivateCapabilityFromOriginPolicy,
  withOriginMatrixAccountActivate,
} from "./sdkAccountActivateSession.js";

describe("sdkAccountActivateSession", () => {
  it("syncs a live connection to Origin matrix", () => {
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
      0,
    );
    connection.authState = "authenticated";
    expect(
      syncAccountActivateCapabilityFromOriginPolicy(connection, [
        "account.activate",
      ]),
    ).toBe(true);
    expect(connection.grantedCapabilities).toContain("account.activate");
    expect(syncAccountActivateCapabilityFromOriginPolicy(connection, [])).toBe(true);
    expect(connection.grantedCapabilities).not.toContain("account.activate");
  });

  it("adds or removes account.activate from persisted grants", () => {
    expect(originPolicyAllowsAccountActivate(["account.activate"])).toBe(true);
    expect(originPolicyAllowsAccountActivate([])).toBe(false);
    expect(
      withOriginMatrixAccountActivate(["call.control"], ["account.activate"]),
    ).toEqual(["call.control", "account.activate"]);
    expect(
      withOriginMatrixAccountActivate(["call.control", "account.activate"], []),
    ).toEqual(["call.control"]);
  });

  it("elevates window.hide from Origin matrix alongside activate", () => {
    expect(
      withOriginMatrixAccountActivate(["window.show"], ["window.hide"]),
    ).toEqual(["window.show", "window.hide"]);
    const connection = createSdkGatewayConnection(
      "conn_hide",
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
    connection.authState = "authenticated";
    expect(
      syncAccountActivateCapabilityFromOriginPolicy(connection, [
        "window.hide",
      ]),
    ).toBe(true);
    expect(connection.grantedCapabilities).toContain("window.hide");
  });
});
