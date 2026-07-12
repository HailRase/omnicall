import type { Meta, StoryObj } from "@storybook/react";
import { Dialpad } from "./Dialpad.js";

const meta = {
  title: "Call/Dialpad",
  component: Dialpad,
  decorators: [
    (Story, context) => {
      const theme = context.parameters["theme"] as "light" | "dark" | undefined;
      document.documentElement.setAttribute("data-theme", theme ?? "light");
      return <Story />;
    },
  ],
} satisfies Meta<typeof Dialpad>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs: Story["args"] = {
  numberValue: "",
  mode: "number",
  isCalling: false,
  callDisabledReason: null,
  inputDisabledReason: null,
  hasEstablishedCall: false,
  onNumberChange: () => undefined,
  onDelete: () => undefined,
  onClear: () => undefined,
  onCall: () => undefined,
  onVideoCall: () => undefined,
  videoCallDisabledReason: null,
  onOpenContacts: () => undefined,
  contactsDisabledReason: null,
  onSendDtmf: () => undefined,
  onModeChange: () => undefined,
};

export const Light: Story = {
  args: {
    ...baseArgs,
    numberValue: "+7 (495) 123-45-67",
  },
  parameters: {
    theme: "light",
  },
};

export const Dark: Story = {
  args: {
    ...baseArgs,
    numberValue: "1202",
  },
  parameters: {
    theme: "dark",
  },
};

export const DisabledReason: Story = {
  args: {
    ...baseArgs,
    callDisabledReason: "Не зарегистрирован",
    inputDisabledReason: "Не зарегистрирован",
  },
  parameters: {
    theme: "dark",
  },
};
