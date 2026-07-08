import type { Meta, StoryObj } from "@storybook/react";
import type { CallHistoryDetailViewModel } from "../../hooks/useCallHistoryDetailShell.js";
import { HistoryDetailPanel } from "./HistoryDetailPanel.js";

const meta = {
  title: "Contacts/HistoryDetailPanel",
  component: HistoryDetailPanel,
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
} satisfies Meta<typeof HistoryDetailPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleEntry: CallHistoryDetailViewModel = {
  id: "history-call-1",
  remoteNumber: "+12025550147",
  primaryLabel: "Alice Johnson",
  secondaryLabel: "+1 (202) 555-0147",
  contactId: "contact-1",
  presentationSource: "contact",
  directionLabel: "Incoming",
  outcomeLabel: "Completed",
  dateLabel: "Jul 8, 2026",
  timeLabel: "1:00 PM",
  durationLabel: "90s",
  redialDisabledReason: null,
};

export const LightMatchedContact: Story = {
  args: {
    isLoading: false,
    isNotFound: false,
    entry: sampleEntry,
    onRedial: () => undefined,
    onContactAction: () => undefined,
    onDelete: () => undefined,
  },
  parameters: { theme: "light" },
};

export const DarkUnknownNumber: Story = {
  args: {
    isLoading: false,
    isNotFound: false,
    entry: {
      ...sampleEntry,
      primaryLabel: "+12025550147",
      secondaryLabel: null,
      contactId: null,
      presentationSource: "number",
    },
    onRedial: () => undefined,
    onContactAction: () => undefined,
    onDelete: () => undefined,
  },
  parameters: { theme: "dark" },
};

export const LightLoading: Story = {
  args: {
    isLoading: true,
    isNotFound: false,
    entry: null,
    onRedial: () => undefined,
    onContactAction: () => undefined,
    onDelete: () => undefined,
  },
  parameters: { theme: "light" },
};

export const LightNotFound: Story = {
  args: {
    isLoading: false,
    isNotFound: true,
    entry: null,
    onRedial: () => undefined,
    onContactAction: () => undefined,
    onDelete: () => undefined,
  },
  parameters: { theme: "light" },
};

export const DarkRedialDisabled: Story = {
  args: {
    isLoading: false,
    isNotFound: false,
    entry: {
      ...sampleEntry,
      redialDisabledReason: "Redial unavailable: SIP is not registered.",
    },
    onRedial: () => undefined,
    onContactAction: () => undefined,
    onDelete: () => undefined,
  },
  parameters: { theme: "dark" },
};
