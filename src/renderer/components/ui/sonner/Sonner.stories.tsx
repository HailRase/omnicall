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
            minHeight: "320px",
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

function DemoButton({
  label,
  onClick,
}: Readonly<{ label: string; onClick: () => void }>): JSX.Element {
  return (
    <Button
      variant="outline"
      onClick={() => {
        onClick();
      }}
    >
      {label}
    </Button>
  );
}

export const Default: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" />
      <DemoButton
        label="Show toast"
        onClick={() => {
          toast("Event has been created");
        }}
      />
    </>
  ),
};

export const Description: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" />
      <DemoButton
        label="Show description"
        onClick={() => {
          toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",
          });
        }}
      />
    </>
  ),
};

export const Action: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" closeButton />
      <DemoButton
        label="Show action"
        onClick={() => {
          toast("Event has been created", {
            description: "Action toast",
            action: {
              label: "Undo",
              onClick: () => undefined,
            },
          });
        }}
      />
    </>
  ),
};

export const CloseButton: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" closeButton />
      <DemoButton
        label="Show closable"
        onClick={() => {
          toast("Close me");
        }}
      />
    </>
  ),
};

export const RichColors: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <DemoButton
        label="Show rich success"
        onClick={() => {
          toast.success("Saved successfully", {
            description: "Rich colors are enabled.",
          });
        }}
      />
    </>
  ),
};

export const Types: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
        <DemoButton label="Default" onClick={() => toast("Default toast")} />
        <DemoButton label="Success" onClick={() => toast.success("Success toast")} />
        <DemoButton label="Info" onClick={() => toast.info("Info toast")} />
        <DemoButton label="Warning" onClick={() => toast.warning("Warning toast")} />
        <DemoButton label="Error" onClick={() => toast.error("Error toast")} />
      </div>
    </>
  ),
};

export const Positions: Story = {
  render: () => (
    <>
      <Toaster position="top-left" closeButton />
      <Toaster position="top-center" />
      <Toaster position="top-right" />
      <Toaster position="bottom-left" />
      <Toaster position="bottom-center" />
      <Toaster position="bottom-right" />
      <DemoButton
        label="Show on all positions"
        onClick={() => {
          toast("Position demo", { position: "top-left" });
          toast("Position demo", { position: "top-center" });
          toast("Position demo", { position: "top-right" });
          toast("Position demo", { position: "bottom-left" });
          toast("Position demo", { position: "bottom-center" });
          toast("Position demo", { position: "bottom-right" });
        }}
      />
    </>
  ),
};

export const ExpandedStacked: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" expand visibleToasts={5} closeButton />
      <DemoButton
        label="Show stacked"
        onClick={() => {
          toast("Toast #1");
          toast.success("Toast #2");
          toast.info("Toast #3");
          toast.warning("Toast #4");
          toast.error("Toast #5");
        }}
      />
    </>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <DemoButton
        label="Show light"
        onClick={() => {
          toast.success("Light theme toast", {
            description: "Semantic token surface in light mode.",
          });
        }}
      />
    </>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <DemoButton
        label="Show dark"
        onClick={() => {
          toast.success("Dark theme toast", {
            description: "Semantic token surface in dark mode.",
          });
        }}
      />
    </>
  ),
};

export const InteractiveDemo: Story = {
  render: () => (
    <>
      <Toaster position="bottom-right" richColors closeButton visibleToasts={4} expand />
      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
        <DemoButton
          label="Create"
          onClick={() => {
            toast("Event has been created", {
              description: "Sunday, December 03, 2023 at 9:00 AM",
              action: {
                label: "Undo",
                onClick: () => undefined,
              },
            });
          }}
        />
        <DemoButton
          label="Update"
          onClick={() => {
            toast.info("Event has been updated");
          }}
        />
        <DemoButton
          label="Delete"
          onClick={() => {
            toast.error("Event has been deleted", {
              cancel: {
                label: "Cancel",
                onClick: () => undefined,
              },
            });
          }}
        />
      </div>
    </>
  ),
};
