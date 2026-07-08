import type { AuthShellFlags } from "./deriveAuthShellFlags.js";

export type SettingsEntrySection = "account" | "general";

/**
 * - Purpose: derive initial settings section when user opens settings without explicit tab.
 * - Inputs: auth shell flags from account bootstrap projection.
 * - Outputs: account tab when SIP is not registered, otherwise general tab.
 */
export function deriveDefaultSettingsSection(
  authFlags: Pick<AuthShellFlags, "isSipRegistered">,
): SettingsEntrySection {
  return authFlags.isSipRegistered ? "general" : "account";
}
