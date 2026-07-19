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
  identity: {
    displayName: "alex.operator",
    sipStatusLabel: "Зарегистрирован",
    sipStatusTimerSuffix: null as string | null,
    sipStatusTone: "registered" as const,
  },
  dndEnabled: false,
  dndDisabledReason: null,
  historyDisabledReason: null,
  contactsDisabledReason: null,
  logoutDisabledReason: null,
  onOpenSettings: vi.fn(),
  onOpenHistory: vi.fn(),
  onOpenContacts: vi.fn(),
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

  it("renders non-selectable identity header before action items", () => {
    render(<UserAvatarMenu {...baseProps} />);

    const menu = screen.getByTestId("user-avatar-menu");
    const identity = screen.getByTestId("user-menu-identity");
    const menuChildren = Array.from(menu.children);

    expect(identity).toHaveAttribute("role", "presentation");
    expect(identity).toHaveTextContent("alex.operator");
    expect(screen.getByTestId("user-sip-status")).toHaveTextContent("Зарегистрирован");
    expect(screen.getByTestId("user-header-identity")).toHaveAttribute("data-variant", "menu");
    expect(menuChildren[0]).toBe(identity);
    expect(menuChildren[1]).toHaveAttribute("role", "separator");
    expect(screen.getByTestId("user-menu-open-contacts")).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /alex\.operator/i })).not.toBeInTheDocument();
  });

  it("renders recovery timer in identity header", () => {
    render(
      <UserAvatarMenu
        {...baseProps}
        identity={{
          displayName: "agent",
          sipStatusLabel: "Не зарегистрирован",
          sipStatusTimerSuffix: "04:59",
          sipStatusTone: "not_registered",
        }}
      />,
    );

    expect(screen.getByTestId("user-sip-status")).toHaveTextContent("Не зарегистрирован");
    expect(screen.getByTestId("user-sip-status-timer")).toHaveTextContent("04:59");
  });

  it("omits identity header when identity is null", () => {
    render(<UserAvatarMenu {...baseProps} identity={null} />);

    expect(screen.queryByTestId("user-menu-identity")).not.toBeInTheDocument();
    expect(screen.getByTestId("user-menu-open-contacts")).toBeInTheDocument();
  });

  it("renders settings, contacts, history, DND, and logout items in Russian", () => {
    render(<UserAvatarMenu {...baseProps} />);

    expect(screen.getByTestId("user-menu-open-contacts")).toHaveTextContent("Контакты");
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

  it("disables contacts and history when navigation is blocked", () => {
    render(
      <UserAvatarMenu
        {...baseProps}
        contactsDisabledReason="Сначала войдите в аккаунт"
        historyDisabledReason="Сначала войдите в аккаунт"
      />,
    );

    expect(screen.getByTestId("user-menu-open-contacts")).toBeDisabled();
    expect(screen.getByTestId("user-menu-open-history")).toBeDisabled();
  });

  it("always renders logout item", () => {
    render(<UserAvatarMenu {...baseProps} logoutDisabledReason="Регистрация выполняется" />);

    const logoutItem = screen.getByTestId("user-menu-logout");
    expect(logoutItem).toHaveTextContent("Выход");
    expect(logoutItem).toBeDisabled();
  });
});
