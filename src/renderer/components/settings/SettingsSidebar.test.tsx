// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { deriveSettingsNavigationAvailability } from "@application/index.js";
import type { ComponentProps } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsSidebar } from "./SettingsSidebar.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const postAuthAvailability = deriveSettingsNavigationAvailability({
  hasActiveAccountSession: true,
});
const preAuthAvailability = deriveSettingsNavigationAvailability({
  hasActiveAccountSession: false,
});

function renderSidebar(
  props: Partial<ComponentProps<typeof SettingsSidebar>> = {},
): ReturnType<typeof render> {
  return render(
    <SettingsSidebar
      activeSection="general"
      expanded={false}
      sectionAvailability={postAuthAvailability}
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

  it("disables gated sections before account session but keeps top-level OmniCall Kit", () => {
    renderSidebar({
      activeSection: "account",
      sectionAvailability: preAuthAvailability,
    });

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute(
      "data-pre-auth-gate",
      "true",
    );
    expect(screen.getByTestId("settings-nav-account")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-general")).toBeDisabled();
    expect(screen.getByTestId("settings-nav-sessions")).toBeDisabled();
    expect(screen.getByTestId("settings-nav-diagnostics")).toBeDisabled();
    // Integrations (OCP-only group) stays gated; OmniCall Kit is a top-level leaf below it.
    expect(screen.getByTestId("settings-nav-integrations")).toBeDisabled();
    expect(screen.getByTestId("settings-nav-integrations-sdk")).toBeEnabled();
  });

  it("keeps all sections enabled after SIP registration", () => {
    renderSidebar({ activeSection: "account" });

    expect(screen.getByTestId("settings-nav-account")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-general")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-sessions")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-diagnostics")).toBeEnabled();
  });

  it("marks the active section in collapsed icon rail", () => {
    renderSidebar({ activeSection: "notifications", expanded: false });

    expect(screen.getByTestId("settings-nav-notifications")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByTestId("settings-nav-general")).not.toHaveAttribute(
      "data-active",
    );
  });

  it("shows authorize-first tooltip on disabled nav when pre-auth", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    renderSidebar({
      activeSection: "account",
      sectionAvailability: preAuthAvailability,
    });

    await user.hover(screen.getByTestId("settings-nav-general"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Сначала авторизуйтесь в разделе «Аккаунт»",
    );
  });

  it("does not navigate via Integrations group when pre-auth (OCP gated)", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    renderSidebar({
      activeSection: "account",
      sectionAvailability: preAuthAvailability,
      onSectionChange,
    });

    await user.click(screen.getByTestId("settings-nav-integrations"));
    expect(onSectionChange).not.toHaveBeenCalled();
  });

  it("navigates to OmniCall Kit top-level leaf when pre-auth", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    renderSidebar({
      activeSection: "account",
      sectionAvailability: preAuthAvailability,
      onSectionChange,
    });

    await user.click(screen.getByTestId("settings-nav-integrations-sdk"));
    expect(onSectionChange).toHaveBeenCalledWith("integrations-sdk");
  });

  it("shows full system-state label without truncation when expanded", () => {
    renderSidebar({ activeSection: "system-state", expanded: true });

    const label = screen.getByText("Состояние системы");
    expect(label).toBeVisible();
    expect(label.textContent).toBe("Состояние системы");
  });

  it("shows section tooltip on collapsed nav hover", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    renderSidebar();

    await user.hover(screen.getByTestId("settings-nav-system-state"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Состояние системы");
  });

  it("does not show nav tooltips when expanded and enabled", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    renderSidebar({ expanded: true });

    await user.hover(screen.getByTestId("settings-nav-system-state"));

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows always-open Integrations cluster and OmniCall Kit as sibling below", async () => {
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
    expect(screen.getByTestId("settings-nav-integrations-external-services")).toBeInTheDocument();
    expect(screen.getByText("Внешние сервисы")).toBeVisible();
    expect(screen.getByTestId("settings-nav-integrations-sdk")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-nav-group-integrations-group")).not.toContainElement(
      screen.getByTestId("settings-nav-integrations-sdk"),
    );

    await user.click(screen.getByTestId("settings-nav-integrations-ocp"));
    expect(onSectionChange).toHaveBeenCalledWith("integrations");

    await user.click(screen.getByTestId("settings-nav-integrations-external-services"));
    expect(onSectionChange).toHaveBeenCalledWith("integrations-external-services");
  });

  it("keeps Integrations children visible when expanded without accordion toggle", () => {
    renderSidebar({
      activeSection: "general",
      expanded: true,
    });

    expect(screen.getByTestId("settings-nav-group-integrations-group")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-integrations-ocp")).toBeEnabled();
    expect(screen.getByTestId("settings-nav-integrations-external-services")).toBeEnabled();
  });

  it("navigates to first Integrations child from expanded section label", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    renderSidebar({
      activeSection: "general",
      expanded: true,
      onSectionChange,
    });

    await user.click(screen.getByTestId("settings-nav-integrations"));
    expect(onSectionChange).toHaveBeenCalledWith("integrations");
  });

  it("keeps External Services gated before account session", () => {
    renderSidebar({
      activeSection: "account",
      expanded: true,
      sectionAvailability: preAuthAvailability,
    });

    expect(screen.getByTestId("settings-nav-integrations-ocp")).toBeDisabled();
    expect(
      screen.getByTestId("settings-nav-integrations-external-services"),
    ).toBeDisabled();
  });

  it("shows authorize-first tooltip on gated Integrations child when expanded", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    renderSidebar({
      activeSection: "account",
      expanded: true,
      sectionAvailability: preAuthAvailability,
    });

    await user.hover(screen.getByTestId("settings-nav-integrations-external-services"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Сначала авторизуйтесь в разделе «Аккаунт»",
    );
  });

  it("opens first Integrations child when parent is clicked while collapsed", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    renderSidebar({ activeSection: "general", onSectionChange });

    await user.click(screen.getByTestId("settings-nav-integrations"));
    expect(onSectionChange).toHaveBeenCalledWith("integrations");
  });

  it("hides Integrations children in collapsed icon rail", () => {
    renderSidebar({
      activeSection: "integrations",
      expanded: false,
    });

    expect(screen.queryByTestId("settings-nav-group-integrations-group")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-nav-integrations-ocp")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-integrations")).toHaveAttribute("data-active", "true");
  });

  it("collapses expanded sidebar when clicking outside", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();

    render(
      <div>
        <SettingsSidebar
          activeSection="general"
          expanded={true}
          sectionAvailability={postAuthAvailability}
          onSectionChange={vi.fn()}
          onToggleExpanded={onToggleExpanded}
        />
        <button type="button" data-testid="settings-outside-target">
          Outside
        </button>
      </div>,
    );

    await user.click(screen.getByTestId("settings-outside-target"));
    expect(onToggleExpanded).toHaveBeenCalledOnce();
  });

  it("does not toggle when clicking a nav item inside the sidebar", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();

    renderSidebar({ expanded: true, onToggleExpanded });

    await user.click(screen.getByTestId("settings-nav-general"));
    expect(onToggleExpanded).not.toHaveBeenCalled();
  });

  it("toggles when clicking empty sidebar chrome outside nav items", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();

    renderSidebar({ expanded: true, onToggleExpanded });

    await user.click(screen.getByTestId("settings-sidebar"));
    expect(onToggleExpanded).toHaveBeenCalledOnce();
  });

  it("expands collapsed rail when clicking empty sidebar chrome", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onToggleExpanded = vi.fn();

    renderSidebar({ expanded: false, onToggleExpanded });

    await user.click(screen.getByTestId("settings-sidebar"));
    expect(onToggleExpanded).toHaveBeenCalledOnce();
  });
});
