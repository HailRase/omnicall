import type { Meta, StoryObj } from "@storybook/react";
import { TransferSuccessOverlay } from "./TransferSuccessOverlay.js";

const meta = {
  title: "Call/TransferSuccessOverlay",
  component: TransferSuccessOverlay,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TransferSuccessOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = {
  args: {
    visible: true,
    exiting: false,
  },
  globals: {
    theme: "light",
  },
};

export const Dark: Story = {
  args: {
    visible: true,
    exiting: false,
  },
  globals: {
    theme: "dark",
  },
};

export const Exiting: Story = {
  args: {
    visible: true,
    exiting: true,
  },
};
