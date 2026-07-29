import { describe, expect, it } from "vitest";
import {
  deriveSettingsNavigationAvailability,
  resolveAllowedSettingsSection,
  SETTINGS_NAV_SECTION_IDS,
} from "./deriveSettingsNavigationAvailability.js";

describe("deriveSettingsNavigationAvailability", () => {
  it("keeps Account enabled and blocks every other section before account session", () => {
    const availability = deriveSettingsNavigationAvailability({
      hasActiveAccountSession: false,
    });

    expect(availability.isPreAuthGateActive).toBe(true);
    expect(availability.bySection.account).toEqual({
      enabled: true,
      disabledReasonKey: null,
    });

    for (const sectionId of SETTINGS_NAV_SECTION_IDS) {
      if (sectionId === "account") {
        continue;
      }
      if (sectionId === "integrations-sdk") {
        expect(availability.bySection[sectionId]).toEqual({
          enabled: true,
          disabledReasonKey: null,
        });
        continue;
      }
      expect(availability.bySection[sectionId]).toEqual({
        enabled: false,
        disabledReasonKey: "settings.nav.disabled.authorizeFirst",
      });
    }
  });

  it("enables all sections after account session activation (even without SIP-ready)", () => {
    const availability = deriveSettingsNavigationAvailability({
      hasActiveAccountSession: true,
    });

    expect(availability.isPreAuthGateActive).toBe(false);
    for (const sectionId of SETTINGS_NAV_SECTION_IDS) {
      expect(availability.bySection[sectionId]).toEqual({
        enabled: true,
        disabledReasonKey: null,
      });
    }
  });

  it("redirects blocked sections to Account and preserves allowed ones", () => {
    const preAuth = deriveSettingsNavigationAvailability({
      hasActiveAccountSession: false,
    });
    expect(resolveAllowedSettingsSection(preAuth, "general")).toBe("account");
    expect(resolveAllowedSettingsSection(preAuth, "integrations")).toBe("account");
    expect(resolveAllowedSettingsSection(preAuth, "integrations-external-services")).toBe(
      "account",
    );
    expect(resolveAllowedSettingsSection(preAuth, "integrations-sdk")).toBe(
      "integrations-sdk",
    );
    expect(resolveAllowedSettingsSection(preAuth, "diagnostics")).toBe("account");
    expect(resolveAllowedSettingsSection(preAuth, "account")).toBe("account");

    const postAuth = deriveSettingsNavigationAvailability({
      hasActiveAccountSession: true,
    });
    expect(resolveAllowedSettingsSection(postAuth, "codecs")).toBe("codecs");
    expect(resolveAllowedSettingsSection(postAuth, "integrations")).toBe("integrations");
    expect(
      resolveAllowedSettingsSection(postAuth, "integrations-external-services"),
    ).toBe("integrations-external-services");
    expect(resolveAllowedSettingsSection(postAuth, "integrations-sdk")).toBe(
      "integrations-sdk",
    );
  });
});
