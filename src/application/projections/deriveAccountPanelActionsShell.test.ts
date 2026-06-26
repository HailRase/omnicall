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
      authorizeDisabledReason: "Вы уже в сети. Для смены аккаунта нажмите «Выйти»",
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
      logoutDisabledReason: "Заполните поля и нажмите «Авторизоваться»",
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
      logoutDisabledReason: "Сначала нажмите «Авторизоваться»",
    });
  });

  it("prefers session logout disabled reason when registered", () => {
    expect(
      deriveAccountPanelActionsShell({
        authUiState: "sip_registered",
        form: filledForm,
        submitting: false,
        panelDisabled: false,
        sessionLogoutDisabledReason: "Выход выполняется",
      }),
    ).toEqual({
      authorizeDisabledReason: "Вы уже в сети. Для смены аккаунта нажмите «Выйти»",
      logoutDisabledReason: "Выход выполняется",
    });
  });
});
