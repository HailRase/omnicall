import type { AuthShellFlags } from "./deriveAuthShellFlags.js";

/**
 * Settings section ids mirrored for Application gate (ADR-AF-004 / ADR-AF-005).
 * Keep in sync with renderer `settingsSections.ts` leaf ids.
 */
export const SETTINGS_NAV_SECTION_IDS = [
  "account",
  "general",
  "sessions",
  "system-state",
  "diagnostics",
  "notifications",
  "codecs",
  "video",
  "headset",
  "integrations",
  "integrations-external-services",
  "integrations-external-applications",
  "integrations-sdk",
] as const;

export type SettingsNavSectionId = (typeof SETTINGS_NAV_SECTION_IDS)[number];

export type SettingsNavDisabledReasonKey = "settings.nav.disabled.authorizeFirst";

export type SettingsSectionAvailability = Readonly<{
  enabled: boolean;
  disabledReasonKey: SettingsNavDisabledReasonKey | null;
}>;

export type SettingsNavigationAvailability = Readonly<{
  /** True until local account session is activated (Login), not SIP-ready. */
  isPreAuthGateActive: boolean;
  bySection: Readonly<Record<SettingsNavSectionId, SettingsSectionAvailability>>;
}>;

const ACCOUNT_ALWAYS_ENABLED: SettingsSectionAvailability = {
  enabled: true,
  disabledReasonKey: null,
};

const PRE_AUTH_BLOCKED: SettingsSectionAvailability = {
  enabled: false,
  disabledReasonKey: "settings.nav.disabled.authorizeFirst",
};

const POST_AUTH_ENABLED: SettingsSectionAvailability = {
  enabled: true,
  disabledReasonKey: null,
};

/**
 * - Purpose: derive Settings sidebar/route availability from account-session gate (ADR-AF-005).
 * - Inputs: auth shell flag `hasActiveAccountSession`.
 * - Outputs: per-section enabled flag + semantic disabled reason key (no localized text).
 */
export function deriveSettingsNavigationAvailability(
  authFlags: Pick<AuthShellFlags, "hasActiveAccountSession">,
): SettingsNavigationAvailability {
  const isPreAuthGateActive = !authFlags.hasActiveAccountSession;
  const bySection = Object.fromEntries(
    SETTINGS_NAV_SECTION_IDS.map((sectionId) => {
      if (sectionId === "account") {
        return [sectionId, ACCOUNT_ALWAYS_ENABLED] as const;
      }
      if (sectionId === "integrations-sdk") {
        return [sectionId, POST_AUTH_ENABLED] as const;
      }
      return [
        sectionId,
        isPreAuthGateActive ? PRE_AUTH_BLOCKED : POST_AUTH_ENABLED,
      ] as const;
    }),
  ) as Record<SettingsNavSectionId, SettingsSectionAvailability>;

  return {
    isPreAuthGateActive,
    bySection,
  };
}

/**
 * - Purpose: clamp a requested Settings section to an allowed target under the gate.
 * - Inputs: availability VM + requested section id.
 * - Outputs: requested section when allowed; otherwise `account`.
 */
export function resolveAllowedSettingsSection(
  availability: SettingsNavigationAvailability,
  requested: SettingsNavSectionId,
): SettingsNavSectionId {
  if (availability.bySection[requested]?.enabled === true) {
    return requested;
  }
  return "account";
}

export function isSettingsNavSectionId(value: unknown): value is SettingsNavSectionId {
  return (
    typeof value === "string" &&
    (SETTINGS_NAV_SECTION_IDS as ReadonlyArray<string>).includes(value)
  );
}
