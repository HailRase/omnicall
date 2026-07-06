import type { Meta, StoryObj } from "@storybook/react";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallLineRow } from "./CallLineRow.js";

const activeLine: CallLineCardViewModel = {
  callId: "call-active",
  role: "primary",
  state: "Active",
  muted: false,
  isActiveUnheld: true,
  displayName: "Alice Operator",
  statusLabel: "call.line.status.active",
  durationStartedAt: Date.now() - 125_000,
  queueLabelState: "ready",
  queueName: "Support Queue",
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

const meta = {
  title: "Call/CallLineRow",
  component: CallLineRow,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof CallLineRow>;

export default meta;

type Story = StoryObj<typeof meta>;

const noop = (): void => undefined;

export const ActiveUnmuted: Story = {
  args: {
    line: activeLine,
    onResume: noop,
    onHangup: noop,
    onHold: noop,
    onMute: noop,
    onUnmute: noop,
    onTransfer: noop,
    onAnswer: noop,
  },
};

export const ActiveMuted: Story = {
  args: {
    ...ActiveUnmuted.args,
    line: {
      ...activeLine,
      muted: true,
    },
  },
};

export const Held: Story = {
  args: {
    ...ActiveUnmuted.args,
    line: {
      ...activeLine,
      state: "Held",
      statusLabel: "call.line.status.held",
      primaryAction: "resume",
      showIconRow: false,
      showLocalHoldBadge: true,
      showRemoteHoldBadge: false,
      isActiveUnheld: false,
    },
  },
};

export const MultiLineSecondary: Story = {
  args: {
    ...ActiveUnmuted.args,
    line: {
      ...activeLine,
      callId: "call-held",
      displayName: "+12025550802",
      state: "Held",
      statusLabel: "call.line.status.held",
      primaryAction: "resume",
      showIconRow: false,
      showLocalHoldBadge: true,
      showRemoteHoldBadge: false,
      isActiveUnheld: false,
      role: "source",
      queueLabelState: "hidden",
      queueName: null,
    },
  },
};

