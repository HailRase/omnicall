import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button.js";
import type { ButtonVariant } from "../types.js";

const VARIANTS: readonly ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
];

const meta = {
  title: "UI Kit/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    loading: false,
    fullWidth: false,
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
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-sm)" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon action">
        +
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "Saving",
  },
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Button fullWidth>Full width action</Button>
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const ActionRow: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--space-xs)",
        padding: "var(--space-sm)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-panel)",
        background: "var(--color-bg-surface)",
      }}
    >
      <Button variant="primary" size="sm">
        Confirm
      </Button>
      <Button variant="secondary" size="sm">
        Cancel
      </Button>
      <Button variant="ghost" size="sm">
        More
      </Button>
    </div>
  ),
};
