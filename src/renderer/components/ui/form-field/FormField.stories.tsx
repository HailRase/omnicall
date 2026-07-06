import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../input/Input.js";
import { Textarea } from "../textarea/Textarea.js";
import { FormField } from "./FormField.js";

const defaultControl = <Input placeholder="name@example.com" />;

const meta = {
  title: "UI Kit/FormField",
  component: FormField,
  args: {
    label: "Email address",
    hint: undefined,
    error: undefined,
    required: false,
    disabled: false,
    children: defaultControl,
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
            maxWidth: 360,
          }}
        >
          <StoryComponent />
        </div>
      );
    },
  ],
} satisfies Meta<typeof FormField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hint: Story = {
  args: {
    label: "Username",
    hint: "Use your operator login from the account portal.",
    children: <Input placeholder="agent.name" />,
  },
};

export const Error: Story = {
  args: {
    label: "Password",
    error: "Password must be at least 8 characters.",
    children: <Input type="password" defaultValue="short" />,
  },
};

export const Required: Story = {
  args: {
    label: "Display name",
    required: true,
    hint: "Shown to callers during outbound calls.",
    children: <Input placeholder="Operator" />,
  },
};

export const Disabled: Story = {
  args: {
    label: "Account ID",
    disabled: true,
    hint: "Managed by your administrator.",
    children: <Input defaultValue="ACC-2048" readOnly />,
  },
};

export const TextareaControl: Story = {
  args: {
    label: "Notes",
    hint: "Optional context for the next operator.",
    children: <Textarea placeholder="Add call notes" rows={4} />,
  },
};

export const LightTheme: Story = {
  parameters: { theme: "light" },
  args: { children: defaultControl },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <FormField label="Default field" hint="Helper text for the field.">
        <Input placeholder="Default" />
      </FormField>
      <FormField label="Required field" required>
        <Input placeholder="Required" />
      </FormField>
      <FormField label="Invalid field" error="This value is not valid.">
        <Input defaultValue="invalid" />
      </FormField>
      <FormField label="Disabled field" disabled hint="Cannot be edited.">
        <Input defaultValue="Disabled" />
      </FormField>
    </div>
  ),
};

export const DarkTheme: Story = {
  parameters: { theme: "dark" },
  args: { children: defaultControl },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <FormField label="Default field" hint="Helper text for the field.">
        <Input placeholder="Default" />
      </FormField>
      <FormField label="Required field" required>
        <Input placeholder="Required" />
      </FormField>
      <FormField label="Invalid field" error="This value is not valid.">
        <Input defaultValue="invalid" />
      </FormField>
      <FormField label="Disabled field" disabled hint="Cannot be edited.">
        <Input defaultValue="Disabled" />
      </FormField>
    </div>
  ),
};
