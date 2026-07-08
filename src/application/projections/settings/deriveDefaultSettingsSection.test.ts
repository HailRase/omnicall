import { describe, expect, it } from "vitest";
import { deriveDefaultSettingsSection } from "./deriveDefaultSettingsSection.js";

describe("deriveDefaultSettingsSection", () => {
  it("opens account section when SIP is not registered", () => {
    expect(deriveDefaultSettingsSection({ isSipRegistered: false })).toBe("account");
  });

  it("opens general section when SIP is registered", () => {
    expect(deriveDefaultSettingsSection({ isSipRegistered: true })).toBe("general");
  });
});
