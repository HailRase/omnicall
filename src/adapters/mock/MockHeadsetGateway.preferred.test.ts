import { describe, expect, it } from "vitest";
import { MockHeadsetGateway } from "./MockHeadsetGateway.js";

describe("MockHeadsetGateway preferred auto-reconnect", () => {
  it("connects preferred granted device when present", async () => {
    const gateway = new MockHeadsetGateway();
    gateway.setGrantedDevices([
      { id: "a", productName: "A" },
      { id: "b", productName: "B" },
    ]);
    gateway.setPreferredDeviceId("b");
    gateway.setAutoReconnectEnabled(true);

    const result = await gateway.tryAutoReconnect();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.id).toBe("b");
    }
  });

  it("falls back to first granted when preferred is absent", async () => {
    const gateway = new MockHeadsetGateway();
    gateway.setGrantedDevices([
      { id: "a", productName: "A" },
      { id: "b", productName: "B" },
    ]);
    gateway.setPreferredDeviceId("missing");
    gateway.setAutoReconnectEnabled(true);

    const result = await gateway.tryAutoReconnect({ preferredDeviceId: "missing" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.id).toBe("a");
    }
  });
});
