import type { Meta, StoryObj } from "@storybook/react";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallControlsBar } from "./CallControlsBar.js";

const meta = {
  title: "Call/CallControlsBar",
  component: CallControlsBar,
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
} satisfies Meta<typeof CallControlsBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const activeLine: CallLineCardViewModel = {
  callId: "call-1",
  role: "primary",
  state: "Active",
  muted: false,
  isActiveUnheld: true,
  displayName: "+7 (495) 123-45-67",
  statusLabel: "call.line.status.active",
  durationStartedAt: Date.now() - 120_000,
  queueLabelState: "hidden",
  queueName: null,
  primaryAction: "hangup",
  showIconRow: true,
  showLocalHoldBadge: false,
  showRemoteHoldBadge: false,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

const baseArgs: Story["args"] = {
  line: activeLine,
  lastOperationError: null,
  registrationDisabledReason: null,
  onHold: () => undefined,
  onResume: () => undefined,
  onMute: () => undefined,
  onUnmute: () => undefined,
  onHangup: () => undefined,
  onTransfer: () => undefined,
  onShowDtmf: () => undefined,
  onShowNumberEntry: () => undefined,
  onRetryOperation: () => undefined,
};

export const LightActive: Story = {
  args: baseArgs,
  parameters: {
    theme: "light",
  },
};

export const DarkHeld: Story = {
  args: {
    ...baseArgs,
    line: {
      ...activeLine,
      state: "Held",
      isActiveUnheld: false,
      statusLabel: "call.line.status.held",
    },
  },
  parameters: {
    theme: "dark",
  },
};

export const DarkMuted: Story = {
  args: {
    ...baseArgs,
    line: {
      ...activeLine,
      muted: true,
      statusLabel: "call.line.status.active",
    },
  },
  parameters: {
    theme: "dark",
  },
};
