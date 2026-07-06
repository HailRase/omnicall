import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UpdateAvailableBanner } from "./UpdateAvailableBanner.js";

const noop = (): void => undefined;

const baseArgs = {
  visible: true,
  latestVersion: "0.4.0",
  onDownload: noop,
  onDismiss: noop,
} as const;

const meta = {
  title: "Updates/UpdateAvailableBanner",
  component: UpdateAvailableBanner,
  parameters: {
    layout: "fullscreen",
  },
  args: baseArgs,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            position: "relative",
            minHeight: "100vh",
            background: "var(--color-bg-app)",
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof UpdateAvailableBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = {
  parameters: { theme: "light" },
};

export const Dark: Story = {
  parameters: { theme: "dark" },
};

export const WithoutVersion: Story = {
  args: {
    ...baseArgs,
    latestVersion: undefined,
  },
  parameters: { theme: "light" },
};
