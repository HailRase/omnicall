import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { ControlSize } from "../types.js";
import { Select, type SelectItemOption } from "./Select.js";

const SIZES: readonly ControlSize[] = ["sm", "md", "lg"];

const LANGUAGE_ITEMS: readonly SelectItemOption[] = [
  { value: "ru", label: "Russian" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const MANY_ITEMS: readonly SelectItemOption[] = Array.from({ length: 24 }, (_, index) => ({
  value: `item-${index + 1}`,
  label: `Option ${index + 1}`,
}));

const meta = {
  title: "UI Kit/Select",
  component: Select,
  args: {
    "aria-label": "Language",
    items: LANGUAGE_ITEMS,
    placeholder: "Choose language",
    size: "md",
    invalid: false,
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
            maxWidth: 360,
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: "en",
  },
};

export const Placeholder: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "ru",
  },
};

export const Invalid: Story = {
  args: {
    invalid: true,
    defaultValue: "bad",
    "aria-describedby": "select-error-hint",
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
      <Select {...args} items={LANGUAGE_ITEMS} />
      <span
        id="select-error-hint"
        style={{ color: "var(--color-text-danger)", fontSize: "0.8125rem" }}
      >
        Choose a supported language.
      </span>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {SIZES.map((size) => (
        <Select
          key={size}
          size={size}
          aria-label={`${size} select`}
          items={LANGUAGE_ITEMS}
          defaultValue="en"
        />
      ))}
    </div>
  ),
};

export const ManyItems: Story = {
  args: {
    "aria-label": "Many options",
    items: MANY_ITEMS,
    defaultOpen: true,
    defaultValue: "item-1",
  },
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState("ru");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <Select
          aria-label="Controlled language"
          items={LANGUAGE_ITEMS}
          value={value}
          onValueChange={setValue}
        />
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>
          Selected value: {value}
        </span>
      </div>
    );
  },
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Select aria-label="Default light" items={LANGUAGE_ITEMS} defaultValue="en" />
      <Select aria-label="Placeholder light" items={LANGUAGE_ITEMS} placeholder="Choose language" />
      <Select aria-label="Invalid light" items={LANGUAGE_ITEMS} invalid defaultValue="en" />
      <Select aria-label="Disabled light" items={LANGUAGE_ITEMS} disabled defaultValue="ru" />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <Select aria-label="Default dark" items={LANGUAGE_ITEMS} defaultValue="en" />
      <Select aria-label="Placeholder dark" items={LANGUAGE_ITEMS} placeholder="Choose language" />
      <Select aria-label="Invalid dark" items={LANGUAGE_ITEMS} invalid defaultValue="en" />
      <Select aria-label="Disabled dark" items={LANGUAGE_ITEMS} disabled defaultValue="ru" />
    </div>
  ),
};
