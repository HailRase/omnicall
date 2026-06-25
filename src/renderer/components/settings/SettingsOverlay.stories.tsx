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

export const MultiSessionsEnabled: Story = {
  args: {
    multiSessionsEnabled: true,
    onMultiSessionsChange: () => undefined,
  },
};

export const MultiSessionsDisabled: Story = {
  args: {
    multiSessionsEnabled: false,
    onMultiSessionsChange: () => undefined,
  },
};
