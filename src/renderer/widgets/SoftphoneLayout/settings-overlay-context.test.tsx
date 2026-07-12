// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsFullscreenOverlay } from "../../components/settings/SettingsFullscreenOverlay.js";
import { SettingsPanel } from "../../components/settings/SettingsPanel.js";
import { systemStateTestDefaults } from "../../components/settings/panels/settingsSystemStateTestDefaults.js";
import { settingsCodecTestDefaults } from "../../components/settings/panels/settingsCodecTestDefaults.js";
import { settingsAccountTestDefaults } from "../../components/settings/panels/settingsAccountTestDefaults.js";
import { settingsHeadsetStoryDefaults } from "../../components/settings/panels/settingsHeadsetTestDefaults.js";
import { settingsVideoStoryDefaults } from "../../components/settings/panels/settingsVideoTestDefaults.js";
import { settingsOverlayWindowControlsTestDefaults } from "../../components/settings/settingsOverlayWindowControlsTestDefaults.js";
import { SoftphoneLayout } from "./SoftphoneLayout.js";

describe("settings overlay with layout zones", () => {
  it("keeps call context mounted while settings overlay is open", () => {
    render(
      <SoftphoneLayout
        header={<span>Header</span>}
        context={<div data-testid="call-context-zone">Call context</div>}
        controls={<span>Controls</span>}
        overlays={
          <SettingsFullscreenOverlay
            open
            onClose={() => undefined}
            windowControls={settingsOverlayWindowControlsTestDefaults}
          >
            <SettingsPanel
              activeSection="sessions"
              sidebarExpanded={false}
              onClose={() => undefined}
              onSectionChange={vi.fn()}
              onSidebarExpandedChange={vi.fn()}
              language="ru"
              onLanguageChange={() => undefined}
              theme="light"
              onThemeChange={() => undefined}
              notificationPlacement="bottom-right"
              onNotificationPlacementChange={() => undefined}
              notificationStacking="stacked"
              onNotificationStackingChange={() => undefined}
              notificationDurationMs={4200}
              onNotificationDurationMsChange={() => undefined}
              notificationMaxVisible={3}
              onNotificationMaxVisibleChange={() => undefined}
              multiSessionsEnabled
              onMultiSessionsChange={() => undefined}
              autoAnswerEnabled={false}
              autoAnswerTimeoutSec={5}
              onAutoAnswerEnabledChange={() => undefined}
              onAutoAnswerTimeoutChange={() => undefined}
              autoAnswerDuringActiveSessionEnabled={false}
              onAutoAnswerDuringActiveSessionChange={() => undefined}
              systemState={systemStateTestDefaults}
              {...settingsCodecTestDefaults}
              currentVersion="0.0.1"
              latestVersion={undefined}
              updateStatusMessage="Нажмите «Проверить обновления», чтобы узнать о новой версии."
              canCheckForUpdates
              canOpenDownloadPage={false}
              isCheckingUpdates={false}
              onCheckForUpdates={() => undefined}
              onOpenDownloadPage={() => undefined}
              account={settingsAccountTestDefaults}
              {...settingsHeadsetStoryDefaults}
              preferredAudioInputDeviceId={settingsVideoStoryDefaults.preferredAudioInputDeviceId}
              preferredVideoInputDeviceId={settingsVideoStoryDefaults.preferredVideoInputDeviceId}
              defaultSessionView={settingsVideoStoryDefaults.defaultSessionView}
              autoFullscreenOnConference={settingsVideoStoryDefaults.autoFullscreenOnConference}
              conferenceNumberSubstring={settingsVideoStoryDefaults.conferenceNumberSubstring}
              videoAudioDevices={settingsVideoStoryDefaults.audioDevices}
              videoCameraDevices={settingsVideoStoryDefaults.videoDevices}
              videoDevicesLoading={settingsVideoStoryDefaults.devicesLoading}
              videoDevicesError={settingsVideoStoryDefaults.devicesError}
              videoPreviewError={settingsVideoStoryDefaults.previewError}
              videoPreviewRef={settingsVideoStoryDefaults.previewVideoRef}
              onPreferredAudioInputDeviceIdChange={
                settingsVideoStoryDefaults.onPreferredAudioInputDeviceIdChange
              }
              onPreferredVideoInputDeviceIdChange={
                settingsVideoStoryDefaults.onPreferredVideoInputDeviceIdChange
              }
              onDefaultSessionViewChange={settingsVideoStoryDefaults.onDefaultSessionViewChange}
              onAutoFullscreenOnConferenceChange={
                settingsVideoStoryDefaults.onAutoFullscreenOnConferenceChange
              }
              onConferenceNumberSubstringChange={
                settingsVideoStoryDefaults.onConferenceNumberSubstringChange
              }
              onRefreshVideoDevices={settingsVideoStoryDefaults.onRefreshDevices}
            />
          </SettingsFullscreenOverlay>
        }
      />,
    );

    expect(screen.getByTestId("call-context-zone")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-body")).toBeInTheDocument();
  });
});
