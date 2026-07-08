import { describe, expect, it } from "vitest";
import { deriveSettingsSectionDisabledReason } from "./deriveSettingsSectionDisabledReason.js";

describe("deriveSettingsSectionDisabledReason", () => {
  it("allows account section when SIP is not registered", () => {
    expect(
      deriveSettingsSectionDisabledReason({ isSipRegistered: false }, "account"),
    ).toBeNull();
  });

  it("disables non-account sections when SIP is not registered", () => {
    expect(
      deriveSettingsSectionDisabledReason({ isSipRegistered: false }, "general"),
    ).toBe("settings.nav.disabled.authorizeFirst");
    expect(
      deriveSettingsSectionDisabledReason({ isSipRegistered: false }, "diagnostics"),
    ).toBe("settings.nav.disabled.authorizeFirst");
  });

  it("allows all sections when SIP is registered", () => {
    expect(
      deriveSettingsSectionDisabledReason({ isSipRegistered: true }, "sessions"),
    ).toBeNull();
  });
});
