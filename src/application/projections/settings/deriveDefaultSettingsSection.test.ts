import { describe, expect, it } from "vitest";
import { deriveDefaultSettingsSection } from "./deriveDefaultSettingsSection.js";

describe("deriveDefaultSettingsSection", () => {
  it("opens Account when no local account session", () => {
    expect(deriveDefaultSettingsSection({ hasActiveAccountSession: false })).toBe("account");
  });

  it("opens General when account session is active", () => {
    expect(deriveDefaultSettingsSection({ hasActiveAccountSession: true })).toBe("general");
  });
});
