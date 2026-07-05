import type { Meta, StoryObj } from "@storybook/react";
import { SettingsFullscreenOverlay } from "./SettingsFullscreenOverlay.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { systemStateTestDefaults } from "./panels/settingsSystemStateTestDefaults.js";
import { settingsCodecTestDefaults } from "./panels/settingsCodecTestDefaults.js";

const meta = {
  title: "Settings/SettingsPanel",
  component: SettingsPanel,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <SettingsFullscreenOverlay open onClose={() => undefined}>
        <Story />
      </SettingsFullscreenOverlay>
    ),
  ],
} satisfies Meta<typeof SettingsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const accountDefaults = {
  form: { username: "user", password: "", domain: "example.com", server: "sip.example.com" },
  submitting: false,
  error: null,
  successKey: null,
  disabled: false,
  authorizeDisabledReason: null,
  logoutDisabledReason: "Сначала нажмите «Авторизоваться»",
  onFieldChange: () => undefined,
  onSubmit: () => undefined,
  onLogout: () => undefined,
} as const;

const themeDefaults = {
  language: "ru" as const,
  onLanguageChange: () => undefined,
  theme: "light" as const,
  onThemeChange: () => undefined,
} as const;

const autoAnswerDefaults = {
  autoAnswerEnabled: true,
  autoAnswerTimeoutSec: 8,
  onAutoAnswerEnabledChange: () => undefined,
  onAutoAnswerTimeoutChange: () => undefined,
  autoAnswerDuringActiveSessionEnabled: true,
  onAutoAnswerDuringActiveSessionChange: () => undefined,
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
        <SettingsFullscreenOverlay open onClose={() => undefined}>
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

export const SidebarExpanded: Story = {
  args: {
    ...panelDefaults,
    activeSection: "account",
    sidebarExpanded: true,
  },
};
