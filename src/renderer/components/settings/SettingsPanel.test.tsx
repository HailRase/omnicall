// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "./SettingsPanel.js";

afterEach(() => {
  cleanup();
});

const emptyAccount = {
  form: { username: "", password: "", domain: "", server: "" },
  submitting: false,
  error: null,
  disabled: false,
  authorizeDisabledReason: null,
  logoutDisabledReason: "Заполните поля и нажмите «Авторизоваться»",
  onFieldChange: vi.fn(),
  onSubmit: vi.fn(),
  onLogout: vi.fn(),
} as const;

const themeDefaults = {
  theme: "light" as const,
  onThemeChange: vi.fn(),
} as const;

const sipRecoveryDefaults = {
  sipAutoReregisterEnabled: true,
  onSipAutoReregisterChange: vi.fn(),
  sipReregisterIntervalSec: 5,
  onSipReregisterIntervalChange: vi.fn(),
} as const;

describe("SettingsPanel", () => {
  it("reflects multiSessionsEnabled and emits toggle changes from Sessions section", async () => {
    const user = userEvent.setup();
    const onMultiSessionsChange = vi.fn();

    const { rerender } = render(
      <SettingsPanel
        activeSection="sessions"
        sidebarExpanded={false}
        onClose={vi.fn()}
        onSectionChange={vi.fn()}
        onSidebarExpandedChange={vi.fn()}
        multiSessionsEnabled
        onMultiSessionsChange={onMultiSessionsChange}
        account={emptyAccount}
        {...themeDefaults}
        {...sipRecoveryDefaults}
      />,
    );

    const toggle = screen.getByTestId("settings-multi-sessions-toggle");
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(onMultiSessionsChange).toHaveBeenCalledWith(false);

    rerender(
      <SettingsPanel
        activeSection="sessions"
        sidebarExpanded={false}
        onClose={vi.fn()}
        onSectionChange={vi.fn()}
        onSidebarExpandedChange={vi.fn()}
        multiSessionsEnabled={false}
        onMultiSessionsChange={onMultiSessionsChange}
        account={emptyAccount}
        {...themeDefaults}
        {...sipRecoveryDefaults}
      />,
    );
    expect(screen.getByTestId("settings-multi-sessions-toggle")).not.toBeChecked();
  });

  it("shows update error when provided", () => {
    render(
      <SettingsPanel
        activeSection="general"
        sidebarExpanded={false}
        onClose={vi.fn()}
        onSectionChange={vi.fn()}
        onSidebarExpandedChange={vi.fn()}
        multiSessionsEnabled
        onMultiSessionsChange={vi.fn()}
        account={emptyAccount}
        {...themeDefaults}
        {...sipRecoveryDefaults}
        updateError="Repository unavailable"
      />,
    );

    expect(screen.getByTestId("settings-update-error")).toHaveTextContent(
      "Repository unavailable",
    );
  });

  it("shows breadcrumb title with section name", () => {
    render(
      <SettingsPanel
        activeSection="general"
        sidebarExpanded={false}
        onClose={vi.fn()}
        onSectionChange={vi.fn()}
        onSidebarExpandedChange={vi.fn()}
        multiSessionsEnabled
        onMultiSessionsChange={vi.fn()}
        account={emptyAccount}
        {...themeDefaults}
        {...sipRecoveryDefaults}
      />,
    );

    expect(screen.getByTestId("settings-section-title")).toHaveTextContent("Настройки (Общее)");
  });

  it("closes settings from content header button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <SettingsPanel
        activeSection="account"
        sidebarExpanded={false}
        onClose={onClose}
        onSectionChange={vi.fn()}
        onSidebarExpandedChange={vi.fn()}
        multiSessionsEnabled
        onMultiSessionsChange={vi.fn()}
        account={emptyAccount}
        {...themeDefaults}
        {...sipRecoveryDefaults}
      />,
    );

    await user.click(screen.getByTestId("settings-overlay-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("switches sections via sidebar navigation", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(
      <SettingsPanel
        activeSection="general"
        sidebarExpanded={false}
        onClose={vi.fn()}
        onSectionChange={onSectionChange}
        onSidebarExpandedChange={vi.fn()}
        multiSessionsEnabled
        onMultiSessionsChange={vi.fn()}
        account={emptyAccount}
        {...themeDefaults}
        {...sipRecoveryDefaults}
      />,
    );

    await user.click(screen.getByTestId("settings-nav-diagnostics"));
    expect(onSectionChange).toHaveBeenCalledWith("diagnostics");
  });
});
