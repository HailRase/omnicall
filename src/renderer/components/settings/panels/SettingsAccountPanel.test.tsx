// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { createRef } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsAccountKey } from "@application/index.js";
import { initialAuthorizationProgressProjection } from "@application/projections/settings/authorizationProgressProjection.js";
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
  ocpDraft: { login: "1001", domain: "", apiKey: "" },
  signInMode: "sip_only" as const,
  submitting: false,
  error: null,
  successKey: null,
  warningKey: null,
  panelMode: "newFull" as const,
  disabled: false,
  authorizeDisabledReason: "Необходимо выйти из аккаунта",
  savedProfileOptions: [{ id: profileId, label: "1001" }],
  selectedProfileId: null,
  saveProfileChecked: false,
  saveProfileDisabled: false,
  saveProfileDisabledReasonKey: null,
  rememberPasswordChecked: false,
  passwordFieldVisible: true,
  rememberPasswordVisible: false,
  rememberPasswordDisabled: true,
  passwordHintKey: null,
  showOcpDomainField: true,
  showOcpApiKeyField: true,
  hasSavedOcpApiKey: false,
  allowedRecoveryActions: [],
  onRecoveryAction: vi.fn(),
  authorizationProgress: initialAuthorizationProgressProjection(),
  deleteConfirmationOpen: false,
  passwordInputRef: createRef<HTMLInputElement>(),
  onFieldChange: vi.fn(),
  onOcpFieldChange: vi.fn(),
  onSignInModeChange: vi.fn(),
  onSubmit: vi.fn(),
  onProfileSelect: vi.fn(),
  onSaveProfileChange: vi.fn(),
  onRememberPasswordChange: vi.fn(),
  onDeleteProfileRequest: vi.fn(),
  onDeleteProfileConfirm: vi.fn(),
  onDeleteProfileCancel: vi.fn(),
} as const;

function renderPanel(
  props: Partial<ComponentProps<typeof SettingsAccountPanel>> = {},
): void {
  setRendererLanguage("ru");
  render(<SettingsAccountPanel {...baseProps} {...props} />);
}

describe("SettingsAccountPanel", () => {
  it("renders profile tabs and account form with mode tabs", () => {
    renderPanel();

    expect(screen.getByTestId("settings-account-panel")).toBeInTheDocument();
    expect(screen.getByTestId("saved-account-profile-selector")).toBeInTheDocument();
    expect(screen.getByTestId("account-panel")).toBeInTheDocument();
    expect(screen.getByTestId("account-mode-tabs")).toBeInTheDocument();
    expect(screen.queryByTestId("account-logout")).not.toBeInTheDocument();
  });

  it("shows first-run hint when there are no saved profiles", () => {
    renderPanel({ savedProfileOptions: [] });

    expect(screen.getByTestId("settings-account-first-run-hint")).toBeInTheDocument();
    expect(screen.getByText(/Первый вход/)).toBeInTheDocument();
  });

  it("hides first-run hint when saved profiles exist", () => {
    renderPanel();
    expect(
      screen.queryByTestId("settings-account-first-run-hint"),
    ).not.toBeInTheDocument();
  });

  it("shows save profile checkbox only for New selection in SIP mode", () => {
    renderPanel();
    expect(screen.getByTestId("account-save-profile-checkbox")).toBeInTheDocument();

    cleanup();
    renderPanel({ selectedProfileId: profileId, panelMode: "savedPasswordOnly" });
    expect(screen.queryByTestId("account-save-profile-checkbox")).not.toBeInTheDocument();
  });

  it("shows SIP data for an unauthenticated saved profile", () => {
    renderPanel({
      selectedProfileId: profileId,
      panelMode: "savedPasswordOnly",
      passwordFieldVisible: true,
    });

    expect(screen.queryByTestId("account-username")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-domain")).toHaveValue("pbx.example.com");
    expect(screen.getByTestId("account-server")).toHaveValue("wss://sip.example.com");
  });

  it("shows complete SIP data for a saved profile", () => {
    renderPanel({
      selectedProfileId: profileId,
      panelMode: "savedPasswordOnly",
      form: {
        username: "1001",
        password: "saved-secret",
        domain: "pbx.example.com",
        server: "wss://sip.example.com",
      },
    });

    expect(screen.getByTestId("account-password")).toHaveValue("saved-secret");
    expect(screen.getByTestId("account-domain")).toHaveValue("pbx.example.com");
    expect(screen.getByTestId("account-server")).toHaveValue("wss://sip.example.com");
    expect(screen.getByTestId("account-authorize")).toHaveTextContent("Войти");
    expect(screen.queryByTestId("account-forget-remembered-password")).not.toBeInTheDocument();
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
  });

  it("does not render switch confirmation modal", () => {
    renderPanel();
    expect(screen.queryByTestId("switch-saved-account-profile-modal")).not.toBeInTheDocument();
  });

  it("toggles save profile checkbox", () => {
    const onSaveProfileChange = vi.fn();
    renderPanel({ onSaveProfileChange });

    fireEvent.click(screen.getByTestId("account-save-profile-checkbox"));
    expect(onSaveProfileChange).toHaveBeenCalledWith(true);
  });

  it("renders OCP mode with incomplete profile fields", () => {
    renderPanel({
      signInMode: "ocp",
      showOcpDomainField: true,
      showOcpApiKeyField: true,
      authorizeDisabledReason: null,
    });

    expect(screen.getByTestId("account-ocp-login")).toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-domain")).toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-api-key")).toBeInTheDocument();
    expect(screen.queryByTestId("account-sign-in-methods")).not.toBeInTheDocument();
  });

  it("does not render retry-server action in Account", () => {
    const onRecoveryAction = vi.fn();
    renderPanel({
      signInMode: "ocp",
      authorizeDisabledReason: null,
      allowedRecoveryActions: ["retry_server"],
      onRecoveryAction,
    });

    expect(screen.queryByTestId("account-auth-retry")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-server-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-recovery-actions")).not.toBeInTheDocument();
    expect(onRecoveryAction).not.toHaveBeenCalled();
  });

  it("does not render authorization progress in Account", () => {
    renderPanel({
      successKey: "account.success.sipRegistrationSucceeded",
    });

    expect(screen.queryByTestId("account-auth-progress")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-success")).not.toBeInTheDocument();
  });

  it("disables overwrite dialog actions while sign-in is submitting", () => {
    renderPanel({
      overwriteConfirmationOpen: true,
      submitting: true,
    });

    expect(screen.getByTestId("overwrite-saved-account-credentials-cancel")).toBeDisabled();
    expect(screen.getByTestId("overwrite-saved-account-credentials-continue")).toBeDisabled();
    expect(screen.getByTestId("overwrite-saved-account-credentials-more")).toBeDisabled();
  });
});
