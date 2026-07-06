import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./Progress.js";

const meta = {
  title: "UI Kit/Progress",
  component: Progress,
  args: {
    value: 45,
    max: 100,
    tone: "default",
  },
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            padding: "var(--space-md)",
            background: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
            maxWidth: 360,
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "aria-label": "Operation progress",
  },
};

export const Indeterminate: Story = {
  args: {
    value: null,
    "aria-label": "Loading",
  },
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <Progress value={55} tone="default" label="Default tone" />
      <Progress value={70} tone="success" label="Success tone" />
      <Progress value={40} tone="warning" label="Warning tone" />
      <Progress value={85} tone="destructive" label="Destructive tone" />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    label: "Downloading update package",
    value: 62,
  },
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <Progress value={25} label="Determinate" />
      <Progress value={null} label="Indeterminate" aria-label="Indeterminate progress" />
      <Progress value={90} tone="success" label="Complete soon" />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <Progress value={25} label="Determinate" />
      <Progress value={null} label="Indeterminate" aria-label="Indeterminate progress" />
      <Progress value={90} tone="success" label="Complete soon" />
    </div>
  ),
};
