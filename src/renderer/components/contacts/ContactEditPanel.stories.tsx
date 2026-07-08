import type { Meta, StoryObj } from "@storybook/react";
import type { ContactFormFieldErrors, ContactFormValues } from "../../hooks/useContactEditShell.js";
import { ContactEditPanel } from "./ContactEditPanel.js";

const meta = {
  title: "Contacts/ContactEditPanel",
  component: ContactEditPanel,
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
} satisfies Meta<typeof ContactEditPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const emptyValues: ContactFormValues = {
  displayName: "",
  primaryPhone: "",
  secondaryPhone: "",
  company: "",
  notes: "",
};

const prefilledValues: ContactFormValues = {
  displayName: "Alice Johnson",
  primaryPhone: "+12025550147",
  secondaryPhone: "",
  company: "Acme Corp",
  notes: "",
};

const emptyErrors: ContactFormFieldErrors = {};

export const LightCreateEmpty: Story = {
  args: {
    isLoading: false,
    isNotFound: false,
    isSaving: false,
    values: emptyValues,
    fieldErrors: emptyErrors,
    formErrorMessage: null,
    successMessage: null,
    onFieldChange: () => undefined,
    onSubmit: () => undefined,
  },
  parameters: { theme: "light" },
};

export const DarkCreatePrefilled: Story = {
  args: {
    isLoading: false,
    isNotFound: false,
    isSaving: false,
    values: prefilledValues,
    fieldErrors: emptyErrors,
    formErrorMessage: null,
    successMessage: null,
    onFieldChange: () => undefined,
    onSubmit: () => undefined,
  },
  parameters: { theme: "dark" },
};

export const LightValidationErrors: Story = {
  args: {
    isLoading: false,
    isNotFound: false,
    isSaving: false,
    values: emptyValues,
    fieldErrors: {
      displayName: "Display name is required.",
      primaryPhone: "Primary phone is invalid.",
    },
    formErrorMessage: "Fix validation errors before saving.",
    successMessage: null,
    onFieldChange: () => undefined,
    onSubmit: () => undefined,
  },
  parameters: { theme: "light" },
};

export const DarkSaving: Story = {
  args: {
    isLoading: false,
    isNotFound: false,
    isSaving: true,
    values: prefilledValues,
    fieldErrors: emptyErrors,
    formErrorMessage: null,
    successMessage: null,
    onFieldChange: () => undefined,
    onSubmit: () => undefined,
  },
  parameters: { theme: "dark" },
};
