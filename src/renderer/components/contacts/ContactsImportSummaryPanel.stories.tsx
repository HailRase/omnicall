import type { Meta, StoryObj } from "@storybook/react";
import { ContactsImportSummaryPanel } from "./ContactsImportSummaryPanel.js";

const meta = {
  title: "Contacts/ContactsImportSummaryPanel",
  component: ContactsImportSummaryPanel,
  decorators: [
    (Story, context) => {
      const theme = context.parameters["theme"] as "light" | "dark" | undefined;
      document.documentElement.setAttribute("data-theme", theme ?? "light");
      return <Story />;
    },
  ],
} satisfies Meta<typeof ContactsImportSummaryPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LightSuccessOnly: Story = {
  args: {
    open: true,
    summary: {
      createdCount: 3,
      skippedDuplicateCount: 0,
      failedRows: [],
    },
    onClose: () => undefined,
  },
  parameters: { theme: "light" },
};

export const DarkWithDuplicatesAndFailures: Story = {
  args: {
    open: true,
    summary: {
      createdCount: 2,
      skippedDuplicateCount: 1,
      failedRows: [
        { rowNumber: 4, errors: ["primary_phone_invalid"] },
        { rowNumber: 7, errors: ["display_name_required"] },
      ],
    },
    onClose: () => undefined,
  },
  parameters: { theme: "dark" },
};
