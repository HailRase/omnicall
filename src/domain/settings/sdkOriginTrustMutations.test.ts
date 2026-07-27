import { describe, expect, it } from "vitest";
import { SDK_INTEGRATION_DEFAULTS } from "./SdkIntegrationSettings.js";
import {
  allowSdkOrigin,
  denySdkOrigin,
  renameAllowedSdkOrigin,
  setSdkOriginCapabilityMatrix,
  unblockSdkOrigin,
} from "./sdkOriginTrustMutations.js";
import {
  createDefaultSdkOriginCapabilityMatrix,
  withMatrixCapability,
} from "./SdkOriginTrust.js";

describe("sdkOriginTrustMutations", () => {
  it("allows, blacklists, and restores a previously allowed origin", () => {
    const origin = "https://crm.example";
    const allowed = allowSdkOrigin(SDK_INTEGRATION_DEFAULTS, origin);
    expect(allowed?.origins[0]?.state).toBe("allowed");
    const denied = allowed === null ? null : denySdkOrigin(allowed, origin);
    expect(denied?.origins[0]?.state).toBe("denied");
    const restored = denied === null ? null : unblockSdkOrigin(denied, origin);
    expect(restored?.origins[0]?.state).toBe("allowed");
  });

  it("removes a first-contact denial on unblock", () => {
    const denied = denySdkOrigin(SDK_INTEGRATION_DEFAULTS, "https://blocked.example");
    const restored = denied === null
      ? null
      : unblockSdkOrigin(denied, "https://blocked.example");
    expect(restored?.origins).toEqual([]);
  });

  it("adds multiple allowed origins and renames while keeping matrix", () => {
    const first = allowSdkOrigin(SDK_INTEGRATION_DEFAULTS, "https://a.example");
    expect(first).not.toBeNull();
    const second = allowSdkOrigin(first!, "https://b.example");
    expect(second?.origins.filter((row) => row.state === "allowed")).toHaveLength(2);

    const toggledMatrix = withMatrixCapability(
      createDefaultSdkOriginCapabilityMatrix(),
      "call.originate",
      false,
    );
    const withMatrix = {
      ...second!,
      origins: second!.origins.map((row) =>
        row.origin === "https://a.example"
          ? { ...row, matrix: toggledMatrix }
          : row,
      ),
    };
    const renamed = renameAllowedSdkOrigin(
      withMatrix,
      "https://a.example",
      "https://a-renamed.example",
    );
    expect(renamed).not.toBeNull();
    const entry = renamed!.origins.find(
      (row) => row.origin === "https://a-renamed.example",
    );
    expect(entry?.state).toBe("allowed");
    expect(entry?.matrix?.capabilities["call.originate"]).toBe(false);
    expect(
      renamed!.origins.some((row) => row.origin === "https://a.example"),
    ).toBe(false);
  });

  it("rejects rename to an existing or blacklisted origin", () => {
    const a = allowSdkOrigin(SDK_INTEGRATION_DEFAULTS, "https://a.example");
    const both = allowSdkOrigin(a!, "https://b.example");
    expect(renameAllowedSdkOrigin(both!, "https://a.example", "https://b.example")).toBeNull();

    const denied = denySdkOrigin(both!, "https://blocked.example");
    expect(
      renameAllowedSdkOrigin(denied!, "https://a.example", "https://blocked.example"),
    ).toBeNull();
  });

  it("setOriginMatrix normalizes inconsistent call.control vs granular (ADR-0021)", () => {
    const allowed = allowSdkOrigin(SDK_INTEGRATION_DEFAULTS, "https://crm.example");
    expect(allowed).not.toBeNull();
    const inconsistent = {
      capabilities: {
        ...createDefaultSdkOriginCapabilityMatrix().capabilities,
        "call.control": true,
        "call.hangup": false,
      },
    };
    const next = setSdkOriginCapabilityMatrix(
      allowed!,
      "https://crm.example",
      inconsistent,
    );
    expect(next?.origins[0]?.matrix?.capabilities["call.control"]).toBe(false);
    expect(next?.origins[0]?.matrix?.capabilities["call.hangup"]).toBe(false);
    expect(next?.origins[0]?.matrix?.capabilities["call.mute"]).toBe(true);
  });
});
