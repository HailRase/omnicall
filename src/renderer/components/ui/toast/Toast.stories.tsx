import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../button/Button.js";
import type { ToastTone } from "../types.js";
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from "./Toast.js";

const meta = {
  title: "UI Kit/Toast",
  component: ToastProvider,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            minHeight: "240px",
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
} satisfies Meta<typeof ToastProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToastExample({
  tone = "default",
  withDescription = true,
  withAction = false,
  withClose = true,
  defaultOpen = true,
}: Readonly<{
  tone?: ToastTone;
  withDescription?: boolean;
  withAction?: boolean;
  withClose?: boolean;
  defaultOpen?: boolean;
}>): JSX.Element {
  return (
    <ToastProvider swipeDirection="right">
      <ToastRoot tone={tone} defaultOpen={defaultOpen}>
        <ToastTitle>Settings saved</ToastTitle>
        {withDescription ? (
          <ToastDescription>Your preferences were updated successfully.</ToastDescription>
        ) : null}
        {withAction ? (
          <ToastAction altText="Undo settings change">Undo</ToastAction>
        ) : null}
        {withClose ? <ToastClose closeLabel="Dismiss toast" /> : null}
      </ToastRoot>
      <ToastViewport />
    </ToastProvider>
  );
}

export const Default: Story = {
  render: () => <ToastExample />,
};

export const Tones: Story = {
  render: () => (
    <ToastProvider>
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        {(["default", "info", "success", "warning", "destructive"] as const).map((tone) => (
          <ToastRoot key={tone} tone={tone} defaultOpen>
            <ToastTitle>{tone} toast</ToastTitle>
            <ToastDescription>Compact elevated surface with tone stripe.</ToastDescription>
            <ToastClose closeLabel="Dismiss toast" />
          </ToastRoot>
        ))}
      </div>
      <ToastViewport placement="bottom-right" />
    </ToastProvider>
  ),
};

export const WithAction: Story = {
  render: () => <ToastExample withAction />,
};

export const Closable: Story = {
  render: () => <ToastExample withClose />,
};

export const Stacked: Story = {
  render: () => (
    <ToastProvider>
      <ToastRoot defaultOpen>
        <ToastTitle>First toast</ToastTitle>
        <ToastDescription>Stacked in the viewport with consistent spacing.</ToastDescription>
        <ToastClose closeLabel="Dismiss toast" />
      </ToastRoot>
      <ToastRoot defaultOpen tone="info">
        <ToastTitle>Second toast</ToastTitle>
        <ToastDescription>Multiple toasts share one viewport region.</ToastDescription>
        <ToastClose closeLabel="Dismiss toast" />
      </ToastRoot>
      <ToastRoot defaultOpen tone="success">
        <ToastTitle>Third toast</ToastTitle>
        <ToastDescription>Placement stays fixed while items stack vertically.</ToastDescription>
        <ToastClose closeLabel="Dismiss toast" />
      </ToastRoot>
      <ToastViewport placement="bottom-right" />
    </ToastProvider>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);

    return (
      <ToastProvider>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Show toast
        </Button>
        <ToastRoot open={open} onOpenChange={setOpen}>
          <ToastTitle>Controlled toast</ToastTitle>
          <ToastDescription>Open state is managed by React state.</ToastDescription>
          <ToastClose closeLabel="Dismiss toast" />
        </ToastRoot>
        <ToastViewport />
      </ToastProvider>
    );
  },
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <ToastProvider>
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        {(["default", "info", "success", "warning", "destructive"] as const).map((tone) => (
          <ToastRoot key={tone} tone={tone} defaultOpen>
            <ToastTitle>Light {tone}</ToastTitle>
            <ToastDescription>All toast tones in light theme.</ToastDescription>
            <ToastClose closeLabel="Dismiss toast" />
          </ToastRoot>
        ))}
      </div>
      <ToastViewport placement="bottom-right" />
    </ToastProvider>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <ToastProvider>
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        {(["default", "info", "success", "warning", "destructive"] as const).map((tone) => (
          <ToastRoot key={tone} tone={tone} defaultOpen>
            <ToastTitle>Dark {tone}</ToastTitle>
            <ToastDescription>All toast tones in dark theme.</ToastDescription>
            <ToastClose closeLabel="Dismiss toast" />
          </ToastRoot>
        ))}
      </div>
      <ToastViewport placement="bottom-right" />
    </ToastProvider>
  ),
};
