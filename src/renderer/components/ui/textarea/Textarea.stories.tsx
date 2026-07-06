import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea.js";
import type { ControlSize, TextareaResize } from "../types.js";

const SIZES: readonly ControlSize[] = ["sm", "md", "lg"];
const RESIZE_OPTIONS: readonly TextareaResize[] = ["none", "vertical"];

const meta = {
  title: "UI Kit/Textarea",
  component: Textarea,
  args: {
    "aria-label": "Field",
    placeholder: "Enter text",
    size: "md",
    invalid: false,
    disabled: false,
    readOnly: false,
    resize: "vertical",
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
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {SIZES.map((size) => (
        <Textarea
          key={size}
          size={size}
          aria-label={`${size} textarea`}
          placeholder={`${size} size`}
          defaultValue={`${size} textarea content`}
        />
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
    defaultValue: "Too short",
    "aria-describedby": "textarea-error-hint",
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
      <Textarea {...args} />
      <span
        id="textarea-error-hint"
        style={{ color: "var(--color-text-danger)", fontSize: "0.8125rem" }}
      >
        Enter at least 20 characters.
      </span>
    </div>
  ),
};

export const Resize: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {RESIZE_OPTIONS.map((resize) => (
        <Textarea
          key={resize}
          resize={resize}
          aria-label={`${resize} resize`}
          defaultValue={`Resize: ${resize}`}
        />
      ))}
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Textarea aria-label="Default light" placeholder="Default" />
      <Textarea aria-label="Invalid light" invalid defaultValue="bad" />
      <Textarea aria-label="Disabled light" disabled defaultValue="off" />
      <Textarea aria-label="Readonly light" readOnly defaultValue="locked" />
      <Textarea aria-label="No resize light" resize="none" defaultValue="fixed height" />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Textarea aria-label="Default dark" placeholder="Default" />
      <Textarea aria-label="Invalid dark" invalid defaultValue="bad" />
      <Textarea aria-label="Disabled dark" disabled defaultValue="off" />
      <Textarea aria-label="Readonly dark" readOnly defaultValue="locked" />
      <Textarea aria-label="No resize dark" resize="none" defaultValue="fixed height" />
    </div>
  ),
};
