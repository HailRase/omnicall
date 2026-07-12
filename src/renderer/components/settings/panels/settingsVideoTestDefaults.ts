import { vi } from "vitest";
import type { SettingsVideoPanelProps } from "./SettingsVideoPanel.js";

export const settingsVideoStoryDefaults: SettingsVideoPanelProps = {
  preferredAudioInputDeviceId: null,
  preferredVideoInputDeviceId: null,
  defaultSessionView: "expanded",
  autoFullscreenOnConference: false,
  conferenceNumberSubstring: null,
  enableLocalVideoAfterConnect: false,
  audioDevices: [
    { value: "__system_default__", label: "system-default" },
    { value: "mic-1", label: "mock-mic" },
  ],
  videoDevices: [
    { value: "__system_default__", label: "system-default" },
    { value: "cam-1", label: "mock-camera" },
  ],
  devicesLoading: false,
  devicesError: false,
  previewError: false,
  previewVideoRef: () => undefined,
  onPreferredAudioInputDeviceIdChange: () => undefined,
  onPreferredVideoInputDeviceIdChange: () => undefined,
  onDefaultSessionViewChange: () => undefined,
  onAutoFullscreenOnConferenceChange: () => undefined,
  onConferenceNumberSubstringChange: () => undefined,
  onEnableLocalVideoAfterConnectChange: () => undefined,
  onRefreshDevices: () => undefined,
};

export const settingsVideoTestDefaults: SettingsVideoPanelProps = {
  ...settingsVideoStoryDefaults,
  onPreferredAudioInputDeviceIdChange: vi.fn(),
  onPreferredVideoInputDeviceIdChange: vi.fn(),
  onDefaultSessionViewChange: vi.fn(),
  onAutoFullscreenOnConferenceChange: vi.fn(),
  onConferenceNumberSubstringChange: vi.fn(),
  onEnableLocalVideoAfterConnectChange: vi.fn(),
  onRefreshDevices: vi.fn(),
};
