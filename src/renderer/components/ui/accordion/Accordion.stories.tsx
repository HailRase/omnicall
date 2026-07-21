import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion.js";

const meta = {
  title: "UI Kit/Accordion",
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            padding: "var(--space-xl)",
            maxWidth: 420,
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

type Story = StoryObj;

function SingleAccordion(): JSX.Element {
  return (
    <Accordion type="single" defaultValue="account" collapsible>
      <AccordionItem value="account">
        <AccordionTrigger>Account</AccordionTrigger>
        <AccordionContent>Manage SIP credentials and registration profile.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="audio">
        <AccordionTrigger>Audio</AccordionTrigger>
        <AccordionContent>Choose microphone, speaker, and codec preferences.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="network">
        <AccordionTrigger>Network</AccordionTrigger>
        <AccordionContent>Configure transport, proxy, and reconnect behavior.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const Default: Story = {
  render: () => <SingleAccordion />,
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["account", "network"]}>
      <AccordionItem value="account">
        <AccordionTrigger>Account</AccordionTrigger>
        <AccordionContent>Account panel content</AccordionContent>
      </AccordionItem>
      <AccordionItem value="audio">
        <AccordionTrigger>Audio</AccordionTrigger>
        <AccordionContent>Audio panel content</AccordionContent>
      </AccordionItem>
      <AccordionItem value="network">
        <AccordionTrigger>Network</AccordionTrigger>
        <AccordionContent>Network panel content</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory(): JSX.Element {
    const [value, setValue] = useState("account");

    return (
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>
          Open item: {value || "(none)"}
        </p>
        <Accordion type="single" value={value} onValueChange={setValue} collapsible>
          <AccordionItem value="account">
            <AccordionTrigger>Account</AccordionTrigger>
            <AccordionContent>Account panel content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="audio">
            <AccordionTrigger>Audio</AccordionTrigger>
            <AccordionContent>Audio panel content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="network">
            <AccordionTrigger>Network</AccordionTrigger>
            <AccordionContent>Network panel content</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
};

export const DisabledItem: Story = {
  render: () => (
    <Accordion type="single" defaultValue="account" collapsible>
      <AccordionItem value="account">
        <AccordionTrigger>Account</AccordionTrigger>
        <AccordionContent>Account panel content</AccordionContent>
      </AccordionItem>
      <AccordionItem value="audio" disabled>
        <AccordionTrigger>Audio</AccordionTrigger>
        <AccordionContent>Audio panel content</AccordionContent>
      </AccordionItem>
      <AccordionItem value="network">
        <AccordionTrigger>Network</AccordionTrigger>
        <AccordionContent>Network panel content</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => <SingleAccordion />,
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => <SingleAccordion />,
};
