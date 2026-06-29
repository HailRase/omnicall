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
    header: (
      <p style={{ margin: 0, padding: "10px 12px" }}>
        Header zone — status, settings, diagnostics
      </p>
    ),
    context: (
      <p style={{ margin: 0, padding: "8px" }}>
        Context zone — call lines and active card stay mounted
      </p>
    ),
    controls: (
      <p style={{ margin: 0 }}>
        Controls zone — dialpad and active call controls
      </p>
    ),
    overlays: null,
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <Story />
      </div>
    ),
  ],
};
