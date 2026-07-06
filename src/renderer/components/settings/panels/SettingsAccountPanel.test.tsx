// @vitest-environment jsdom

import type { ComponentProps } from "react";

import { createRef } from "react";

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createSettingsAccountKey } from "@application/index.js";

import { setRendererLanguage } from "../../../i18n/index.js";

import { SettingsAccountPanel } from "./SettingsAccountPanel.js";



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

      passwordHintKey: "account.profile.passwordHint.savedProfile",

    });



    expect(screen.queryByTestId("account-username")).not.toBeInTheDocument();

    expect(screen.getByTestId("account-password-hint")).toHaveTextContent(

      "Введите пароль для выбранного профиля",

    );

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

