import type { Meta, StoryObj } from "@storybook/react";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallSessionCard } from "./CallSessionCard.js";

const meta = {
  title: "Call/CallSessionCard",
  component: CallSessionCard,
  decorators: [
    (Story, context) => {
      const theme = context.parameters["theme"] as "light" | "dark" | undefined;
      document.documentElement.setAttribute("data-theme", theme ?? "light");
      return (
        <div style={{ maxWidth: "360px", padding: "12px" }}>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof CallSessionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseLine: CallLineCardViewModel = {
  callId: "call-1",
  role: "primary",
  state: "Active",
  muted: false,
  isActiveUnheld: true,
  displayName: "+7 (495) 123-45-67",
  statusLabel: "Активный",
  durationStartedAt: Date.now() - 90_000,
  queueLabelState: "ready",
  queueName: "Продажи",
  primaryAction: "hangup",
  showIconRow: true,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

export const LightFull: Story = {
  args: {
    line: baseLine,
    isActive: true,
  },
  parameters: {
    theme: "light",
  },
};

export const DarkHeldCompact: Story = {
  args: {
    line: {
      ...baseLine,
      state: "Held",
      isActiveUnheld: false,
      statusLabel: "Удержание",
      muted: true,
    },
    compact: true,
    onClick: () => undefined,
  },
  parameters: {
    theme: "dark",
  },
};
