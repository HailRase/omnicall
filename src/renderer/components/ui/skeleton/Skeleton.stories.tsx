import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton.js";

const meta = {
  title: "UI Kit/Skeleton",
  component: Skeleton,
  args: {
    shape: "text",
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
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", maxWidth: 320 }}>
      <Skeleton shape="text" />
      <Skeleton shape="text" width="80%" />
      <Skeleton shape="text" width="60%" />
    </div>
  ),
};

export const Rectangle: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", maxWidth: 360 }}>
      <Skeleton shape="rectangle" />
      <Skeleton shape="rectangle" height={120} />
      <Skeleton shape="rectangle" width={200} height={48} />
    </div>
  ),
};

export const Circle: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
      <Skeleton shape="circle" />
      <Skeleton shape="circle" width={56} height={56} />
      <Skeleton shape="circle" width={32} height={32} />
    </div>
  ),
};

export const CompositeCard: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        width: 320,
        padding: "var(--space-md)",
        borderRadius: "var(--radius-panel)",
        border: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <Skeleton shape="circle" width={40} height={40} />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "var(--space-xs)" }}>
          <Skeleton shape="text" width="70%" />
          <Skeleton shape="text" width="45%" />
        </div>
      </div>
      <Skeleton shape="rectangle" height={96} />
      <div style={{ display: "flex", gap: "var(--space-xs)" }}>
        <Skeleton shape="rectangle" width={88} height={32} />
        <Skeleton shape="rectangle" width={88} height={32} />
      </div>
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", maxWidth: 320 }}>
      <Skeleton shape="text" />
      <Skeleton shape="rectangle" height={48} />
      <Skeleton shape="circle" />
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", maxWidth: 320 }}>
      <Skeleton shape="text" />
      <Skeleton shape="rectangle" height={48} />
      <Skeleton shape="circle" />
    </div>
  ),
};
