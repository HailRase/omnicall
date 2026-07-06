// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountPanel } from "./AccountPanel.js";

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

  it("renders styled success feedback", () => {
    render(
      <AccountPanel
        {...baseProps}
        successKey="account.success.authorizationSucceeded"
        authorizeDisabledReason="Вы уже в сети. Для смены аккаунта нажмите «Выйти»"
        logoutDisabledReason={null}
      />,
    );

    expect(screen.getByTestId("account-success")).toHaveTextContent("Авторизация выполнена");
  });

  it("renders localized error feedback", () => {
    render(
      <AccountPanel
        {...baseProps}
        error={{ key: "account.error.invalidCredentials" }}
        authorizeDisabledReason={null}
        logoutDisabledReason="Сначала нажмите «Авторизоваться»"
      />,
    );

    expect(screen.getByTestId("account-error")).toHaveTextContent("Неверный логин или пароль");
  });

  it("renders password-only panel for saved profile sign-in", () => {
    render(
      <AccountPanel
        {...baseProps}
        panelMode="savedPasswordOnly"
        form={{ ...baseForm, password: "" }}
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
});
