import { describe, expect, it } from "vitest";
import { deriveAccountPanelActionsShell } from "./deriveAccountPanelActionsShell.js";

const emptyForm = {
  username: "",
  password: "",
  domain: "",
  server: "",
};

const filledForm = {
  username: "user",
  password: "secret",
  domain: "example.com",
  server: "sip.example.com",
};

describe("deriveAccountPanelActionsShell", () => {
  it("disables authorize and enables logout when sip is registered", () => {
    expect(
      deriveAccountPanelActionsShell({
        authUiState: "sip_registered",
        form: filledForm,
        submitting: false,
        panelDisabled: false,
        sessionLogoutDisabledReason: null,
      }),
    ).toEqual({
      authorizeDisabledReason: "account.actions.disabled.alreadyAuthorized",
      logoutDisabledReason: null,
    });
  });

  it("enables authorize and disables logout when not registered and form is empty", () => {
    expect(
      deriveAccountPanelActionsShell({
        authUiState: "sip_only_ready",
        form: emptyForm,
        submitting: false,
        panelDisabled: false,
        sessionLogoutDisabledReason: null,
      }),
    ).toEqual({
      authorizeDisabledReason: null,
      logoutDisabledReason: "account.actions.disabled.fillAndAuthorize",
    });
  });

  it("uses filled-form logout hint when not registered", () => {
    expect(
      deriveAccountPanelActionsShell({
        authUiState: "sip_registration_failed",
        form: filledForm,
        submitting: false,
        panelDisabled: false,
        sessionLogoutDisabledReason: null,
      }),
    ).toEqual({
      authorizeDisabledReason: null,
      logoutDisabledReason: "account.actions.disabled.authorizeFirst",
    });
  });

  it("prefers session logout disabled reason when registered", () => {
    expect(
      deriveAccountPanelActionsShell({
        authUiState: "sip_registered",
        form: filledForm,
        submitting: false,
        panelDisabled: false,
        sessionLogoutDisabledReason: "session.logout.disabled.inProgress",
      }),
    ).toEqual({
      authorizeDisabledReason: "account.actions.disabled.alreadyAuthorized",
      logoutDisabledReason: "session.logout.disabled.inProgress",
    });
  });
});
