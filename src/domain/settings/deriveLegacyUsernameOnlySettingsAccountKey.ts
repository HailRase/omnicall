import {
  ANONYMOUS_SETTINGS_ACCOUNT,
  createSettingsAccountKey,
  type SettingsAccountKey,
} from "./SettingsAccountKey.js";
import {
  normalizeSettingsAccountUsername,
  type SettingsAccountIdentity,
} from "./deriveSettingsAccountKey.js";

/**
 * - Purpose: derive pre-composite username-only settings bucket key.
 * - Inputs: SIP identity fields (password excluded).
 * - Outputs: branded SettingsAccountKey with normalized username only.
 */
export function deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity(
  identity: SettingsAccountIdentity,
): SettingsAccountKey {
  const username = normalizeSettingsAccountUsername(identity.username);
  if (username.length === 0) {
    return createSettingsAccountKey(ANONYMOUS_SETTINGS_ACCOUNT);
  }
  return createSettingsAccountKey(username);
}

/**
 * - Purpose: detect composite profile keys (username@domain with optional suffix).
 * - Inputs: branded SettingsAccountKey.
 * - Outputs: true when key uses composite identity layout.
 */
export function isCompositeSettingsAccountKey(accountKey: SettingsAccountKey): boolean {
  return accountKey.includes("@");
}
