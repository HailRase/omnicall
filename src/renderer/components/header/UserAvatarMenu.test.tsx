// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ICON_TOOLTIP_DELAY_MS } from "../icons/iconTooltipDelay.js";
import { UserAvatarMenu } from "./UserAvatarMenu.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

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

  it("shows disabled reason in tooltip when DND toggle is blocked", () => {
    render(<UserAvatarMenu {...baseProps} dndDisabledReason="Не зарегистрирован" />);

    const dndItem = screen.getByTestId("user-menu-toggle-dnd");
    expect(dndItem).toBeDisabled();
    expect(dndItem).not.toHaveAttribute("title");

    const tooltipHost = dndItem.parentElement;
    expect(tooltipHost).toHaveAttribute("data-testid", "icon-tooltip-host");
    fireEvent.pointerEnter(tooltipHost as Element);
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Не зарегистрирован");
  });

  it("always renders logout item", () => {
    render(<UserAvatarMenu {...baseProps} logoutDisabledReason="Регистрация выполняется" />);

    const logoutItem = screen.getByTestId("user-menu-logout");
    expect(logoutItem).toHaveTextContent("Выход");
    expect(logoutItem).toBeDisabled();
  });
});
