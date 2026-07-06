import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge.js";
import type { BadgeSize, BadgeTone } from "../types.js";

const TONES: readonly BadgeTone[] = [
  "default",
  "muted",
  "success",
  "warning",
  "destructive",
  "info",
];

const SIZES: readonly BadgeSize[] = ["sm", "md"];

const meta = {
  title: "UI Kit/Badge",
  component: Badge,
  args: {
    children: "Badge",
    tone: "default",
    size: "md",
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
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-sm)" }}>
      {SIZES.map((size) => (
        <Badge key={size} size={size} tone="info">
          {size}
        </Badge>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      <Badge tone="success" iconId="operator.ready">
        Ready
      </Badge>
      <Badge tone="warning" iconId="operator.break">
        Break
      </Badge>
      <Badge tone="destructive" iconId="call.phone-off">
        Offline
      </Badge>
      <Badge tone="info" iconId="call.incoming">
        Incoming
      </Badge>
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const DenseComposition: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-xs)",
        maxWidth: 360,
        padding: "var(--space-sm)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-panel)",
        background: "var(--color-bg-surface)",
      }}
    >
      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
        Queue
      </span>
      <Badge tone="info" size="sm" iconId="call.incoming">
        Support
      </Badge>
      <Badge tone="muted" size="sm">
        Waiting
      </Badge>
      <Badge tone="success" size="sm">
        SLA OK
      </Badge>
    </div>
  ),
};
