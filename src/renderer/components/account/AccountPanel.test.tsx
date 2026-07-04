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

describe("AccountPanel", () => {
  it("renders authorize and logout buttons with disabled reasons", () => {
    render(
      <AccountPanel
        form={baseForm}
        submitting={false}
        error={null}
        successKey={null}
        authorizeDisabledReason="Вы уже в сети. Для смены аккаунта нажмите «Выйти»"
        logoutDisabledReason={null}
        onFieldChange={vi.fn()}
        onSubmit={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-authorize")).toBeDisabled();
    expect(screen.getByTestId("account-logout")).toBeEnabled();
  });

  it("enables authorize and disables logout when not registered", () => {
    render(
      <AccountPanel
        form={{ username: "", password: "", domain: "", server: "" }}
        submitting={false}
        error={null}
        successKey={null}
        authorizeDisabledReason={null}
        logoutDisabledReason="Заполните поля и нажмите «Авторизоваться»"
        onFieldChange={vi.fn()}
        onSubmit={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-authorize")).toBeEnabled();
    expect(screen.getByTestId("account-logout")).toBeDisabled();
  });

  it("invokes logout callback", () => {
    const onLogout = vi.fn();

    render(
      <AccountPanel
        form={baseForm}
        submitting={false}
        error={null}
        successKey={null}
        authorizeDisabledReason="Вы уже в сети. Для смены аккаунта нажмите «Выйти»"
        logoutDisabledReason={null}
        onFieldChange={vi.fn()}
        onSubmit={vi.fn()}
        onLogout={onLogout}
      />,
    );

    fireEvent.click(screen.getByTestId("account-logout"));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("renders styled success feedback", () => {
    render(
      <AccountPanel
        form={baseForm}
        submitting={false}
        error={null}
        successKey="account.success.authorizationSucceeded"
        authorizeDisabledReason="Вы уже в сети. Для смены аккаунта нажмите «Выйти»"
        logoutDisabledReason={null}
        onFieldChange={vi.fn()}
        onSubmit={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-success")).toHaveTextContent("Авторизация выполнена");
  });
});
