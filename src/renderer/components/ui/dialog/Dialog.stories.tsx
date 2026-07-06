import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../button/Button.js";
import { Input } from "../input/Input.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog.js";
import type { DialogSize } from "../types.js";

const meta = {
  title: "UI Kit/Dialog",
  component: Dialog,
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
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
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function DialogExample({
  size = "md",
  withDescription = true,
  withFooter = true,
}: Readonly<{
  size?: DialogSize;
  withDescription?: boolean;
  withFooter?: boolean;
}>): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent size={size} closeLabel="Close dialog">
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
          {withDescription ? (
            <DialogDescription>
              Make changes to your profile here. Click save when you are done.
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <Input defaultValue="Alex Operator" aria-label="Display name" />
        {withFooter ? (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="primary">Save changes</Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export const Default: Story = {
  render: () => <DialogExample />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-md)" }}>
      <DialogExample size="sm" withFooter={false} />
      <DialogExample size="md" withFooter={false} />
      <DialogExample size="lg" withFooter={false} />
      <DialogExample size="fullscreen" withFooter={false} />
    </div>
  ),
};

export const WithFooter: Story = {
  render: () => <DialogExample withFooter />,
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="primary">{open ? "Dialog open" : "Dialog closed"}</Button>
        </DialogTrigger>
        <DialogContent closeLabel="Close dialog">
          <DialogHeader>
            <DialogTitle>Controlled dialog</DialogTitle>
            <DialogDescription>Open state is controlled by React state.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close from action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const LongContent: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open long dialog</Button>
      </DialogTrigger>
      <DialogContent size="md" closeLabel="Close dialog">
        <DialogHeader>
          <DialogTitle>Diagnostics export</DialogTitle>
          <DialogDescription>
            Review the generated report before sending it to support.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: "grid", gap: "var(--space-sm)" }}>
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index} style={{ margin: 0, color: "var(--color-text-secondary)" }}>
              Log segment {index + 1}: transport reconnect, registration refresh, and media
              negotiation events are included in this export package.
            </p>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="primary">Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Light dialog</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Close dialog">
        <DialogHeader>
          <DialogTitle>Light theme dialog</DialogTitle>
          <DialogDescription>Elevated surface, scrim overlay, and footer actions.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Dismiss</Button>
          </DialogClose>
          <Button variant="primary">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Dark dialog</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Close dialog">
        <DialogHeader>
          <DialogTitle>Dark theme dialog</DialogTitle>
          <DialogDescription>Elevated surface, scrim overlay, and footer actions.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Dismiss</Button>
          </DialogClose>
          <Button variant="primary">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
