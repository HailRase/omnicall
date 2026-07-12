import { describe, expect, it } from "vitest";
import {
  parsePreferredDeviceSelectValue,
  resolvePreferredDeviceSelectValue,
  SYSTEM_DEFAULT_DEVICE_VALUE,
} from "./useVideoSettingsPanel.js";

describe("useVideoSettingsPanel helpers", () => {
  it("maps null preferred device to system default select value", () => {
    expect(resolvePreferredDeviceSelectValue(null)).toBe(SYSTEM_DEFAULT_DEVICE_VALUE);
    expect(resolvePreferredDeviceSelectValue("cam-1")).toBe("cam-1");
  });

  it("parses system default select value back to null", () => {
    expect(parsePreferredDeviceSelectValue(SYSTEM_DEFAULT_DEVICE_VALUE)).toBeNull();
    expect(parsePreferredDeviceSelectValue("mic-2")).toBe("mic-2");
  });
});
