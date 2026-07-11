import { vi } from "vitest";
import type { SettingsVideoPanelProps } from "./SettingsVideoPanel.js";

export const settingsVideoStoryDefaults: SettingsVideoPanelProps = {
  preferredAudioInputDeviceId: null,
  preferredVideoInputDeviceId: null,
  defaultSessionView: "expanded",
  autoFullscreenOnConference: false,
  conferenceNumberSubstring: null,
  audioDevices: [
    { value: "__system_default__", label: "System default" },
    { value: "mic-1", label: "Mock Mic" },
  ],
  videoDevices: [
    { value: "__system_default__", label: "System default" },
    { value: "cam-1", label: "Mock Camera" },
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
  onRefreshDevices: () => undefined,
};

export const settingsVideoTestDefaults: SettingsVideoPanelProps = {
  ...settingsVideoStoryDefaults,
  onPreferredAudioInputDeviceIdChange: vi.fn(),
  onPreferredVideoInputDeviceIdChange: vi.fn(),
  onDefaultSessionViewChange: vi.fn(),
  onAutoFullscreenOnConferenceChange: vi.fn(),
  onConferenceNumberSubstringChange: vi.fn(),
  onRefreshDevices: vi.fn(),
};
