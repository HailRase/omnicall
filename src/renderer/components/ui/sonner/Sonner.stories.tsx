import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button/Button.js";
import { Toaster } from "./Sonner.js";
import { toast } from "./index.js";

const meta = {
  title: "UI Kit/Sonner",
  component: Toaster,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            minHeight: "240px",
            padding: "var(--space-xl)",
            background: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" closeButton />
      <Button
        variant="outline"
        onClick={() => {
          toast("Event has been created");
        }}
      >
        Show toast
      </Button>
    </>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <>
      <Toaster position="bottom-right" closeButton />
      <Button
        variant="outline"
        onClick={() => {
          toast("Light theme toast", {
            description: "Semantic tokens via Sonner CSS variable bridge.",
          });
        }}
      >
        Show light
      </Button>
    </>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <>
      <Toaster position="bottom-right" closeButton />
      <Button
        variant="outline"
        onClick={() => {
          toast("Dark theme toast", {
            description: "Semantic tokens via Sonner CSS variable bridge.",
          });
        }}
      >
        Show dark
      </Button>
    </>
  ),
};
