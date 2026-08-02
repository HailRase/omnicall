import type { Meta, StoryObj } from "@storybook/react";
import { deriveSettingsNavigationAvailability } from "@application/index.js";
import { SettingsFullscreenOverlay } from "./SettingsFullscreenOverlay.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { systemStateTestDefaults } from "./panels/settingsSystemStateTestDefaults.js";
import { settingsCodecTestDefaults } from "./panels/settingsCodecTestDefaults.js";
import { settingsAccountTestDefaults } from "./panels/settingsAccountTestDefaults.js";
import { settingsHeadsetStoryDefaults } from "./panels/settingsHeadsetTestDefaults.js";
import { settingsIntegrationsStoryDefaults } from "./panels/settingsIntegrationsTestDefaults.js";
import { settingsVideoStoryDefaults } from "./panels/settingsVideoTestDefaults.js";
import type { ShellWindowControlsViewModel } from "../../hooks/useShellWindowControls.js";

const storyWindowControls: ShellWindowControlsViewModel = {
  platform: "linux",
  showNativeWindowControls: true,
  isShuttingDown: false,
  maximizeEnabled: true,
  isMaximized: false,
  isPinned: false,
  onMinimize: () => undefined,
  onClose: () => undefined,
  onRestart: () => undefined,
  onToggleMaximize: () => undefined,
  onTogglePin: () => undefined,
};

const meta = {
  title: "Settings/SettingsPanel",
  component: SettingsPanel,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <SettingsFullscreenOverlay
        open
        onClose={() => undefined}
        windowControls={storyWindowControls}
      >
        <Story />
      </SettingsFullscreenOverlay>
    ),
  ],
} satisfies Meta<typeof SettingsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const accountDefaults = settingsAccountTestDefaults;

const themeDefaults = {
  language: "ru" as const,
  onLanguageChange: () => undefined,
  theme: "light" as const,
  onThemeChange: () => undefined,
  notificationPlacement: "bottom-right" as const,
  onNotificationPlacementChange: () => undefined,
  notificationStacking: "stacked" as const,
  onNotificationStackingChange: () => undefined,
  notificationDurationMs: 4200,
  onNotificationDurationMsChange: () => undefined,
  notificationMaxVisible: 3,
  onNotificationMaxVisibleChange: () => undefined,
} as const;

const autoAnswerDefaults = {
  autoAnswerEnabled: true,
  autoAnswerTimeoutSec: 8,
  onAutoAnswerEnabledChange: () => undefined,
  onAutoAnswerTimeoutChange: () => undefined,
  autoAnswerDuringActiveSessionEnabled: true,
  onAutoAnswerDuringActiveSessionChange: () => undefined,
  incomingRingtoneId: "classic" as const,
  onIncomingRingtoneIdChange: () => undefined,
  onPreviewIncomingRingtone: () => undefined,
  onStopIncomingRingtonePreview: () => undefined,
} as const;

const appUpdateDefaults = {
  currentVersion: "0.0.1",
  latestVersion: undefined,
  updateStatusMessage: "Нажмите «Проверить обновления», чтобы узнать о новой версии.",
  canCheckForUpdates: true,
  canOpenDownloadPage: false,
  isCheckingUpdates: false,
  onCheckForUpdates: () => undefined,
  onOpenDownloadPage: () => undefined,
} as const;

