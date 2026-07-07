import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppIcon } from "../../icons/AppIcon.js";
import { Button } from "../button/Button.js";
import type { AlertVariant } from "../types.js";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "./Alert.js";

const VARIANTS: readonly AlertVariant[] = ["default", "destructive"];

const meta = {
  title: "UI Kit/Alert",
  component: Alert,
  args: {
    variant: "default",
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
            maxWidth: 480,
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Registration failed</AlertTitle>
      <AlertDescription>
        SIP credentials were rejected. Check your account settings and try again.
      </AlertDescription>
    </Alert>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <Alert {...args}>
      <AppIcon id="operator.break" size={16} decorative />
      <AlertTitle>Operator status changed</AlertTitle>
      <AlertDescription>
        Your queue assignment was updated by a supervisor.
      </AlertDescription>
    </Alert>
  ),
};

export const PaymentSuccess: Story = {
  render: (args) => (
    <Alert {...args}>
      <AppIcon id="operator.ready" size={16} decorative />
      <AlertTitle>Payment successful</AlertTitle>
      <AlertDescription>
        Your payment of $29.99 has been processed. A receipt has been sent to your email
        address.
      </AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Alert {...args} style={{ maxWidth: "28rem" }}>
      <AlertTitle>Dark mode is now available</AlertTitle>
      <AlertDescription>
        Enable it under your profile settings to get started.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="primary">
          Enable
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const WithIconAndAction: Story = {
  render: (args) => (
    <Alert {...args}>
      <AppIcon id="call.incoming" size={16} decorative />
      <AlertTitle>Missed call policy</AlertTitle>
      <AlertDescription>
        Callback reminders are enabled for this queue.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Review policy
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const LongContent: Story = {
  render: (args) => (
    <Alert {...args}>
      <AppIcon id="operator.ready" size={16} decorative />
      <AlertTitle>Connection quality notice</AlertTitle>
      <AlertDescription>
        Network jitter exceeded the recommended threshold during the last three calls.
        Consider switching to a wired connection or contacting your administrator if
        audio dropouts continue after reconnecting.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Open diagnostics
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <Alert key={variant} variant={variant}>
          {variant === "destructive" ? (
            <AppIcon id="call.phone-off" size={16} decorative />
          ) : (
            <AppIcon id="operator.ready" size={16} decorative />
          )}
          <AlertTitle>{variant} alert</AlertTitle>
          <AlertDescription>
            Inline callout copy for the {variant} tone in light theme.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--space-sm)" }}>
      {VARIANTS.map((variant) => (
        <Alert key={variant} variant={variant}>
          {variant === "destructive" ? (
            <AppIcon id="call.phone-off" size={16} decorative />
          ) : (
            <AppIcon id="operator.ready" size={16} decorative />
          )}
          <AlertTitle>{variant} alert</AlertTitle>
          <AlertDescription>
            Inline callout copy for the {variant} tone in dark theme.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  ),
};
