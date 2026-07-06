import type { SavedAccountProfile, SavedAccountProfileId } from "@domain/index.js";
import { matchesSipAccountIdentity } from "@domain/index.js";
import type { SettingsAccountIdentity } from "@domain/index.js";

export type SavedProfilePanelMode = "newFull" | "savedPasswordOnly" | "savedFull";

export type DeriveSavedProfilePanelModeInput = Readonly<{
  selectedProfileId: SavedAccountProfileId | null;
  selectedProfile: SavedAccountProfile | null;
  isSipRegistered: boolean;
  registeredIdentity: SettingsAccountIdentity | null;
}>;

/**
 * - Purpose: derive account settings panel layout for New vs saved profile tabs.
 * - Inputs: selected profile, registration state, and registered SIP identity.
 * - Outputs: panel mode for password-only or full account form rendering.
 */
export function deriveSavedProfilePanelMode(
  input: DeriveSavedProfilePanelModeInput,
): SavedProfilePanelMode {
  if (input.selectedProfileId === null) {
    return "newFull";
  }

  if (
    input.isSipRegistered &&
    input.registeredIdentity !== null &&
    input.selectedProfile !== null &&
    matchesSipAccountIdentity(input.selectedProfile, input.registeredIdentity)
  ) {
    return "savedFull";
  }

  return "savedPasswordOnly";
}
