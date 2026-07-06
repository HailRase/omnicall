import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input.js";
import type { ControlSize } from "../types.js";

const SIZES: readonly ControlSize[] = ["sm", "md", "lg"];

const meta = {
  title: "UI Kit/Input",
  component: Input,
  args: {
    "aria-label": "Field",
    placeholder: "Enter value",
    size: "md",
    invalid: false,
    disabled: false,
    readOnly: false,
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
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {SIZES.map((size) => (
        <Input key={size} size={size} aria-label={`${size} input`} placeholder={`${size} size`} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Disabled value",
  },
};

export const Readonly: Story = {
  args: {
    readOnly: true,
    defaultValue: "Readonly value",
  },
};

export const Invalid: Story = {
  args: {
    invalid: true,
    defaultValue: "invalid@",
    "aria-describedby": "input-error-hint",
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
      <Input {...args} />
      <span id="input-error-hint" style={{ color: "var(--color-text-danger)", fontSize: "0.8125rem" }}>
        Enter a valid email address.
      </span>
    </div>
  ),
};

export const PrefixSuffix: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Input aria-label="Host" prefix="https://" placeholder="example.com" />
      <Input aria-label="Timeout" suffix="sec" defaultValue="30" />
      <Input aria-label="Search" prefix="@" suffix=".local" defaultValue="agent" />
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Input aria-label="Default light" placeholder="Default" />
      <Input aria-label="Invalid light" invalid defaultValue="bad" />
      <Input aria-label="Disabled light" disabled defaultValue="off" />
      <Input aria-label="Readonly light" readOnly defaultValue="locked" />
      <Input aria-label="Affix light" prefix="$" suffix="USD" defaultValue="42" />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Input aria-label="Default dark" placeholder="Default" />
      <Input aria-label="Invalid dark" invalid defaultValue="bad" />
      <Input aria-label="Disabled dark" disabled defaultValue="off" />
      <Input aria-label="Readonly dark" readOnly defaultValue="locked" />
      <Input aria-label="Affix dark" prefix="$" suffix="USD" defaultValue="42" />
    </div>
  ),
};
