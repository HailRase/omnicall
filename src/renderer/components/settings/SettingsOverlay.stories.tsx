import type { Meta, StoryObj } from "@storybook/react";
import { SettingsFullscreenOverlay } from "./SettingsFullscreenOverlay.js";
import { SettingsPanel } from "./SettingsPanel.js";

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
  disabled: false,
  authorizeDisabledReason: null,
  logoutDisabledReason: "Сначала нажмите «Авторизоваться»",
  onFieldChange: () => undefined,
  onSubmit: () => undefined,
  onLogout: () => undefined,
} as const;

const themeDefaults = {
  theme: "light" as const,
  onThemeChange: () => undefined,
} as const;

const sipRecoveryDefaults = {
  sipAutoReregisterEnabled: true,
  onSipAutoReregisterChange: () => undefined,
  sipReregisterIntervalSec: 5,
  onSipReregisterIntervalChange: () => undefined,
} as const;

export const GeneralSection: Story = {
  args: {
    activeSection: "general",
    sidebarExpanded: false,
    onClose: () => undefined,
    onSectionChange: () => undefined,
    onSidebarExpandedChange: () => undefined,
    multiSessionsEnabled: true,
    onMultiSessionsChange: () => undefined,
    account: accountDefaults,
    ...themeDefaults,
    ...sipRecoveryDefaults,
  },
};

export const SessionsSection: Story = {
  args: {
    activeSection: "sessions",
    sidebarExpanded: false,
    onClose: () => undefined,
    onSectionChange: () => undefined,
    onSidebarExpandedChange: () => undefined,
    multiSessionsEnabled: false,
    onMultiSessionsChange: () => undefined,
    account: accountDefaults,
    ...themeDefaults,
    ...sipRecoveryDefaults,
  },
};

export const SidebarExpanded: Story = {
  args: {
    activeSection: "account",
    sidebarExpanded: true,
    onClose: () => undefined,
    onSectionChange: () => undefined,
    onSidebarExpandedChange: () => undefined,
    multiSessionsEnabled: true,
    onMultiSessionsChange: () => undefined,
    account: accountDefaults,
    ...themeDefaults,
    ...sipRecoveryDefaults,
  },
};
