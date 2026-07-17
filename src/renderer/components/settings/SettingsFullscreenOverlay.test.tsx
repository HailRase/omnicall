// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { deriveSettingsNavigationAvailability } from "@application/index.js";
import { SettingsFullscreenOverlay } from "./SettingsFullscreenOverlay.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { systemStateTestDefaults } from "./panels/settingsSystemStateTestDefaults.js";
import { settingsCodecTestDefaults } from "./panels/settingsCodecTestDefaults.js";
import { settingsAccountTestDefaults } from "./panels/settingsAccountTestDefaults.js";
import { settingsHeadsetTestDefaults } from "./panels/settingsHeadsetTestDefaults.js";
import { settingsIntegrationsTestDefaults } from "./panels/settingsIntegrationsTestDefaults.js";
import { settingsVideoTestDefaults } from "./panels/settingsVideoTestDefaults.js";
import { settingsOverlayWindowControlsTestDefaults } from "./settingsOverlayWindowControlsTestDefaults.js";

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

const panelProps = {
  activeSection: "general" as const,
  sidebarExpanded: false,
  sectionAvailability: deriveSettingsNavigationAvailability({
    hasActiveAccountSession: true,
  }),
  onClose: vi.fn(),
  onSectionChange: vi.fn(),
  onSidebarExpandedChange: vi.fn(),
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
  multiSessionsEnabled: true,
  onMultiSessionsChange: vi.fn(),
  autoAnswerEnabled: false,
  autoAnswerTimeoutSec: 5,
  onAutoAnswerEnabledChange: vi.fn(),
  onAutoAnswerTimeoutChange: vi.fn(),
  autoAnswerDuringActiveSessionEnabled: false,
  onAutoAnswerDuringActiveSessionChange: vi.fn(),
  systemState: systemStateTestDefaults,
  ...settingsCodecTestDefaults,
  account: settingsAccountTestDefaults,
  ...appUpdateDefaults,
  ...settingsHeadsetTestDefaults,
  ...settingsIntegrationsTestDefaults,
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
};

describe("SettingsFullscreenOverlay", () => {
  it("renders when open and closes on button click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <SettingsFullscreenOverlay
        open={false}
        onClose={onClose}
        windowControls={settingsOverlayWindowControlsTestDefaults}
      >
        <SettingsPanel {...panelProps} onClose={onClose} />
      </SettingsFullscreenOverlay>,
    );

    expect(screen.queryByTestId("settings-overlay")).not.toBeInTheDocument();

    rerender(
      <SettingsFullscreenOverlay
        open
        onClose={onClose}
        windowControls={settingsOverlayWindowControlsTestDefaults}
      >
        <SettingsPanel {...panelProps} onClose={onClose} />
      </SettingsFullscreenOverlay>,
    );

    expect(screen.getByTestId("settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-chrome-titlebar")).toBeInTheDocument();
    expect(screen.getByTestId("shell-window-controls")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-body")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-overlay-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("plays exit animation before unmounting when closed", () => {
    const onClose = vi.fn();

    const { container, rerender } = render(
      <SettingsFullscreenOverlay
        open
        onClose={onClose}
        windowControls={settingsOverlayWindowControlsTestDefaults}
      >
        <SettingsPanel {...panelProps} onClose={onClose} />
      </SettingsFullscreenOverlay>,
    );

    rerender(
      <SettingsFullscreenOverlay
        open={false}
        onClose={onClose}
        windowControls={settingsOverlayWindowControlsTestDefaults}
      >
        <SettingsPanel {...panelProps} onClose={onClose} />
      </SettingsFullscreenOverlay>,
    );

    const overlay = container.querySelector('[data-testid="settings-overlay"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute("data-closing", "true");

    const panel = overlay?.querySelector("section");
    if (panel !== null && panel !== undefined) {
      fireEvent.animationEnd(panel);
    }

    expect(container.querySelector('[data-testid="settings-overlay"]')).toBeNull();
  });
});
