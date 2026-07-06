// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsFullscreenOverlay } from "./SettingsFullscreenOverlay.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { systemStateTestDefaults } from "./panels/settingsSystemStateTestDefaults.js";
import { settingsCodecTestDefaults } from "./panels/settingsCodecTestDefaults.js";
import { settingsAccountTestDefaults } from "./panels/settingsAccountTestDefaults.js";

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
  notificationClosable: true,
  onNotificationClosableChange: vi.fn(),
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
};

describe("SettingsFullscreenOverlay", () => {
  it("renders when open and closes on button click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <SettingsFullscreenOverlay open={false} onClose={onClose}>
        <SettingsPanel {...panelProps} onClose={onClose} />
      </SettingsFullscreenOverlay>,
    );

    expect(screen.queryByTestId("settings-overlay")).not.toBeInTheDocument();

    rerender(
      <SettingsFullscreenOverlay open onClose={onClose}>
        <SettingsPanel {...panelProps} onClose={onClose} />
      </SettingsFullscreenOverlay>,
    );

    expect(screen.getByTestId("settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-body")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-overlay-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("plays exit animation before unmounting when closed", () => {
    const onClose = vi.fn();

    const { container, rerender } = render(
      <SettingsFullscreenOverlay open onClose={onClose}>
        <SettingsPanel {...panelProps} onClose={onClose} />
      </SettingsFullscreenOverlay>,
    );

    rerender(
      <SettingsFullscreenOverlay open={false} onClose={onClose}>
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
