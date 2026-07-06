import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { IconButtonVariant } from "../types.js";
import { IconButton } from "./IconButton.js";

const VARIANTS: readonly IconButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
];

const meta = {
  title: "UI Kit/IconButton",
  component: IconButton,
  args: {
    iconId: "shell.settings",
    ariaLabel: "Settings",
    variant: "ghost",
    size: "md",
    loading: false,
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
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <IconButton
          key={variant}
          iconId="overlay.close"
          ariaLabel={`${variant} action`}
          variant={variant}
        />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-sm)" }}>
      <IconButton iconId="shell.settings" ariaLabel="Small" size="sm" />
      <IconButton iconId="shell.settings" ariaLabel="Medium" size="md" />
      <IconButton iconId="shell.settings" ariaLabel="Large" size="lg" />
    </div>
  ),
};

export const DisabledReason: Story = {
  render: () => (
    <IconButton
      iconId="dial.call"
      ariaLabel="Call"
      variant="primary"
      disabledReason="SIP not registered"
      tooltipLabel="Call"
    />
  ),
};

export const Tooltip: Story = {
  args: {
    iconId: "shell.diagnostics",
    ariaLabel: "Diagnostics",
    tooltipLabel: "Open diagnostics",
    variant: "outline",
  },
};

export const Loading: Story = {
  args: {
    iconId: "overlay.close",
    ariaLabel: "Close",
    loading: true,
    variant: "ghost",
  },
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <IconButton
          key={variant}
          iconId="overlay.close"
          ariaLabel={`${variant} action`}
          variant={variant}
        />
      ))}
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <IconButton
          key={variant}
          iconId="overlay.close"
          ariaLabel={`${variant} action`}
          variant={variant}
        />
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
        alignItems: "center",
        gap: "var(--space-xs)",
        padding: "var(--space-sm)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-panel)",
        background: "var(--color-bg-surface)",
      }}
    >
      <IconButton iconId="call.mute" ariaLabel="Mute" variant="ghost" size="sm" tooltipLabel="Mute" />
      <IconButton iconId="call.hold" ariaLabel="Hold" variant="ghost" size="sm" tooltipLabel="Hold" />
      <IconButton iconId="call.transfer" ariaLabel="Transfer" variant="ghost" size="sm" tooltipLabel="Transfer" />
      <IconButton iconId="call.hangup" ariaLabel="Hang up" variant="destructive" size="sm" tooltipLabel="Hang up" />
    </div>
  ),
};
