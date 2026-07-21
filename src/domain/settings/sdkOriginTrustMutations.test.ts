import { describe, expect, it } from "vitest";
import { SDK_INTEGRATION_DEFAULTS } from "./SdkIntegrationSettings.js";
import {
  allowSdkOrigin,
  denySdkOrigin,
  unblockSdkOrigin,
} from "./sdkOriginTrustMutations.js";

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
});
