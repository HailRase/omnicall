import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button/Button.js";
import type { NotificationTone } from "../types.js";
import { Notification } from "./Notification.js";

const meta = {
  title: "UI Kit/Notification",
  component: Notification,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            maxWidth: "420px",
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
} satisfies Meta<typeof Notification>;

export default meta;

type Story = StoryObj<typeof meta>;

const TONES: readonly NotificationTone[] = [
  "default",
  "info",
  "success",
  "warning",
  "destructive",
];

export const Default: Story = {
  args: {
    title: "Connection restored",
    message: "SIP registration is active again.",
  },
};

export const Tones: Story = {
  args: {
    title: "Tone preview",
  },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-sm)" }}>
      {TONES.map((tone) => (
        <Notification
          key={tone}
          tone={tone}
          title={`${tone} notification`}
          message="Persistent card with tone stripe and elevated surface."
        />
      ))}
    </div>
  ),
};

export const WithActions: Story = {
  args: {
    tone: "info",
    title: "Update available",
    message: "Version 0.2.0 is ready to install.",
    actions: (
      <>
        <Button size="sm" variant="primary">
          Install now
        </Button>
        <Button size="sm" variant="outline">
          Later
        </Button>
      </>
    ),
  },
};

export const Closable: Story = {
  args: {
    tone: "warning",
    title: "Microphone permission required",
    message: "Allow microphone access to place calls.",
    closable: true,
    closeLabel: "Dismiss notification",
    onClose: () => undefined,
  },
};

export const LongContent: Story = {
  args: {
    tone: "default",
    title: "Scheduled maintenance",
    message:
      "The telephony platform will undergo maintenance on Sunday between 02:00 and 04:00 UTC. During this window, outbound calls may fail and active sessions could be interrupted. Please save work and avoid starting long calls before the window.",
    metadata: <span>Posted 5 minutes ago · System</span>,
    actions: <Button size="sm" variant="outline">View details</Button>,
    closable: true,
    closeLabel: "Dismiss notification",
  },
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  args: {
    title: "Light theme preview",
  },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-sm)" }}>
      {TONES.map((tone) => (
        <Notification
          key={tone}
          tone={tone}
          title={`Light ${tone}`}
          message="All notification tones in light theme."
          closable
          closeLabel="Dismiss notification"
        />
      ))}
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  args: {
    title: "Dark theme preview",
  },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-sm)" }}>
      {TONES.map((tone) => (
        <Notification
          key={tone}
          tone={tone}
          title={`Dark ${tone}`}
          message="All notification tones in dark theme."
          closable
          closeLabel="Dismiss notification"
        />
      ))}
    </div>
  ),
};
