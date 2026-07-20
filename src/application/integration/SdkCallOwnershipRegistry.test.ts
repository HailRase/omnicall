import { describe, expect, it } from "vitest";

import { SdkCallOwnershipRegistry } from "./SdkCallOwnershipRegistry.js";

describe("SdkCallOwnershipRegistry", () => {
  it("assigns owner and clears control after finalize", () => {
    const registry = new SdkCallOwnershipRegistry();
    registry.assignOwner("call_1", "client_a");
    expect(registry.getOwnerClientId("call_1")).toBe("client_a");
    registry.finalize("call_1");
    expect(registry.getOwnerClientId("call_1")).toBeUndefined();
    expect(registry.get("call_1")?.terminal).toBe(true);
  });
});
