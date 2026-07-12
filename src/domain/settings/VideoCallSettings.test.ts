import { describe, expect, it } from "vitest";

import {
  parseConferenceNumberSubstring,
  parseDefaultSessionViewSetting,
  parsePreferredMediaDeviceId,
} from "./VideoCallSettings.js";

describe("VideoCallSettings parsers", () => {
  it("parses device ids and rejects empty or oversized values", () => {
    expect(parsePreferredMediaDeviceId(undefined)).toBeUndefined();
    expect(parsePreferredMediaDeviceId(null)).toBeNull();
    expect(parsePreferredMediaDeviceId(" cam-1 ")).toBe("cam-1");
    expect(parsePreferredMediaDeviceId("")).toBeUndefined();
    expect(parsePreferredMediaDeviceId("x".repeat(300))).toBeUndefined();
    expect(parsePreferredMediaDeviceId(1)).toBeUndefined();
  });

  it("parses session view modes", () => {
    expect(parseDefaultSessionViewSetting("compact")).toBe("expanded");
    expect(parseDefaultSessionViewSetting("hidden")).toBe("hidden");
    expect(parseDefaultSessionViewSetting("expanded")).toBe("expanded");
    expect(parseDefaultSessionViewSetting("expanded")).toBe("expanded");
    expect(parseDefaultSessionViewSetting("fullscreen")).toBe("fullscreen");
    expect(parseDefaultSessionViewSetting("minified")).toBeNull();
  });

  it("parses conference substring", () => {
    expect(parseConferenceNumberSubstring(undefined)).toBeUndefined();
    expect(parseConferenceNumberSubstring(null)).toBeNull();
    expect(parseConferenceNumberSubstring("")).toBeNull();
    expect(parseConferenceNumberSubstring(" vconf-sel ")).toBe("vconf-sel");
    expect(parseConferenceNumberSubstring("x".repeat(100))).toBeUndefined();
  });
});
