import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner.js";

const meta = {
  title: "UI Kit/Spinner",
  component: Spinner,
  args: {
    size: "md",
    decorative: false,
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
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
      <Spinner size="sm" label="Loading small" />
      <Spinner size="md" label="Loading medium" />
      <Spinner size="lg" label="Loading large" />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    label: "Loading data",
  },
};

export const Decorative: Story = {
  args: {
    decorative: true,
    size: "sm",
  },
  render: (args) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-xs)",
        color: "var(--color-text-primary)",
      }}
    >
      <Spinner {...args} />
      <span>Saving</span>
    </span>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <Spinner label="Loading" />
      <Spinner size="lg" label="Loading large" />
      <Spinner decorative />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <Spinner label="Loading" />
      <Spinner size="lg" label="Loading large" />
      <Spinner decorative />
    </div>
  ),
};
