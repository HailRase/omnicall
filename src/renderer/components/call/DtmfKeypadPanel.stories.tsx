import type { Meta, StoryObj } from "@storybook/react";
import { DtmfKeypadPanel } from "./DtmfKeypadPanel.js";

const meta = {
  title: "Call/DtmfKeypadPanel",
  component: DtmfKeypadPanel,
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
} satisfies Meta<typeof DtmfKeypadPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs: Story["args"] = {
  displayName: "+7 (495) 123-45-67",
  toneHistory: "",
  lastTone: null,
  errorMessage: null,
  onTone: () => undefined,
  onClose: () => undefined,
};

export const LightEmpty: Story = {
  args: baseArgs,
  parameters: {
    theme: "light",
  },
};

export const DarkWithHistory: Story = {
  args: {
    ...baseArgs,
    toneHistory: "123",
    lastTone: "3",
  },
  parameters: {
    theme: "dark",
  },
};

export const DarkWithError: Story = {
  args: {
    ...baseArgs,
    errorMessage: "Не удалось отправить тон",
  },
  parameters: {
    theme: "dark",
  },
};
