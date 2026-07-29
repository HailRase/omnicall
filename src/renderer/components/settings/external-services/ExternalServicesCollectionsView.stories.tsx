import type { Meta, StoryObj } from "@storybook/react";
import { ExternalServicesCollectionsView } from "./ExternalServicesCollectionsView.js";

const meta = {
  title: "Settings/External Services Collections",
  component: ExternalServicesCollectionsView,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ExternalServicesCollectionsView>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = (): void => undefined;

const baseArgs = {
  busy: false,
  errorMessage: null,
  statusMessage: null,
  nameDialog: {
    open: false,
    mode: "create" as const,
    value: "",
    errorMessage: null,
  },
  deleteDialog: {
    open: false,
    collectionName: "",
  },
  onRetry: noop,
  onCreate: noop,
  onImport: noop,
  onOpenCollection: noop,
  onToggleCollection: noop,
  onRenameCollection: noop,
  onDuplicateCollection: noop,
  onExportCollection: noop,
  onEditVariables: noop,
  onDeleteCollection: noop,
  onNameDialogOpenChange: noop,
  onNameDialogValueChange: noop,
  onNameDialogSubmit: noop,
  onDeleteDialogOpenChange: noop,
  onDeleteDialogConfirm: noop,
  journal: {
    panel: { loadState: "ready" as const, entries: [], capped: false },
    onRetry: noop,
  },
};

export const EmptyLight: Story = {
  args: {
    ...baseArgs,
    collections: [],
    loadState: "ready",
  },
  globals: { theme: "light" },
};

export const EmptyDark: Story = {
  args: {
    ...baseArgs,
    collections: [],
    loadState: "ready",
  },
  globals: { theme: "dark" },
};

export const WithCollectionsLight: Story = {
  args: {
    ...baseArgs,
    loadState: "ready",
    collections: [
      {
        id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
        name: "CRM",
        enabled: true,
        enabledRequestCount: 2,
        requestCount: 3,
        variables: [{ key: "base_url", value: "https://crm.example" }],
      },
      {
        id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
        name: "Billing",
        enabled: false,
        enabledRequestCount: 0,
        requestCount: 1,
        variables: [],
      },
    ],
  },
  globals: { theme: "light" },
};

export const WithCollectionsDark: Story = {
  args: {
    ...WithCollectionsLight.args,
  },
  globals: { theme: "dark" },
};
