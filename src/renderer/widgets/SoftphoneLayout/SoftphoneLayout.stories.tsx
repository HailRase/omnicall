import type { Meta, StoryObj } from "@storybook/react";
import { SoftphoneLayout } from "./SoftphoneLayout.js";

const meta = {
  title: "Layout/SoftphoneLayout",
  component: SoftphoneLayout,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story, context) => {
      const theme = context.parameters["theme"] as "light" | "dark" | undefined;
      document.documentElement.setAttribute("data-theme", theme ?? "light");
      return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof SoftphoneLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

const zoneArgs: Story["args"] = {
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
};

export const LightZones: Story = {
  args: zoneArgs,
  parameters: {
    theme: "light",
  },
};

export const DarkZones: Story = {
  args: zoneArgs,
  parameters: {
    theme: "dark",
  },
};
