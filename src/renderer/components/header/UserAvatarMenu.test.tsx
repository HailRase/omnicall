// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserAvatarMenu } from "./UserAvatarMenu.js";

afterEach(() => {
  cleanup();
});

const baseProps = {
  open: true,
  menuRef: { current: null },
  position: { top: 12, left: 24 },
  dndEnabled: false,
  dndDisabledReason: null,
  logoutDisabledReason: null,
  onOpenSettings: vi.fn(),
  onToggleDnd: vi.fn(),
  onLogout: vi.fn(),
};

describe("UserAvatarMenu", () => {
  it("renders settings, DND, and logout items in Russian", () => {
    render(<UserAvatarMenu {...baseProps} />);

    expect(screen.getByTestId("user-menu-open-settings")).toHaveTextContent("Настройки");
    expect(screen.getByTestId("user-menu-toggle-dnd")).toHaveTextContent('Вкл. "Не беспокоить"');
    expect(screen.getByTestId("user-menu-logout")).toHaveTextContent("Выход");
  });

  it("shows orange DND label when enabled", () => {
    render(<UserAvatarMenu {...baseProps} dndEnabled />);

    const dndItem = screen.getByTestId("user-menu-toggle-dnd");
    expect(dndItem).toHaveTextContent('Выкл. "Не беспокоить"');
    expect(dndItem.className).toMatch(/itemDndActive/);
  });

  it("invokes callbacks for menu actions", () => {
    const onOpenSettings = vi.fn();
    const onToggleDnd = vi.fn();
    const onLogout = vi.fn();

    render(
      <UserAvatarMenu
        {...baseProps}
        onOpenSettings={onOpenSettings}
        onToggleDnd={onToggleDnd}
        onLogout={onLogout}
      />,
    );

    fireEvent.click(screen.getByTestId("user-menu-open-settings"));
    fireEvent.click(screen.getByTestId("user-menu-toggle-dnd"));
    fireEvent.click(screen.getByTestId("user-menu-logout"));

    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onToggleDnd).toHaveBeenCalledOnce();
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("disables DND toggle when registration reason is provided", () => {
    render(<UserAvatarMenu {...baseProps} dndDisabledReason="Не зарегистрирован" />);

    const dndItem = screen.getByTestId("user-menu-toggle-dnd");
    expect(dndItem).toBeDisabled();
    expect(dndItem).toHaveAttribute("title", "Не зарегистрирован");
  });

  it("always renders logout item", () => {
    render(<UserAvatarMenu {...baseProps} logoutDisabledReason="Регистрация выполняется" />);

    const logoutItem = screen.getByTestId("user-menu-logout");
    expect(logoutItem).toHaveTextContent("Выход");
    expect(logoutItem).toBeDisabled();
  });
});
