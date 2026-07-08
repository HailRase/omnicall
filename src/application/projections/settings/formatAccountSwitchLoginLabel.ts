import type { SavedAccountProfile } from "@domain/index.js";
import {
  formatSavedAccountProfileSelectorLabel,
  formatSettingsAccountIdentityLabel,
  matchesSipAccountIdentity,
} from "@domain/index.js";
import type { SettingsAccountIdentity } from "@domain/index.js";

/**
 * - Purpose: build user-visible login label for profile-switch confirmation.
 * - Inputs: SIP identity and saved profiles list for disambiguation.
 * - Outputs: username or disambiguated label without secrets.
 */
export function formatAccountSwitchLoginLabel(
  identity: SettingsAccountIdentity,
  savedProfiles: ReadonlyArray<SavedAccountProfile>,
): string {
  const match = savedProfiles.find((profile) => matchesSipAccountIdentity(profile, identity));
  if (match !== undefined) {
    return formatSavedAccountProfileSelectorLabel(match, savedProfiles);
  }

  const formatted = formatSettingsAccountIdentityLabel(identity.username, identity.domain);
  if (formatted !== null) {
    return formatted;
  }

  const username = identity.username.trim();
  return username.length > 0 ? username : "—";
}
