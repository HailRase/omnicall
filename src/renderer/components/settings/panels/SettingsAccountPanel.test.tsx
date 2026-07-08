// @vitest-environment jsdom

import type { ComponentProps } from "react";

import { createRef } from "react";

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSettingsAccountKey } from "@application/index.js";

import { setRendererLanguage } from "../../../i18n/index.js";

import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";

import { SettingsAccountPanel } from "./SettingsAccountPanel.js";



beforeEach(() => {

  setupJsdomRadix();

});



afterEach(() => {

  cleanup();

  setRendererLanguage("ru");

});



const profileId = createSettingsAccountKey("1001@pbx.example.com");



const baseProps = {

  form: {

    username: "1001",

    password: "",

    domain: "pbx.example.com",

    server: "wss://sip.example.com",

  },

  submitting: false,

  error: null,

  successKey: null,

  warningKey: null,

  panelMode: "newFull" as const,

  disabled: false,

  authorizeDisabledReason: "Вы уже в сети. Для смены аккаунта нажмите «Выйти»",

  logoutDisabledReason: null,

  savedProfileOptions: [{ id: profileId, label: "1001" }],

  selectedProfileId: null,

  saveProfileChecked: false,

  saveProfileDisabled: false,

  saveProfileDisabledReasonKey: null,

  rememberPasswordChecked: false,

  passwordFieldVisible: true,

  rememberPasswordVisible: false,

  forgetRememberedPasswordVisible: false,

  rememberPasswordDisabled: true,

  rememberPasswordDisabledReasonKey: "account.profile.rememberPassword.disabledRequiresSave",

  passwordHintKey: null,

  deleteConfirmationOpen: false,
  switchConfirmationOpen: false,
  switchFromLogin: "",
  switchToLogin: "",
  passwordInputRef: createRef<HTMLInputElement>(),

  onFieldChange: vi.fn(),

  onSubmit: vi.fn(),

  onLogout: vi.fn(),

  onProfileSelect: vi.fn(),

  onSaveProfileChange: vi.fn(),

  onRememberPasswordChange: vi.fn(),

  onForgetRememberedPassword: vi.fn(),

  onDeleteProfileRequest: vi.fn(),

  onDeleteProfileConfirm: vi.fn(),

  onDeleteProfileCancel: vi.fn(),

  onSwitchProfileConfirm: vi.fn(),

  onSwitchProfileCancel: vi.fn(),

} as const;



function renderPanel(

  props: Partial<ComponentProps<typeof SettingsAccountPanel>> = {},

): void {

  setRendererLanguage("ru");

  render(<SettingsAccountPanel {...baseProps} {...props} />);

}



describe("SettingsAccountPanel", () => {

  it("renders profile tabs and account form", () => {

    renderPanel();



    expect(screen.getByTestId("settings-account-panel")).toBeInTheDocument();

    expect(screen.getByTestId("saved-account-profile-selector")).toBeInTheDocument();

    expect(screen.getByTestId("saved-account-profile-tablist")).toBeInTheDocument();

    expect(screen.getByTestId("account-panel")).toBeInTheDocument();

  });



  it("shows save profile checkbox only for New selection", () => {

    renderPanel();

    expect(screen.getByTestId("account-save-profile-checkbox")).toBeInTheDocument();



    cleanup();

    renderPanel({ selectedProfileId: profileId, panelMode: "savedPasswordOnly" });

    expect(screen.queryByTestId("account-save-profile-checkbox")).not.toBeInTheDocument();

  });



  it("shows password-only panel for unauthenticated saved profile", () => {

    renderPanel({

      selectedProfileId: profileId,

      panelMode: "savedPasswordOnly",

      passwordFieldVisible: true,

      passwordHintKey: "account.profile.passwordHint.savedProfile",

    });



    expect(screen.queryByTestId("account-username")).not.toBeInTheDocument();

    expect(screen.getByTestId("account-password-hint")).toHaveTextContent(

      "Введите пароль для выбранного профиля",

    );

  });



  it("shows sign-in only when saved profile has remembered password", () => {

    renderPanel({

      selectedProfileId: profileId,

      panelMode: "savedPasswordOnly",

      passwordFieldVisible: false,

      passwordHintKey: null,

      rememberPasswordVisible: false,

      forgetRememberedPasswordVisible: true,

    });



    expect(screen.queryByTestId("account-password")).not.toBeInTheDocument();

    expect(screen.queryByTestId("account-password-hint")).not.toBeInTheDocument();

    expect(screen.queryByTestId("account-remember-password-row")).not.toBeInTheDocument();

    expect(screen.getByTestId("account-authorize")).toHaveTextContent("Войти");

    expect(screen.getByTestId("account-forget-remembered-password")).toBeInTheDocument();

  });



  it("shows active session password in full form for registered saved profile", () => {

    renderPanel({

      selectedProfileId: profileId,

      panelMode: "savedFull",

      form: {

        username: "1001",

        password: "session-secret",

        domain: "pbx.example.com",

        server: "wss://sip.example.com",

      },

    });



    expect(screen.getByTestId("account-password")).toHaveValue("session-secret");

    expect(screen.getByTestId("account-password")).toHaveAttribute("type", "password");

  });



  it("shows full form for currently registered saved profile", () => {

    renderPanel({

      selectedProfileId: profileId,

      panelMode: "savedFull",

      form: {

        username: "1001",

        password: "",

        domain: "pbx.example.com",

        server: "wss://sip.example.com",

      },

    });



    expect(screen.getByTestId("account-username")).toBeInTheDocument();

    expect(screen.getByTestId("account-domain")).toBeInTheDocument();

  });



  it("opens delete confirmation modal", () => {

    renderPanel({

      selectedProfileId: profileId,

      deleteConfirmationOpen: true,

    });



    expect(screen.getByTestId("delete-saved-account-profile-modal")).toBeInTheDocument();

  });



  it("requests profile delete when trash icon on tab is clicked", async () => {

    const user = userEvent.setup();

    const onDeleteProfileRequest = vi.fn();

    renderPanel({ onDeleteProfileRequest });



    await user.click(screen.getByTestId("saved-account-profile-tab-delete"));



    expect(onDeleteProfileRequest).toHaveBeenCalledWith(profileId);

    expect(onDeleteProfileRequest).toHaveBeenCalledOnce();

  });



  it("confirms profile delete from alert dialog", async () => {

    const user = userEvent.setup();

    const onDeleteProfileConfirm = vi.fn();

    renderPanel({

      deleteConfirmationOpen: true,

      onDeleteProfileConfirm,

    });



    await user.click(screen.getByTestId("delete-saved-account-profile-confirm"));

    expect(onDeleteProfileConfirm).toHaveBeenCalledOnce();

  });



  it("opens switch confirmation modal", () => {

    renderPanel({

      switchConfirmationOpen: true,

      switchFromLogin: "1001",

      switchToLogin: "1002",

    });



    expect(screen.getByTestId("switch-saved-account-profile-modal")).toBeInTheDocument();

    expect(

      screen.getByText("Вы уверены, что хотите сменить профиль с 1001 на 1002?"),

    ).toBeInTheDocument();

  });



  it("toggles save profile checkbox", () => {

    const onSaveProfileChange = vi.fn();

    renderPanel({ onSaveProfileChange });



    fireEvent.click(screen.getByTestId("account-save-profile-checkbox"));

    expect(onSaveProfileChange).toHaveBeenCalledWith(true);

  });



  it("does not render legacy inline account authorization error", () => {

    renderPanel({ error: { key: "account.error.networkOrTransport" } });



    expect(screen.queryByTestId("account-error")).not.toBeInTheDocument();

  });

});

