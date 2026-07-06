import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label.js";

const meta = {
  title: "UI Kit/Label",
  component: Label,
  args: {
    children: "Email address",
    required: false,
    disabled: false,
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
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    children: "Username",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Account ID",
    disabled: true,
  },
};

export const WithControl: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", maxWidth: 320 }}>
      <Label htmlFor="label-story-input" required>
        Display name
      </Label>
      <input
        id="label-story-input"
        type="text"
        defaultValue="Operator"
        style={{
          padding: "var(--space-xs) var(--space-sm)",
          border: "1px solid var(--color-border-control)",
          borderRadius: "var(--radius-control)",
          background: "var(--color-bg-surface)",
          color: "var(--color-text-primary)",
        }}
      />
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Label>Default label</Label>
      <Label required>Required label</Label>
      <Label disabled>Disabled label</Label>
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Label>Default label</Label>
      <Label required>Required label</Label>
      <Label disabled>Disabled label</Label>
    </div>
  ),
};
