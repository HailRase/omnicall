import type { SavedProfilePanelMode } from "./deriveSavedProfilePanelMode.js";

export type SavedProfileCredentialSubmitMode =
  | "manual-password"
  | "remembered-password"
  | "full-form";

export type SavedProfilePasswordHintKey = "account.profile.passwordHint.savedProfile";

export type SavedProfileCredentialPromptState = Readonly<{
  passwordFieldVisible: boolean;
  rememberPasswordVisible: boolean;
  forgetRememberedPasswordVisible: boolean;
  passwordHintKey: SavedProfilePasswordHintKey | null;
  submitMode: SavedProfileCredentialSubmitMode;
}>;

export type DeriveSavedProfileCredentialPromptStateInput = Readonly<{
  panelMode: SavedProfilePanelMode;
  hasRememberedPassword: boolean;
  forcePasswordEntry: boolean;
}>;

/**
 * - Purpose: derive account credential prompt visibility for saved profile sign-in UX.
 * - Inputs: panel mode, remembered-password flag, and forced manual password entry flag.
 * - Outputs: password field visibility, remember-password visibility, hint key, and submit mode.
 */
export function deriveSavedProfileCredentialPromptState(
  input: DeriveSavedProfileCredentialPromptStateInput,
): SavedProfileCredentialPromptState {
  if (input.panelMode === "newFull" || input.panelMode === "savedFull") {
    return {
      passwordFieldVisible: true,
      rememberPasswordVisible: input.panelMode === "newFull",
      forgetRememberedPasswordVisible: false,
      passwordHintKey: null,
      submitMode: "full-form",
    };
  }

  if (input.forcePasswordEntry || !input.hasRememberedPassword) {
    return {
      passwordFieldVisible: true,
      rememberPasswordVisible: true,
      forgetRememberedPasswordVisible: false,
      passwordHintKey: "account.profile.passwordHint.savedProfile",
      submitMode: "manual-password",
    };
  }

  return {
    passwordFieldVisible: false,
    rememberPasswordVisible: false,
    forgetRememberedPasswordVisible: true,
    passwordHintKey: null,
    submitMode: "remembered-password",
  };
}
