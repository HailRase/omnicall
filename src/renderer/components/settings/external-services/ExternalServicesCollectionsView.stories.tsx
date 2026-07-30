import type { Meta, StoryObj } from "@storybook/react";
import { ExternalServicesPanel } from "./ExternalServicesPanel.js";
import type { ExternalServicesPanelProps } from "./ExternalServicesPanel.js";

const noop = (): void => undefined;

const journal = {
  panel: { loadState: "ready" as const, entries: [], capped: false },
  onRetry: noop,
};

const baseProps: ExternalServicesPanelProps = {
  sidebar: {
    collections: [],
    selection: { kind: "none" },
    busy: false,
    loadState: "ready",
    onCreateCollection: noop,
    onImportCollection: noop,
    onSelectCollection: noop,
    onSelectRequest: noop,
    onCreateRequest: noop,
    onRenameCollection: noop,
    onDuplicateCollection: noop,
    onExportCollection: noop,
    onEditVariables: noop,
    onDeleteCollection: noop,
    onToggleRequest: noop,
    onRenameRequest: noop,
    onDuplicateRequest: noop,
    onDeleteRequest: noop,
  },
  welcome: { journal },
  requestsView: null,
  requestEditor: null,
  dialogs: {
    busy: false,
    errorMessage: null,
    statusMessage: null,
    nameDialog: { open: false, mode: "create", scope: "collection", value: "", errorMessage: null },
    deleteDialog: { open: false, collectionName: "" },
    discardDialogOpen: false,
    onRetry: noop,
    onNameDialogOpenChange: noop,
    onNameDialogValueChange: noop,
    onNameDialogSubmit: noop,
    onDeleteDialogOpenChange: noop,
    onDeleteDialogConfirm: noop,
    onDiscardDialogOpenChange: noop,
    onDiscardConfirm: noop,
  },
  variablesDialog: null,
};

const meta = {
  title: "Settings/External Services Workspace",
  component: ExternalServicesPanel,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ExternalServicesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyLight: Story = {
  args: baseProps,
  globals: { theme: "light" },
};

export const EmptyDark: Story = {
  args: baseProps,
  globals: { theme: "dark" },
};

export const WithTreeLight: Story = {
  args: {
    ...baseProps,
    sidebar: {
      ...baseProps.sidebar,
      collections: [
        {
          id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
          name: "Bitrix 24",
          enabled: true,
          requests: [
            {
              id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
              name: "Удаление пользователя",
              method: "GET",
              enabled: true,
            },
          ],
        },
        {
          id: "c0b1c2d3-e4f5-4a67-8b90-123456789012",
          name: "1C",
          enabled: true,
          requests: [],
        },
      ],
      selection: {
        kind: "request",
        collectionId: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
        requestId: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
      },
    },
    welcome: null,
    requestEditor: {
      collectionName: "Bitrix 24",
      collectionVariableKeys: [],
      draft: {
        id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
        name: "Удаление пользователя",
        enabled: true,
        method: "GET",
        url: "https://example.bitrix24.ru/rest/user.delete",
        query: [],
        headers: [],
        body: { mode: "none", value: "" },
        triggers: [],
      },
      busy: false,
      errorMessage: null,
      runState: "idle",
      runResult: null,
      journal,
      onChange: noop,
      onCommitName: noop,
      onSave: noop,
      onRunNow: noop,
      onDelete: noop,
    },
  },
  globals: { theme: "light" },
};

export const WithTreeDark: Story = {
  ...WithTreeLight,
  globals: { theme: "dark" },
};
