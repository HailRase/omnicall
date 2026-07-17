import type { AuthShellFlags } from "./deriveAuthShellFlags.js";

export type SettingsEntrySection = "account" | "general";

/**
 * - Purpose: derive initial settings section when user opens settings without explicit tab.
 * - Inputs: auth shell flags from account bootstrap projection.
 * - Outputs: account tab when no local account session; otherwise general.
 */
export function deriveDefaultSettingsSection(
  authFlags: Pick<AuthShellFlags, "hasActiveAccountSession">,
): SettingsEntrySection {
  return authFlags.hasActiveAccountSession ? "general" : "account";
}
