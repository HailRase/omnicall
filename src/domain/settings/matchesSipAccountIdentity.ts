import { normalizeSavedAccountProfileFields } from "./SavedAccountProfile.js";
import type { SettingsAccountIdentity } from "./deriveSettingsAccountKey.js";
import { deriveSettingsAccountKeyFromIdentity } from "./deriveSettingsAccountKey.js";

/**
 * - Purpose: compare two SIP account identities by normalized settings key.
 * - Inputs: left and right username, domain, server tuples.
 * - Outputs: true when both resolve to the same settings account key.
 */
export function matchesSipAccountIdentity(
  left: SettingsAccountIdentity,
  right: SettingsAccountIdentity,
): boolean {
  const normalizedLeft = normalizeSavedAccountProfileFields(left);
  const normalizedRight = normalizeSavedAccountProfileFields(right);
  return (
    deriveSettingsAccountKeyFromIdentity(normalizedLeft) ===
    deriveSettingsAccountKeyFromIdentity(normalizedRight)
  );
}
