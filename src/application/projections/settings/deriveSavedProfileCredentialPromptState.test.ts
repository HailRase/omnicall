import { describe, expect, it } from "vitest";
import { deriveSavedProfileCredentialPromptState } from "./deriveSavedProfileCredentialPromptState.js";

describe("deriveSavedProfileCredentialPromptState", () => {
  it("shows full form credential controls for new profile tab", () => {
    expect(
      deriveSavedProfileCredentialPromptState({
        panelMode: "newFull",
        hasRememberedPassword: false,
        forcePasswordEntry: false,
      }),
    ).toEqual({
      passwordFieldVisible: true,
      rememberPasswordVisible: true,
      passwordHintKey: null,
      submitMode: "full-form",
    });
  });

  it("shows full form without remember-password for registered saved profile", () => {
    expect(
      deriveSavedProfileCredentialPromptState({
        panelMode: "savedFull",
        hasRememberedPassword: true,
        forcePasswordEntry: false,
      }),
    ).toEqual({
      passwordFieldVisible: true,
      rememberPasswordVisible: false,
      passwordHintKey: null,
      submitMode: "full-form",
    });
  });

  it("hides password entry when saved profile has remembered password", () => {
    expect(
      deriveSavedProfileCredentialPromptState({
        panelMode: "savedPasswordOnly",
        hasRememberedPassword: true,
        forcePasswordEntry: false,
      }),
    ).toEqual({
      passwordFieldVisible: false,
      rememberPasswordVisible: false,
      passwordHintKey: null,
      submitMode: "remembered-password",
    });
  });

  it("shows manual password entry when saved profile has no remembered password", () => {
    expect(
      deriveSavedProfileCredentialPromptState({
        panelMode: "savedPasswordOnly",
        hasRememberedPassword: false,
        forcePasswordEntry: false,
      }),
    ).toEqual({
      passwordFieldVisible: true,
      rememberPasswordVisible: true,
      passwordHintKey: "account.profile.passwordHint.savedProfile",
      submitMode: "manual-password",
    });
  });

  it("forces manual password entry after remembered-password sign-in failure", () => {
    expect(
      deriveSavedProfileCredentialPromptState({
        panelMode: "savedPasswordOnly",
        hasRememberedPassword: true,
        forcePasswordEntry: true,
      }),
    ).toEqual({
      passwordFieldVisible: true,
      rememberPasswordVisible: true,
      passwordHintKey: "account.profile.passwordHint.savedProfile",
      submitMode: "manual-password",
    });
  });
});
