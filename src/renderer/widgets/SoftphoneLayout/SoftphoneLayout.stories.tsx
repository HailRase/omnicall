import type { Meta, StoryObj } from "@storybook/react";
import { SoftphoneLayout } from "./SoftphoneLayout.js";

const meta = {
  title: "Layout/SoftphoneLayout",
  component: SoftphoneLayout,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SoftphoneLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Zones: Story = {
  args: {
    header: <p>Header zone — status, settings, diagnostics</p>,
    context: <p>Context zone — call lines and active card stay mounted</p>,
    controls: <p>Controls zone — dialpad and active call controls</p>,
    overlays: <p>Overlay layer — modals and sheets</p>,
  },
};
