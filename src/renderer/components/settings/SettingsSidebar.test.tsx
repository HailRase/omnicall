// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ICON_TOOLTIP_DELAY_MS } from "../icons/iconTooltipDelay.js";
import { SettingsSidebar } from "./SettingsSidebar.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SettingsSidebar", () => {
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

  it("expands flyout without changing rail width marker", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();

    render(
      <SettingsSidebar
        activeSection="general"
        expanded={false}
        onSectionChange={vi.fn()}
        onToggleExpanded={onToggleExpanded}
      />,
    );

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-expanded", "false");

    await user.click(screen.getByTestId("settings-sidebar-expand"));
    expect(onToggleExpanded).toHaveBeenCalledOnce();
  });

  it("shows labels when expanded", () => {
    render(
      <SettingsSidebar
        activeSection="account"
        expanded
        onSectionChange={vi.fn()}
        onToggleExpanded={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByText("Аккаунт")).toBeVisible();
    expect(screen.getByText("Диагностика")).toBeVisible();
  });

  it("shows full system-state label without truncation when expanded", () => {
    render(
      <SettingsSidebar
        activeSection="system-state"
        expanded
        onSectionChange={vi.fn()}
        onToggleExpanded={vi.fn()}
      />,
    );

    const label = screen.getByText("Состояние системы");
    expect(label).toBeVisible();
    expect(label.textContent).toBe("Состояние системы");
  });

  it("shows section tooltip on collapsed nav hover", () => {
    render(
      <SettingsSidebar
        activeSection="general"
        expanded={false}
        onSectionChange={vi.fn()}
        onToggleExpanded={vi.fn()}
      />,
    );

    const systemStateButton = screen.getByTestId("settings-nav-system-state");
    const tooltipHost = systemStateButton.closest('[data-testid="icon-tooltip-host"]');
    expect(tooltipHost).not.toBeNull();

    fireEvent.pointerEnter(tooltipHost as Element);
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Состояние системы");
  });

  it("does not show nav tooltips when expanded", () => {
    render(
      <SettingsSidebar
        activeSection="general"
        expanded
        onSectionChange={vi.fn()}
        onToggleExpanded={vi.fn()}
      />,
    );

    fireEvent.pointerEnter(screen.getByTestId("settings-nav-system-state"));
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
