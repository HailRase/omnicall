import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../label/Label.js";
import { Switch } from "./Switch.js";

const meta = {
  title: "UI Kit/Switch",
  component: Switch,
  args: {
    disabled: false,
    defaultChecked: false,
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
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "aria-label": "Enable notifications",
  },
};

export const Checked: Story = {
  args: {
    "aria-label": "Dark theme",
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    "aria-label": "Unavailable setting",
    disabled: true,
    defaultChecked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-md)",
        maxWidth: 320,
      }}
    >
      <Label htmlFor="switch-story-auto-answer">Auto answer</Label>
      <Switch id="switch-story-auto-answer" defaultChecked />
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Switch aria-label="Default switch" />
      <Switch aria-label="Checked switch" defaultChecked />
      <Switch aria-label="Disabled switch" disabled />
      <Switch aria-label="Disabled checked switch" disabled defaultChecked />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Switch aria-label="Default switch" />
      <Switch aria-label="Checked switch" defaultChecked />
      <Switch aria-label="Disabled switch" disabled />
      <Switch aria-label="Disabled checked switch" disabled defaultChecked />
    </div>
  ),
};
