// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import type { ComponentProps } from "react";
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

function renderSidebar(
  props: Partial<ComponentProps<typeof SettingsSidebar>> = {},
): ReturnType<typeof render> {
  return render(
    <SettingsSidebar
      activeSection="general"
      expanded={false}
      onSectionChange={vi.fn()}
      onToggleExpanded={vi.fn()}
      {...props}
    />,
  );
}

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

    renderSidebar({ onToggleExpanded });

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-expanded", "false");

    await user.click(screen.getByTestId("settings-sidebar-expand"));
    expect(onToggleExpanded).toHaveBeenCalledOnce();
  });

  it("shows labels when expanded", () => {
    renderSidebar({ activeSection: "account", expanded: true });

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByText("Аккаунт")).toBeVisible();
    expect(screen.getByText("Диагностика")).toBeVisible();
  });

  it("keeps all sections enabled when SIP is not registered", () => {
    renderSidebar({ activeSection: "account" });

    expect(screen.getByTestId("settings-nav-account")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-general")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-sessions")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-diagnostics")).toBeEnabled();
  });

  it("shows full system-state label without truncation when expanded", () => {
    renderSidebar({ activeSection: "system-state", expanded: true });

    const label = screen.getByText("Состояние системы");
    expect(label).toBeVisible();
    expect(label.textContent).toBe("Состояние системы");
  });

  it("shows section tooltip on collapsed nav hover", () => {
    renderSidebar();

    const systemStateButton = screen.getByTestId("settings-nav-system-state");
    const tooltipHost = systemStateButton.closest('[data-testid="icon-tooltip-host"]');
    expect(tooltipHost).not.toBeNull();

    fireEvent.pointerEnter(tooltipHost as Element);
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Состояние системы");
  });

  it("shows section tooltip on collapsed nav hover when SIP is not registered", () => {
    renderSidebar();

    const generalButton = screen.getByTestId("settings-nav-general");
    const tooltipHost = generalButton.closest('[data-testid="icon-tooltip-host"]');
    expect(tooltipHost).not.toBeNull();

    fireEvent.pointerEnter(tooltipHost as Element);
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Общее");
  });

  it("does not show nav tooltips when expanded", () => {
    renderSidebar({ expanded: true });

    fireEvent.pointerEnter(screen.getByTestId("settings-nav-system-state"));
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows nested OCP Module under Integrations when expanded", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    renderSidebar({
      activeSection: "integrations",
      expanded: true,
      onSectionChange,
    });

    expect(screen.getByTestId("settings-nav-integrations")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-group-integrations-group")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-integrations-ocp")).toBeInTheDocument();
    expect(screen.getByText("OCP Module")).toBeVisible();

    await user.click(screen.getByTestId("settings-nav-integrations-ocp"));
    expect(onSectionChange).toHaveBeenCalledWith("integrations");
  });

  it("opens first Integrations child when parent is clicked while collapsed", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    renderSidebar({ activeSection: "general", onSectionChange });

    await user.click(screen.getByTestId("settings-nav-integrations"));
    expect(onSectionChange).toHaveBeenCalledWith("integrations");
  });
});
