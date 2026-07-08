import type { Meta, StoryObj } from "@storybook/react";
import { IncomingCallSessionCard } from "./IncomingCallSessionCard.js";

const meta = {
  title: "Call/IncomingCallSessionCard",
  component: IncomingCallSessionCard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof IncomingCallSessionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RingingSelected: Story = {
  args: {
    callId: "call-in-1",
    callerNumber: "+7 (495) 123-45-67",
    displayName: "Клиент А",
autoAnswerSecondsRemaining: null,
    autoAnswerTimeoutSec: null,
    uiState: "incomingRinging",
    isSelected: true,
    answerDisabledReason: null,
    rejectDisabledReason: null,
    onSelect: () => undefined,
    onAnswer: () => undefined,
    onReject: () => undefined,
  },
};

export const AutoAnswerCountdown: Story = {
  args: {
    ...RingingSelected.args,
    autoAnswerSecondsRemaining: 8,
    autoAnswerTimeoutSec: 8,
    uiState: "autoAnswerCountdown",
  },
};

export const NotSelected: Story = {
  args: {
    ...RingingSelected.args,
    isSelected: false,
  },
};
