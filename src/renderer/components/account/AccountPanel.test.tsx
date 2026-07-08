// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

const baseProps = {
  form: baseForm,
  submitting: false,
  error: null,
  successKey: null,
  warningKey: null,
  panelMode: "newFull" as const,
  onFieldChange: vi.fn(),
  onSubmit: vi.fn(),
  onLogout: vi.fn(),
};

describe("AccountPanel", () => {
  it("renders authorize and logout buttons with disabled reasons", () => {
    render(
      <AccountPanel
        {...baseProps}
        authorizeDisabledReason="Вы уже в сети. Для смены аккаунта нажмите «Выйти»"
        logoutDisabledReason={null}
      />,
    );

    expect(screen.getByTestId("account-authorize")).toBeDisabled();
    expect(screen.getByTestId("account-logout")).toBeEnabled();
  });

  it("enables authorize and disables logout when not registered", () => {
    render(
      <AccountPanel
        {...baseProps}
        form={{ username: "", password: "", domain: "", server: "" }}
        authorizeDisabledReason={null}
        logoutDisabledReason="Заполните поля и нажмите «Авторизоваться»"
      />,
    );

    expect(screen.getByTestId("account-authorize")).toBeEnabled();
    expect(screen.getByTestId("account-logout")).toBeDisabled();
  });

  it("invokes logout callback", () => {
    const onLogout = vi.fn();

    render(
      <AccountPanel
        {...baseProps}
        authorizeDisabledReason="Вы уже в сети. Для смены аккаунта нажмите «Выйти»"
        logoutDisabledReason={null}
        onLogout={onLogout}
      />,
    );

    fireEvent.click(screen.getByTestId("account-logout"));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("does not render legacy inline success or error feedback", () => {
    render(
      <AccountPanel
        {...baseProps}
        successKey="account.success.authorizationSucceeded"
        error={{ key: "account.error.invalidCredentials" }}
        authorizeDisabledReason="Вы уже в сети. Для смены аккаунта нажмите «Выйти»"
        logoutDisabledReason={null}
      />,
    );

    expect(screen.queryByTestId("account-success")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-error")).not.toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    render(
      <AccountPanel
        {...baseProps}
        authorizeDisabledReason={null}
        logoutDisabledReason={null}
      />,
    );

    const passwordInput = screen.getByTestId("account-password");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByTestId("account-password-visibility-toggle"));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByTestId("account-password-visibility-toggle"));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders password-only panel for saved profile sign-in", () => {
    render(
      <AccountPanel
        {...baseProps}
        panelMode="savedPasswordOnly"
        form={{ ...baseForm, password: "" }}
        passwordFieldVisible
        passwordHintKey="account.profile.passwordHint.savedProfile"
        authorizeDisabledReason={null}
        logoutDisabledReason={null}
      />,
    );

    expect(screen.queryByTestId("account-username")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-password")).toBeInTheDocument();
    expect(screen.getByTestId("account-password-hint")).toBeInTheDocument();
    expect(screen.queryByTestId("account-logout")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-authorize")).toHaveTextContent("Войти");
  });

  it("renders sign-in only when saved profile has remembered password", () => {
    render(
      <AccountPanel
        {...baseProps}
        panelMode="savedPasswordOnly"
        form={{ ...baseForm, password: "" }}
        passwordFieldVisible={false}
        authorizeDisabledReason={null}
        logoutDisabledReason={null}
      />,
    );

    expect(screen.queryByTestId("account-password")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-password-hint")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-remember-password-row")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-authorize")).toHaveTextContent("Войти");
  });

  it("renders remember password checkbox on new profile form", () => {
    render(
      <AccountPanel
        {...baseProps}
        rememberPasswordVisible
        rememberPasswordChecked={false}
        rememberPasswordDisabled
        rememberPasswordDisabledReasonKey="account.profile.rememberPassword.disabledRequiresSave"
        authorizeDisabledReason={null}
        logoutDisabledReason={null}
        onRememberPasswordChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-remember-password-checkbox")).toBeDisabled();
  });

  it("enables remember password checkbox when save profile is enabled", () => {
    const onRememberPasswordChange = vi.fn();

    render(
      <AccountPanel
        {...baseProps}
        saveProfileVisible
        saveProfileChecked
        rememberPasswordVisible
        rememberPasswordChecked={false}
        rememberPasswordDisabled={false}
        authorizeDisabledReason={null}
        logoutDisabledReason={null}
        onSaveProfileChange={vi.fn()}
        onRememberPasswordChange={onRememberPasswordChange}
      />,
    );

    fireEvent.click(screen.getByTestId("account-remember-password-checkbox"));
    expect(onRememberPasswordChange).toHaveBeenCalledWith(true);
  });
});
