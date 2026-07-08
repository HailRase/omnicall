import type { AuthShellFlags } from "./deriveAuthShellFlags.js";

export type SettingsNavSectionId =
  | "account"
  | "general"
  | "sessions"
  | "system-state"
  | "diagnostics"
  | "codecs"
  | "headset";

export type SettingsSectionDisabledReasonKey = "settings.nav.disabled.authorizeFirst";

const SETTINGS_ACCOUNT_SECTION: SettingsNavSectionId = "account";

/**
 * - Purpose: derive disabled reason for settings nav section when SIP is not registered.
 * - Inputs: auth shell flags and settings section id.
 * - Outputs: semantic disabled reason key or null when section is available.
 */
export function deriveSettingsSectionDisabledReason(
  authFlags: Pick<AuthShellFlags, "isSipRegistered">,
  sectionId: SettingsNavSectionId,
): SettingsSectionDisabledReasonKey | null {
  if (authFlags.isSipRegistered || sectionId === SETTINGS_ACCOUNT_SECTION) {
    return null;
  }

  return "settings.nav.disabled.authorizeFirst";
}
