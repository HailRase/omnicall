import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button/Button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu/DropdownMenu.js";
import { Input } from "../input/Input.js";
import type { ButtonGroupOrientation, ButtonSize } from "../types.js";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "./ButtonGroup.js";

const ORIENTATIONS: readonly ButtonGroupOrientation[] = ["horizontal", "vertical"];
const SIZES: readonly ButtonSize[] = ["sm", "md", "lg"];

const meta = {
  title: "UI Kit/Button Group",
  component: ButtonGroup,
  args: {
    orientation: "horizontal",
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
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
            alignItems: "flex-start",
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args} aria-label="Default actions">
      <Button variant="outline">Archive</Button>
      <Button variant="outline">Report</Button>
      <Button variant="outline">Snooze</Button>
    </ButtonGroup>
  ),
};

export const Orientation: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-start" }}>
      {ORIENTATIONS.map((orientation) => (
        <ButtonGroup
          key={orientation}
          orientation={orientation}
          aria-label={`${orientation} media controls`}
        >
          <Button variant="outline" size="icon" aria-label={`${orientation} increase`}>
            +
          </Button>
          <Button variant="outline" size="icon" aria-label={`${orientation} decrease`}>
            −
          </Button>
        </ButtonGroup>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {SIZES.map((size) => (
        <ButtonGroup key={size} aria-label={`${size} actions`}>
          <Button variant="outline" size={size}>
            {size}
          </Button>
          <Button variant="outline" size={size}>
            Button
          </Button>
          <Button variant="outline" size={size}>
            Group
          </Button>
        </ButtonGroup>
      ))}
    </div>
  ),
};

export const SeparatorSplit: Story = {
  name: "Separator / Split",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <ButtonGroup aria-label="Clipboard">
        <Button variant="secondary" size="sm">
          Copy
        </Button>
        <ButtonGroupSeparator />
        <Button variant="secondary" size="sm">
          Paste
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Split action">
        <Button variant="secondary">Save</Button>
        <ButtonGroupSeparator />
        <Button variant="secondary" size="icon" aria-label="More save options">
          ▾
        </Button>
      </ButtonGroup>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <ButtonGroup aria-label="Protocol actions">
      <ButtonGroupText>https://</ButtonGroupText>
      <Button variant="outline">Open link</Button>
    </ButtonGroup>
  ),
};

export const Nested: Story = {
  render: () => (
    <ButtonGroup aria-label="Nested toolbar">
      <ButtonGroup aria-label="Navigation">
        <Button variant="outline" size="icon" aria-label="Go back">
          ←
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Primary actions">
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Secondary actions">
        <Button variant="outline">Snooze</Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
};

export const WithInput: Story = {
  render: () => (
    <ButtonGroup aria-label="Search group">
      <Input aria-label="Search query" placeholder="Search..." />
      <Button variant="outline">Search</Button>
    </ButtonGroup>
  ),
};

export const WithDropdown: Story = {
  render: () => (
    <ButtonGroup aria-label="Follow actions">
      <Button variant="outline">Follow</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More follow options">
            ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => undefined}>Mute conversation</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => undefined}>Mark as read</DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => undefined}>
            Block user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ButtonGroup aria-label="Disabled actions">
      <Button variant="outline" disabled>
        Archive
      </Button>
      <Button variant="outline" disabled>
        Report
      </Button>
      <Button variant="outline">Snooze</Button>
    </ButtonGroup>
  ),
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <ButtonGroup aria-label="Light outline">
        <Button variant="outline">One</Button>
        <Button variant="outline">Two</Button>
        <Button variant="outline">Three</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Light secondary">
        <Button variant="secondary">Copy</Button>
        <ButtonGroupSeparator />
        <Button variant="secondary">Paste</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Light text">
        <ButtonGroupText>Prefix</ButtonGroupText>
        <Button variant="outline">Action</Button>
      </ButtonGroup>
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <ButtonGroup aria-label="Dark outline">
        <Button variant="outline">One</Button>
        <Button variant="outline">Two</Button>
        <Button variant="outline">Three</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Dark secondary">
        <Button variant="secondary">Copy</Button>
        <ButtonGroupSeparator />
        <Button variant="secondary">Paste</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Dark text">
        <ButtonGroupText>Prefix</ButtonGroupText>
        <Button variant="outline">Action</Button>
      </ButtonGroup>
    </div>
  ),
};
