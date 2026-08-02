import type { Meta, StoryObj } from "@storybook/react";
import { createDefaultUserNotificationPreferences } from "@application/index.js";
import { SettingsNotificationPreferencesPanel } from "./SettingsNotificationPreferencesPanel.js";

const meta = {
  title: "Settings/SettingsNotificationPreferencesPanel",
  component: SettingsNotificationPreferencesPanel,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SettingsNotificationPreferencesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  preferences: createDefaultUserNotificationPreferences(),
  onMasterInAppPopupEnabledChange: () => undefined,
  onModuleEnabledChange: () => undefined,
  onModuleMinLevelChange: () => undefined,
  onModuleRaiseWindowChange: () => undefined,
  onApplyPreset: () => undefined,
};

export const Light: Story = {
  args: baseArgs,
  parameters: {
    themes: {
      themeOverride: "light",
    },
  },
};

export const Dark: Story = {
  args: baseArgs,
  parameters: {
    themes: {
      themeOverride: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 24, background: "var(--color-bg-app)" }}>
        <Story />
      </div>
    ),
  ],
};

export const MasterOff: Story = {
  args: {
    ...baseArgs,
    preferences: {
      ...createDefaultUserNotificationPreferences(),
      masterInAppPopupEnabled: false,
    },
  },
};
