import type { Meta, StoryObj } from "@storybook/react";
import { IncomingCallOverlay } from "./IncomingCallOverlay.js";

const meta = {
  title: "Call/IncomingCallOverlay",
  component: IncomingCallOverlay,
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
} satisfies Meta<typeof IncomingCallOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs: Story["args"] = {
  visible: true,
  callerNumber: "+7 (495) 123-45-67",
  displayName: "Иван Петров",
  autoAnswerSecondsRemaining: null,
  uiState: "incomingRinging",
  answerDisabledReason: null,
  rejectDisabledReason: null,
  onOpenCallSurface: () => undefined,
  onAnswer: () => undefined,
  onReject: () => undefined,
  onDismiss: () => undefined,
};

export const LightRinging: Story = {
  args: baseArgs,
  parameters: { theme: "light" },
};

export const DarkRinging: Story = {
  args: baseArgs,
  parameters: { theme: "dark" },
};

export const AutoAnswer: Story = {
  args: {
    ...baseArgs,
    autoAnswerSecondsRemaining: 4,
    uiState: "autoAnswerCountdown",
  },
  parameters: { theme: "dark" },
};

export const AnswerBlocked: Story = {
  args: {
    ...baseArgs,
    answerDisabledReason: "SIP не зарегистрирован",
  },
  parameters: { theme: "light" },
};