const panelDefaults = {
  sidebarExpanded: false,
  sectionAvailability: deriveSettingsNavigationAvailability({
    hasActiveAccountSession: true,
  }),
  onClose: () => undefined,
  onSectionChange: () => undefined,
  onSidebarExpandedChange: () => undefined,
  multiSessionsEnabled: true,
  onMultiSessionsChange: () => undefined,
  account: accountDefaults,
  systemState: systemStateTestDefaults,
  ...settingsCodecTestDefaults,
  ...themeDefaults,
  ...autoAnswerDefaults,
  ...appUpdateDefaults,
  ...settingsHeadsetStoryDefaults,
  preferredAudioInputDeviceId: settingsVideoStoryDefaults.preferredAudioInputDeviceId,
  preferredVideoInputDeviceId: settingsVideoStoryDefaults.preferredVideoInputDeviceId,
  defaultSessionView: settingsVideoStoryDefaults.defaultSessionView,
  autoFullscreenOnConference: settingsVideoStoryDefaults.autoFullscreenOnConference,
  conferenceNumberSubstring: settingsVideoStoryDefaults.conferenceNumberSubstring,
  enableLocalVideoAfterConnect: settingsVideoStoryDefaults.enableLocalVideoAfterConnect,
  videoAudioDevices: settingsVideoStoryDefaults.audioDevices,
  videoCameraDevices: settingsVideoStoryDefaults.videoDevices,
  videoDevicesLoading: settingsVideoStoryDefaults.devicesLoading,
  videoDevicesError: settingsVideoStoryDefaults.devicesError,
  videoPreviewError: settingsVideoStoryDefaults.previewError,
  videoPreviewRef: settingsVideoStoryDefaults.previewVideoRef,
  onPreferredAudioInputDeviceIdChange:
    settingsVideoStoryDefaults.onPreferredAudioInputDeviceIdChange,
  onPreferredVideoInputDeviceIdChange:
    settingsVideoStoryDefaults.onPreferredVideoInputDeviceIdChange,
  onDefaultSessionViewChange: settingsVideoStoryDefaults.onDefaultSessionViewChange,
  onAutoFullscreenOnConferenceChange:
    settingsVideoStoryDefaults.onAutoFullscreenOnConferenceChange,
  onConferenceNumberSubstringChange:
    settingsVideoStoryDefaults.onConferenceNumberSubstringChange,
  onEnableLocalVideoAfterConnectChange:
    settingsVideoStoryDefaults.onEnableLocalVideoAfterConnectChange,
  onRefreshVideoDevices: settingsVideoStoryDefaults.onRefreshDevices,
  ...settingsIntegrationsStoryDefaults,
} as const;

export const GeneralSection: Story = {
  args: {
    ...panelDefaults,
    activeSection: "general",
  },
};

export const SessionsSection: Story = {
  args: {
    ...panelDefaults,
    activeSection: "sessions",
    multiSessionsEnabled: false,
  },
};

export const SystemStateSectionLight: Story = {
  args: {
    ...panelDefaults,
    activeSection: "system-state",
    theme: "light",
  },
  parameters: {
    themes: {
      themeOverride: "light",
    },
  },
};

export const SystemStateSectionDark: Story = {
  args: {
    ...panelDefaults,
    activeSection: "system-state",
    theme: "dark",
    onThemeChange: () => undefined,
  },
  parameters: {
    themes: {
      themeOverride: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: "100vh", background: "var(--color-bg-app)" }}>
        <SettingsFullscreenOverlay
          open
          onClose={() => undefined}
          windowControls={storyWindowControls}
        >
          <Story />
        </SettingsFullscreenOverlay>
      </div>
    ),
  ],
};

export const CodecsSection: Story = {
  args: {
    ...panelDefaults,
    activeSection: "codecs",
  },
};

export const HeadsetSection: Story = {
  args: {
    ...panelDefaults,
    activeSection: "headset",
    headsetEnabled: true,
    headsetConnectionProjection: {
      ...settingsHeadsetStoryDefaults.headsetConnectionProjection,
      isSupported: true,
      isEnabled: true,
      connectionState: "connected",
      deviceLabel: "Jabra Evolve2 65",
    },
  },
};

export const VideoSection: Story = {
  args: {
    ...panelDefaults,
    activeSection: "video",
    preferredVideoInputDeviceId: "cam-1",
    defaultSessionView: "expanded",
    autoFullscreenOnConference: true,
    conferenceNumberSubstring: "conf",
  },
};

export const SidebarExpanded: Story = {
  args: {
    ...panelDefaults,
    activeSection: "account",
    sidebarExpanded: true,
  },
};

export const AccountSectionRegisteredLight: Story = {
  args: {
    ...panelDefaults,
    activeSection: "account",
    account: {
      ...accountDefaults,
      authorizeDisabledReason: "Необходимо выйти из аккаунта",
    },
    theme: "light",
  },
  parameters: {
    themes: {
      themeOverride: "light",
    },
  },
};

export const AccountSectionRegisteredDark: Story = {
  args: {
    ...panelDefaults,
    activeSection: "account",
    account: {
      ...accountDefaults,
      authorizeDisabledReason: "Необходимо выйти из аккаунта",
    },
    theme: "dark",
  },
  parameters: {
    themes: {
      themeOverride: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ minHeight: "100vh", background: "var(--color-bg-app)" }}>
        <SettingsFullscreenOverlay
          open
          onClose={() => undefined}
          windowControls={storyWindowControls}
        >
          <Story />
        </SettingsFullscreenOverlay>
      </div>
    ),
  ],
};
