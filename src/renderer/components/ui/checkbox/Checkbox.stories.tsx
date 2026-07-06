import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox.js";
import { Label } from "../label/Label.js";

const meta = {
  title: "UI Kit/Checkbox",
  component: Checkbox,
  args: {
    disabled: false,
    invalid: false,
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
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
      <Checkbox {...args} id="checkbox-default" aria-labelledby="checkbox-default-label" />
      <Label htmlFor="checkbox-default" id="checkbox-default-label">
        Accept terms
      </Label>
    </div>
  ),
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
      <Checkbox {...args} id="checkbox-checked" aria-labelledby="checkbox-checked-label" />
      <Label htmlFor="checkbox-checked" id="checkbox-checked-label">
        Notifications enabled
      </Label>
    </div>
  ),
};

export const Indeterminate: Story = {
  args: {
    checked: "indeterminate",
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
      <Checkbox {...args} id="checkbox-indeterminate" aria-labelledby="checkbox-indeterminate-label" />
      <Label htmlFor="checkbox-indeterminate" id="checkbox-indeterminate-label">
        Select all (partial)
      </Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
      <Checkbox {...args} id="checkbox-disabled" aria-labelledby="checkbox-disabled-label" />
      <Label htmlFor="checkbox-disabled" id="checkbox-disabled-label" disabled>
        Locked preference
      </Label>
    </div>
  ),
};

export const Invalid: Story = {
  args: {
    invalid: true,
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
      <Checkbox {...args} id="checkbox-invalid" aria-labelledby="checkbox-invalid-label" />
      <Label htmlFor="checkbox-invalid" id="checkbox-invalid-label">
        Required consent
      </Label>
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox id="checkbox-light-unchecked" aria-labelledby="checkbox-light-unchecked-label" />
        <Label htmlFor="checkbox-light-unchecked" id="checkbox-light-unchecked-label">
          Unchecked
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-light-checked"
          defaultChecked
          aria-labelledby="checkbox-light-checked-label"
        />
        <Label htmlFor="checkbox-light-checked" id="checkbox-light-checked-label">
          Checked
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-light-indeterminate"
          checked="indeterminate"
          aria-labelledby="checkbox-light-indeterminate-label"
        />
        <Label htmlFor="checkbox-light-indeterminate" id="checkbox-light-indeterminate-label">
          Indeterminate
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-light-invalid"
          invalid
          aria-labelledby="checkbox-light-invalid-label"
        />
        <Label htmlFor="checkbox-light-invalid" id="checkbox-light-invalid-label">
          Invalid
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-light-disabled"
          disabled
          defaultChecked
          aria-labelledby="checkbox-light-disabled-label"
        />
        <Label htmlFor="checkbox-light-disabled" id="checkbox-light-disabled-label" disabled>
          Disabled
        </Label>
      </div>
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox id="checkbox-dark-unchecked" aria-labelledby="checkbox-dark-unchecked-label" />
        <Label htmlFor="checkbox-dark-unchecked" id="checkbox-dark-unchecked-label">
          Unchecked
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-dark-checked"
          defaultChecked
          aria-labelledby="checkbox-dark-checked-label"
        />
        <Label htmlFor="checkbox-dark-checked" id="checkbox-dark-checked-label">
          Checked
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-dark-indeterminate"
          checked="indeterminate"
          aria-labelledby="checkbox-dark-indeterminate-label"
        />
        <Label htmlFor="checkbox-dark-indeterminate" id="checkbox-dark-indeterminate-label">
          Indeterminate
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-dark-invalid"
          invalid
          aria-labelledby="checkbox-dark-invalid-label"
        />
        <Label htmlFor="checkbox-dark-invalid" id="checkbox-dark-invalid-label">
          Invalid
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <Checkbox
          id="checkbox-dark-disabled"
          disabled
          defaultChecked
          aria-labelledby="checkbox-dark-disabled-label"
        />
        <Label htmlFor="checkbox-dark-disabled" id="checkbox-dark-disabled-label" disabled>
          Disabled
        </Label>
      </div>
    </div>
  ),
};
