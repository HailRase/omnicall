import { describe, expect, it } from "vitest";

import { mapOcpCallTypeToWire } from "./mapOcpCallTypeToWire.js";

describe("mapOcpCallTypeToWire", () => {
  it("keeps internal and external unchanged", () => {
    expect(mapOcpCallTypeToWire("internal")).toBe("internal");
    expect(mapOcpCallTypeToWire("external")).toBe("external");
  });

  it("maps Application sdk to OCP wire external (legacy proxy_users)", () => {
    expect(mapOcpCallTypeToWire("sdk")).toBe("external");
  });
});
