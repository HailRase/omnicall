import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ControlSize } from "../types.js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./InputGroup.js";

const SIZES: readonly ControlSize[] = ["sm", "md", "lg"];

const meta = {
  title: "UI Kit/Input Group",
  component: InputGroup,
  args: {
    size: "md",
  },
  decorators: [
    (StoryComponent: () => JSX.Element, context) => {
      const theme = (context.parameters["theme"] as "light" | "dark" | undefined) ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return (
        <div
          style={{
            padding: "var(--space-md)",
            background: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <InputGroup {...args}>
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput aria-label="Website" placeholder="example.com" />
    </InputGroup>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Amount" placeholder="0.00" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Search" placeholder="Search contacts" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Search" size="sm">
            Go
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="API key" defaultValue="sk-live-abc123" readOnly />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="sm">Copy</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {SIZES.map((size) => (
        <InputGroup key={size} size={size}>
          <InputGroupAddon>
            <InputGroupText>{size}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label={`${size} field`} placeholder={`${size} size`} />
        </InputGroup>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput aria-label="Disabled username" disabled defaultValue="agent" />
    </InputGroup>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
      <InputGroup>
        <InputGroupInput
          aria-label="Invalid email"
          invalid
          defaultValue="bad@"
          aria-describedby="input-group-error"
        />
      </InputGroup>
      <span
        id="input-group-error"
        style={{ color: "var(--color-text-danger)", fontSize: "0.8125rem" }}
      >
        Enter a valid email address.
      </span>
    </div>
  ),
};

export const TextareaWithAction: Story = {
  render: () => (
    <InputGroup>
      <InputGroupTextarea aria-label="Message" placeholder="Type a message..." />
      <InputGroupAddon align="block-end">
        <InputGroupButton size="sm">Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Default light" placeholder="example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Invalid light" invalid defaultValue="bad" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Disabled light" disabled defaultValue="off" />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Affix light" defaultValue="42" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Default dark" placeholder="example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Invalid dark" invalid defaultValue="bad" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Disabled dark" disabled defaultValue="off" />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Affix dark" defaultValue="42" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};
