import type { Meta, StoryObj } from "@storybook/react";
import { SettingsOverlay } from "./SettingsOverlay.js";

const meta = {
  title: "Settings/SettingsOverlay",
  component: SettingsOverlay,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SettingsOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

const sipRecoveryDefaults = {
  sipAutoReregisterEnabled: true,
  onSipAutoReregisterChange: () => undefined,
  sipReregisterIntervalSec: 5,
  onSipReregisterIntervalChange: () => undefined,
} as const;

export const MultiSessionsEnabled: Story = {
  args: {
    multiSessionsEnabled: true,
    onMultiSessionsChange: () => undefined,
    ...sipRecoveryDefaults,
  },
};

export const MultiSessionsDisabled: Story = {
  args: {
    multiSessionsEnabled: false,
    onMultiSessionsChange: () => undefined,
    ...sipRecoveryDefaults,
  },
};
