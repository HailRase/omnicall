// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { systemStateTestDefaults } from "./panels/settingsSystemStateTestDefaults.js";
import { settingsCodecTestDefaults } from "./panels/settingsCodecTestDefaults.js";
import { SettingsPanel } from "./SettingsPanel.js";

afterEach(() => {
  cleanup();
});

const emptyAccount = {
  form: { username: "", password: "", domain: "", server: "" },
  submitting: false,
  error: null,
  successKey: null,
  disabled: false,
  authorizeDisabledReason: null,
  logoutDisabledReason: "Заполните поля и нажмите «Авторизоваться»",
  onFieldChange: vi.fn(),
  onSubmit: vi.fn(),
  onLogout: vi.fn(),
} as const;

const themeDefaults = {
  language: "ru" as const,
  onLanguageChange: vi.fn(),
  theme: "light" as const,
  onThemeChange: vi.fn(),
} as const;

const appUpdateDefaults = {
  currentVersion: "0.0.1",
  latestVersion: undefined,
  updateStatusMessage: "Нажмите «Проверить обновления», чтобы узнать о новой версии.",
  canCheckForUpdates: true,
  canOpenDownloadPage: false,
  isCheckingUpdates: false,
  onCheckForUpdates: vi.fn(),
  onOpenDownloadPage: vi.fn(),
} as const;

const autoAnswerDefaults = {
  autoAnswerEnabled: false,
  autoAnswerTimeoutSec: 5,
  onAutoAnswerEnabledChange: vi.fn(),
  onAutoAnswerTimeoutChange: vi.fn(),
  autoAnswerDuringActiveSessionEnabled: false,
  onAutoAnswerDuringActiveSessionChange: vi.fn(),
} as const;

const codecDefaults = settingsCodecTestDefaults;

const panelBaseProps = {
  sidebarExpanded: false,
  onClose: vi.fn(),
  onSectionChange: vi.fn(),
  onSidebarExpandedChange: vi.fn(),
  multiSessionsEnabled: true,
  onMultiSessionsChange: vi.fn(),
  account: emptyAccount,
  systemState: systemStateTestDefaults,
  ...themeDefaults,
  ...autoAnswerDefaults,
  ...appUpdateDefaults,
  ...codecDefaults,
} as const;

describe("SettingsPanel", () => {
  it("reflects multiSessionsEnabled and emits toggle changes from Sessions section", async () => {
    const user = userEvent.setup();
    const onMultiSessionsChange = vi.fn();

    const { rerender } = render(
      <SettingsPanel
        {...panelBaseProps}
        activeSection="sessions"
        onMultiSessionsChange={onMultiSessionsChange}
      />,
    );

    const toggle = screen.getByTestId("settings-multi-sessions-toggle");
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(onMultiSessionsChange).toHaveBeenCalledWith(false);

    rerender(
      <SettingsPanel
        {...panelBaseProps}
        activeSection="sessions"
        multiSessionsEnabled={false}
        onMultiSessionsChange={onMultiSessionsChange}
      />,
    );
    expect(screen.getByTestId("settings-multi-sessions-toggle")).not.toBeChecked();
  });

  it("shows update error when provided", () => {
    render(
      <SettingsPanel
        {...panelBaseProps}
        activeSection="general"
        updateError="Repository unavailable"
      />,
    );

    expect(screen.getByTestId("settings-update-error")).toHaveTextContent(
      "Repository unavailable",
    );
  });

  it("shows breadcrumb title with section name", () => {
    render(<SettingsPanel {...panelBaseProps} activeSection="general" />);

    expect(screen.getByTestId("settings-section-title")).toHaveTextContent("Настройки (Общее)");
  });

  it("closes settings from content header button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SettingsPanel {...panelBaseProps} activeSection="account" onClose={onClose} />);

    await user.click(screen.getByTestId("settings-overlay-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("switches sections via sidebar navigation", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(
      <SettingsPanel
        {...panelBaseProps}
        activeSection="general"
        onSectionChange={onSectionChange}
      />,
    );

    await user.click(screen.getByTestId("settings-nav-system-state"));
    expect(onSectionChange).toHaveBeenCalledWith("system-state");
  });

  it("renders system state panel with Russian labels", () => {
    render(<SettingsPanel {...panelBaseProps} activeSection="system-state" />);

    expect(screen.getByTestId("settings-system-state-panel")).toBeInTheDocument();
    expect(screen.getByTestId("settings-sip-summary-label")).toHaveTextContent("Не подключено");
    expect(screen.getByTestId("settings-sip-manual-transport-reconnect")).toHaveTextContent(
      "Переподключить сервер",
    );
  });
});
