// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deriveSettingsNavigationAvailability } from "@application/index.js";
import { systemStateTestDefaults } from "./panels/settingsSystemStateTestDefaults.js";
import { settingsCodecTestDefaults } from "./panels/settingsCodecTestDefaults.js";
import { settingsHeadsetTestDefaults } from "./panels/settingsHeadsetTestDefaults.js";
import { settingsVideoTestDefaults } from "./panels/settingsVideoTestDefaults.js";
import { settingsIntegrationsTestDefaults } from "./panels/settingsIntegrationsTestDefaults.js";
import { settingsAccountTestDefaults } from "./panels/settingsAccountTestDefaults.js";
import { setupJsdomRadix } from "../../test/setupJsdomRadix.js";
import { SettingsPanel } from "./SettingsPanel.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

const emptyAccount = settingsAccountTestDefaults;

const themeDefaults = {
  language: "ru" as const,
  onLanguageChange: vi.fn(),
  theme: "light" as const,
  onThemeChange: vi.fn(),
  notificationPlacement: "bottom-right" as const,
  onNotificationPlacementChange: vi.fn(),
  notificationStacking: "stacked" as const,
  onNotificationStackingChange: vi.fn(),
  notificationDurationMs: 4200,
  onNotificationDurationMsChange: vi.fn(),
  notificationMaxVisible: 3,
  onNotificationMaxVisibleChange: vi.fn(),
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
  sectionAvailability: deriveSettingsNavigationAvailability({
    hasActiveAccountSession: true,
  }),
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
  ...settingsHeadsetTestDefaults,
  preferredAudioInputDeviceId: settingsVideoTestDefaults.preferredAudioInputDeviceId,
  preferredVideoInputDeviceId: settingsVideoTestDefaults.preferredVideoInputDeviceId,
  defaultSessionView: settingsVideoTestDefaults.defaultSessionView,
  autoFullscreenOnConference: settingsVideoTestDefaults.autoFullscreenOnConference,
  conferenceNumberSubstring: settingsVideoTestDefaults.conferenceNumberSubstring,
  enableLocalVideoAfterConnect: settingsVideoTestDefaults.enableLocalVideoAfterConnect,
  videoAudioDevices: settingsVideoTestDefaults.audioDevices,
  videoCameraDevices: settingsVideoTestDefaults.videoDevices,
  videoDevicesLoading: settingsVideoTestDefaults.devicesLoading,
  videoDevicesError: settingsVideoTestDefaults.devicesError,
  videoPreviewError: settingsVideoTestDefaults.previewError,
  videoPreviewRef: settingsVideoTestDefaults.previewVideoRef,
  onPreferredAudioInputDeviceIdChange:
    settingsVideoTestDefaults.onPreferredAudioInputDeviceIdChange,
  onPreferredVideoInputDeviceIdChange:
    settingsVideoTestDefaults.onPreferredVideoInputDeviceIdChange,
  onDefaultSessionViewChange: settingsVideoTestDefaults.onDefaultSessionViewChange,
  onAutoFullscreenOnConferenceChange:
    settingsVideoTestDefaults.onAutoFullscreenOnConferenceChange,
  onConferenceNumberSubstringChange:
    settingsVideoTestDefaults.onConferenceNumberSubstringChange,
  onEnableLocalVideoAfterConnectChange:
    settingsVideoTestDefaults.onEnableLocalVideoAfterConnectChange,
  onRefreshVideoDevices: settingsVideoTestDefaults.onRefreshDevices,
  ...settingsIntegrationsTestDefaults,
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
    expect(toggle).toHaveAttribute("data-state", "checked");

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
    expect(screen.getByTestId("settings-multi-sessions-toggle")).toHaveAttribute(
      "data-state",
      "unchecked",
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

  it("renders video settings panel", () => {
    render(<SettingsPanel {...panelBaseProps} activeSection="video" />);

    expect(screen.getByTestId("settings-video-panel")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-title")).toHaveTextContent("Настройки (Видео)");
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
