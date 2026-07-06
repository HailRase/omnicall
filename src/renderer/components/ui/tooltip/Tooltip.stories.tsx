import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button/Button.js";
import { IconButton } from "../icon-button/IconButton.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "./Tooltip.js";

const meta = {
  title: "UI Kit/Tooltip",
  parameters: {
    layout: "centered",
  },
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            padding: "var(--space-xl)",
            background: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip label="Additional context for this action" delayDuration={0}>
      <Button variant="outline">Hover or focus me</Button>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "var(--space-lg)",
        justifyItems: "center",
        padding: "var(--space-2xl)",
      }}
    >
      <Tooltip label="Top placement" side="top" delayDuration={0}>
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <div style={{ display: "flex", gap: "var(--space-xl)" }}>
        <Tooltip label="Left placement" side="left" delayDuration={0}>
          <Button variant="secondary">Left</Button>
        </Tooltip>
        <Tooltip label="Right placement" side="right" delayDuration={0}>
          <Button variant="secondary">Right</Button>
        </Tooltip>
      </div>
      <Tooltip label="Bottom placement" side="bottom" delayDuration={0}>
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
    </div>
  ),
};

export const Delay: Story = {
  render: () => (
    <Tooltip label="Appears after the configured delay" delayDuration={700}>
      <Button variant="ghost">Delayed tooltip (700ms)</Button>
    </Tooltip>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-md)" }}>
      <Tooltip label="This tooltip is suppressed" disabled delayDuration={0}>
        <Button variant="outline">Disabled tooltip</Button>
      </Tooltip>
      <Tooltip label="" delayDuration={0}>
        <Button variant="outline">Empty label</Button>
      </Tooltip>
    </div>
  ),
};

export const LongText: Story = {
  render: () => (
    <Tooltip
      label="This tooltip wraps longer assistive copy when the label exceeds the maximum width of the floating surface."
      delayDuration={0}
    >
      <Button variant="outline">Long tooltip text</Button>
    </Tooltip>
  ),
};

export const WithIconButton: Story = {
  render: () => (
    <Tooltip label="Open settings panel" delayDuration={0}>
      <IconButton iconId="shell.settings" ariaLabel="Settings" variant="ghost" />
    </Tooltip>
  ),
};

export const Composable: Story = {
  render: () => (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <TooltipRoot defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="primary">Composable API</Button>
        </TooltipTrigger>
        <TooltipContent>Built from provider, root, trigger, and content</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <Tooltip label="Light theme tooltip surface" delayDuration={0}>
      <Button variant="outline">Light</Button>
    </Tooltip>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <Tooltip label="Dark theme tooltip surface" delayDuration={0}>
      <Button variant="outline">Dark</Button>
    </Tooltip>
  ),
};
