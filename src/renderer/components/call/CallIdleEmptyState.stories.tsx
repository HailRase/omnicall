import type { Meta, StoryObj } from "@storybook/react";
import { CallIdleEmptyState } from "./CallIdleEmptyState.js";

const meta = {
  title: "Call/CallIdleEmptyState",
  component: CallIdleEmptyState,
  decorators: [
    (Story, context) => {
      const theme = context.parameters["theme"] as "light" | "dark" | undefined;
      document.documentElement.setAttribute("data-theme", theme ?? "light");
      return <Story />;
    },
  ],
} satisfies Meta<typeof CallIdleEmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReadyLight: Story = {
  args: {},
  parameters: { theme: "light" },
};

export const ReadyDark: Story = {
  args: {},
  parameters: { theme: "dark" },
};

export const NeedsSignInLight: Story = {
  args: {
    needsSignIn: true,
    onSignIn: () => undefined,
  },
  parameters: { theme: "light" },
};

export const NeedsSignInDark: Story = {
  args: {
    needsSignIn: true,
    onSignIn: () => undefined,
  },
  parameters: { theme: "dark" },
};
