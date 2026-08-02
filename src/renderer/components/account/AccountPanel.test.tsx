// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../test/setupJsdomRadix.js";
import { AccountPanel } from "./AccountPanel.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

const baseForm = {
  username: "user",
  password: "secret",
  domain: "example.com",
  server: "sip.example.com",
};

const baseOcpDraft = {
  login: "user",
  domain: "ocp.example.com",
  apiKey: "",
};

const baseProps = {
  form: baseForm,
  ocpDraft: baseOcpDraft,
  signInMode: "sip_only" as const,
  submitting: false,
  error: null,
  successKey: null,
  warningKey: null,
  panelMode: "newFull" as const,
  onFieldChange: vi.fn(),
  onOcpFieldChange: vi.fn(),
  onSignInModeChange: vi.fn(),
  onSubmit: vi.fn(),
};

describe("AccountPanel", () => {
  it("renders mode tabs and sign-in button with disabled logout-first reason", () => {
    render(
      <AccountPanel
        {...baseProps}
        authorizeDisabledReason="Необходимо выйти из аккаунта"
      />,
    );

    expect(screen.getByTestId("account-mode-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("account-mode-tabs")).toHaveAttribute(
      "data-indicator",
      "slide",
    );
    expect(screen.getByTestId("ui-tabs-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("account-mode-sip")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("account-mode-ocp")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("account-mode-sip")).toBeInTheDocument();
    expect(screen.getByTestId("account-mode-ocp")).toBeInTheDocument();
    expect(screen.getByTestId("account-authorize")).toBeDisabled();
    expect(screen.getByTestId("account-authorize")).toHaveTextContent("Войти");
    expect(screen.queryByTestId("account-logout")).not.toBeInTheDocument();
  });

  it("enables sign-in when not registered", () => {
    render(
      <AccountPanel
        {...baseProps}
        form={{ username: "", password: "", domain: "", server: "" }}
        authorizeDisabledReason={null}
      />,
    );

    expect(screen.getByTestId("account-authorize")).toBeEnabled();
    expect(screen.queryByTestId("account-logout")).not.toBeInTheDocument();
  });

  it("switches mode via accessible tabs", async () => {
    const user = userEvent.setup();
    const onSignInModeChange = vi.fn();

    render(
      <AccountPanel
        {...baseProps}
        authorizeDisabledReason={null}
        onSignInModeChange={onSignInModeChange}
      />,
    );

    await user.click(screen.getByTestId("account-mode-ocp"));
    expect(onSignInModeChange).toHaveBeenCalledWith("ocp");
  });

  it("renders persistent error feedback without legacy success feedback", () => {
    render(
      <AccountPanel
        {...baseProps}
        successKey="account.success.sipRegistrationSucceeded"
        error={{ key: "account.error.invalidCredentials" }}
        authorizeDisabledReason={null}
      />,
    );

    expect(screen.queryByTestId("account-success")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-error")).toHaveTextContent(
      "Неверный логин или пароль",
    );
    expect(screen.queryByTestId("account-error-open-system-state")).not.toBeInTheDocument();
  });

  it("renders System State action on persistent account error when requested", async () => {
    const user = userEvent.setup();
    const onOpenSystemState = vi.fn();
    render(
      <AccountPanel
        {...baseProps}
        error={{ key: "account.error.authorizationFailed" }}
        openSystemStateAction
        onOpenSystemState={onOpenSystemState}
        authorizeDisabledReason={null}
      />,
    );

    await user.click(screen.getByTestId("account-error-open-system-state"));
    expect(onOpenSystemState).toHaveBeenCalledTimes(1);
  });

  it("renders parameterized serverRegistration error without crashing", () => {
    render(
      <AccountPanel
        {...baseProps}
        error={{
          key: "account.error.serverRegistration",
          params: { detail: "403 Forbidden" },
        }}
        authorizeDisabledReason={null}
      />,
    );

    expect(screen.getByTestId("account-error")).toHaveTextContent(
      "Ошибка регистрации на сервере: 403 Forbidden",
    );
  });

  it("toggles password visibility", () => {
    render(<AccountPanel {...baseProps} authorizeDisabledReason={null} />);

    const passwordInput = screen.getByTestId("account-password");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByTestId("account-password-visibility-toggle"));
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("renders SIP fields without login for a saved profile", () => {
    render(
      <AccountPanel
        {...baseProps}
        panelMode="savedPasswordOnly"
        form={{ ...baseForm, password: "" }}
        passwordFieldVisible
        authorizeDisabledReason={null}
      />,
    );

    expect(screen.queryByTestId("account-username")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-password")).toBeInTheDocument();
    expect(screen.getByTestId("account-domain")).toHaveValue("example.com");
    expect(screen.getByTestId("account-server")).toHaveValue("sip.example.com");
    expect(screen.getByTestId("account-authorize")).toHaveTextContent("Войти");
  });

  it("forgets a remembered password from a saved profile", async () => {
    const onForgetSavedSipPassword = vi.fn();
    render(
      <AccountPanel
        {...baseProps}
        panelMode="savedPasswordOnly"
        canForgetSavedSipPassword
        onForgetSavedSipPassword={onForgetSavedSipPassword}
        authorizeDisabledReason={null}
      />,
    );

    await userEvent.click(screen.getByTestId("account-forget-saved-password"));
    expect(onForgetSavedSipPassword).toHaveBeenCalledOnce();
  });

  it("renders OCP fields and never prefills API key from storage", () => {
    render(
      <AccountPanel
        {...baseProps}
        signInMode="ocp"
        ocpDraft={{ login: "agent", domain: "", apiKey: "" }}
        showOcpDomainField
        showOcpApiKeyField
        hasSavedOcpApiKey
        authorizeDisabledReason={null}
      />,
    );

    expect(screen.getByTestId("account-ocp-login")).toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-domain")).toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-api-key")).toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-api-key")).toHaveValue("");
    expect(
      screen.getByTestId("account-ocp-api-key-visibility-toggle"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("account-sign-in-methods")).not.toBeInTheDocument();
  });

  it("shows domain and API key for a complete OCP profile", () => {
    render(
      <AccountPanel
        {...baseProps}
        signInMode="ocp"
        showOcpDomainField
        showOcpApiKeyField
        showOcpLoginField={false}
        authorizeDisabledReason={null}
      />,
    );

    expect(screen.queryByTestId("account-ocp-login")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-domain")).toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-api-key")).toBeInTheDocument();
  });

  it("does not render retry-server action in Account", () => {
    const onRecoveryAction = vi.fn();

    render(
      <AccountPanel
        {...baseProps}
        signInMode="ocp"
        authorizeDisabledReason={null}
        allowedRecoveryActions={["retry_server"]}
        onRecoveryAction={onRecoveryAction}
      />,
    );

    expect(screen.queryByTestId("account-recovery-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-server-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-authorization-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-auth-retry")).not.toBeInTheDocument();
    expect(onRecoveryAction).not.toHaveBeenCalled();
  });

  it("renders remember password checkbox on new profile form", () => {
    render(
      <AccountPanel
        {...baseProps}
        rememberPasswordVisible
        rememberPasswordChecked={false}
        rememberPasswordDisabled
        authorizeDisabledReason={null}
        onRememberPasswordChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-remember-password-checkbox")).toBeDisabled();
    expect(
      screen.queryByText("Сначала включите «Сохранить профиль»"),
    ).not.toBeInTheDocument();
  });

  it("does not render save-profile helper description", () => {
    render(
      <AccountPanel
        {...baseProps}
        saveProfileVisible
        saveProfileChecked={false}
        authorizeDisabledReason={null}
        onSaveProfileChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-save-profile-checkbox")).toBeInTheDocument();
    expect(
      screen.queryByText("Сохранить имя пользователя, домен и сервер для быстрого входа"),
    ).not.toBeInTheDocument();
  });

  it("does not render OCP login profile picker on new tab", () => {
    render(
      <AccountPanel
        {...baseProps}
        signInMode="ocp"
        authorizeDisabledReason={null}
      />,
    );

    expect(screen.getByTestId("account-ocp-login")).toBeInTheDocument();
    expect(screen.queryByTestId("account-ocp-login-select-trigger")).not.toBeInTheDocument();
  });

  it("keeps Account free of authorization progress status", () => {
    render(
      <AccountPanel
        {...baseProps}
        authorizeDisabledReason={null}
      />,
    );
    expect(screen.getByTestId("account-panel")).toBeInTheDocument();
  });

});
