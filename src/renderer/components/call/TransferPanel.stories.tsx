import type { Meta, StoryObj } from "@storybook/react";
import type { CallLine } from "@application/index.js";
import { TransferPanel } from "./TransferPanel.js";

const meta = {
  title: "Call/TransferPanel",
  component: TransferPanel,
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
} satisfies Meta<typeof TransferPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const sourceLine: CallLine = {
  callId: "source-call",
  role: "source",
  state: "Held",
  muted: false,
  displayLabel: "Иван Петров · +7 (495) 123-45-67",
  activeSinceMs: null,
  isRemoteHold: false,
  dtmfHistory: "",
  lastDtmfTone: null,
};

const consultationLine: CallLine = {
  callId: "consult-call",
  role: "consultation",
  state: "Active",
  muted: false,
  displayLabel: "Сергей Смирнов · +7 (812) 000-11-22",
  activeSinceMs: 1_000,
  isRemoteHold: false,
  dtmfHistory: "",
  lastDtmfTone: null,
};

const baseArgs: Story["args"] = {
  visible: true,
  targetNumber: "+7 (812) 000-11-22",
  blindTransferDisabledReason: null,
  startConsultationDisabledReason: null,
  attendedTransferDisabledReason: null,
  cancelTransferDisabledReason: null,
  transferInProgress: false,
  failureTitle: null,
  failureMessage: null,
  lines: [sourceLine],
  onTargetChange: () => undefined,
  onBlindTransfer: () => undefined,
  onStartConsultation: () => undefined,
  onAttendedTransfer: () => undefined,
  onCancelTransfer: () => undefined,
};

export const LightStepType: Story = {
  args: {
    ...baseArgs,
    targetNumber: "+7 (812) 000-11-22",
  },
  parameters: {
    theme: "light",
  },
};

export const LightStepStart: Story = {
  args: {
    ...baseArgs,
    targetNumber: "",
  },
  parameters: {
    theme: "light",
  },
};

export const DarkConsultation: Story = {
  args: {
    ...baseArgs,
    lines: [sourceLine, consultationLine],
  },
  parameters: {
    theme: "dark",
  },
};

export const DarkFailure: Story = {
  args: {
    ...baseArgs,
    failureTitle: "Ошибка перевода",
    failureMessage: "Абонент недоступен",
    transferInProgress: false,
  },
  parameters: {
    theme: "dark",
  },
};
