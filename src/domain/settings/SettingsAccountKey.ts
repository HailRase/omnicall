export type SettingsAccountKey = string & { readonly __brand: "SettingsAccountKey" };

/** Anonymous bucket when no SIP account is active (dev/tests). */
export const ANONYMOUS_SETTINGS_ACCOUNT = "__anonymous__" as const;

/**
 * - Purpose: brand deterministic local settings profile key string.
 * - Inputs: derived identity key (username@domain or username@domain|serverHost).
 * - Outputs: branded SettingsAccountKey.
 */
export function createSettingsAccountKey(value: string): SettingsAccountKey {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return ANONYMOUS_SETTINGS_ACCOUNT as SettingsAccountKey;
  }
  return trimmed as SettingsAccountKey;
}
