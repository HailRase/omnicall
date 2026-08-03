import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../label/Label.js";
import { RadioGroup, RadioGroupItem } from "./RadioGroup.js";

function ThemeDecorator(
  StoryComponent: () => JSX.Element,
  context: { parameters: { theme?: "light" | "dark" } },
): JSX.Element {
  const theme = context.parameters.theme ?? "light";
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
}

const meta = {
  title: "UI Kit/RadioGroup",
  component: RadioGroup,
  args: {
    disabled: false,
    orientation: "vertical",
    defaultValue: "comfortable",
  },
  decorators: [ThemeDecorator],
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function OptionRow({
  id,
  value,
  label,
  disabled,
}: Readonly<{
  id: string;
  value: string;
  label: string;
  disabled?: boolean;
}>): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
      <RadioGroupItem
        value={value}
        id={id}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
      />
      <Label htmlFor={id} id={`${id}-label`} disabled={disabled === true}>
        {label}
      </Label>
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args} aria-label="Density">
      <OptionRow id="rg-default" value="default" label="Default" />
      <OptionRow id="rg-comfortable" value="comfortable" label="Comfortable" />
      <OptionRow id="rg-compact" value="compact" label="Compact" />
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    defaultValue: "left",
  },
  render: (args) => (
    <RadioGroup {...args} aria-label="Alignment">
      <OptionRow id="rg-left" value="left" label="Left" />
      <OptionRow id="rg-center" value="center" label="Center" />
      <OptionRow id="rg-right" value="right" label="Right" />
    </RadioGroup>
  ),
};

export const DisabledGroup: Story = {
  args: {
    disabled: true,
    defaultValue: "b",
  },
  render: (args) => (
    <RadioGroup {...args} aria-label="Disabled group">
      <OptionRow id="rg-dg-a" value="a" label="Option A" />
      <OptionRow id="rg-dg-b" value="b" label="Option B" />
    </RadioGroup>
  ),
};

export const DisabledItem: Story = {
  args: {
    defaultValue: "a",
  },
  render: (args) => (
    <RadioGroup {...args} aria-label="Disabled item group">
      <OptionRow id="rg-di-a" value="a" label="Available" />
      <OptionRow id="rg-di-b" value="b" label="Unavailable" disabled />
    </RadioGroup>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <RadioGroup defaultValue="one" aria-label="Light theme options">
      <OptionRow id="rg-light-1" value="one" label="One" />
      <OptionRow id="rg-light-2" value="two" label="Two" />
      <OptionRow id="rg-light-3" value="three" label="Three" disabled />
    </RadioGroup>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <RadioGroup defaultValue="one" aria-label="Dark theme options">
      <OptionRow id="rg-dark-1" value="one" label="One" />
      <OptionRow id="rg-dark-2" value="two" label="Two" />
      <OptionRow id="rg-dark-3" value="three" label="Three" disabled />
    </RadioGroup>
  ),
};
