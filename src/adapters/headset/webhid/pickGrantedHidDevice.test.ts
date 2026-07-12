import { describe, expect, it } from "vitest";
import { pickGrantedHidDevice } from "./pickGrantedHidDevice.js";

describe("pickGrantedHidDevice", () => {
  const devices = [
    { id: "1:2:A", productName: "A" },
    { id: "3:4:B", productName: "B" },
  ] as const;

  it("prefers matching preferred device id", () => {
    expect(pickGrantedHidDevice(devices, "3:4:B")?.id).toBe("3:4:B");
  });

  it("falls back to first granted when preferred is missing", () => {
    expect(pickGrantedHidDevice(devices, "9:9:missing")?.id).toBe("1:2:A");
    expect(pickGrantedHidDevice(devices, null)?.id).toBe("1:2:A");
  });

  it("returns undefined for empty granted list", () => {
    expect(pickGrantedHidDevice([], "1:2:A")).toBeUndefined();
  });
});
