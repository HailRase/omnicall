import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BootstrapSplashShell } from "./BootstrapSplashShell.js";

const meta = {
  title: "Shells/BootstrapSplashShell",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (StoryComponent: () => JSX.Element, context: { parameters: Record<string, unknown> }) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
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

export const LoadingLight: Story = {
  render: (): JSX.Element => <BootstrapSplashShell variant="loading" />,
  parameters: { theme: "light" },
};

export const LoadingDark: Story = {
  render: (): JSX.Element => <BootstrapSplashShell variant="loading" />,
  parameters: { theme: "dark" },
};

export const ErrorLight: Story = {
  render: (): JSX.Element => (
    <BootstrapSplashShell variant="error" message="Initialization failed" />
  ),
  parameters: { theme: "light" },
};

export const ErrorDark: Story = {
  render: (): JSX.Element => (
    <BootstrapSplashShell variant="error" message="Initialization failed" />
  ),
  parameters: { theme: "dark" },
};
