import type { Meta, StoryObj } from "@storybook/react";
import { ExternalServicesRequestEditor } from "./ExternalServicesRequestEditor.js";
import { ExternalServicesRequestsView } from "./ExternalServicesRequestsView.js";

const noop = (): void => undefined;
const journal = {
  panel: { loadState: "ready" as const, entries: [], capped: false },
  onRetry: noop,
};

const meta = {
  title: "Settings/External Services Requests",
  component: ExternalServicesRequestsView,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ExternalServicesRequestsView>;

export default meta;
type Story = StoryObj<typeof meta>;

const collection = {
  id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
  name: "CRM",
  enabled: true,
  enabledRequestCount: 1,
  requestCount: 1,
  variables: [{ key: "base_url", value: "https://crm.example" }],
};

const requestViewArgs = {
  collection,
  busy: false,
  journal,
  onCreate: noop,
  onEditVariables: noop,
  onRename: noop,
};

export const RequestsLight: Story = {
  args: requestViewArgs,
  globals: { theme: "light" },
};

export const RequestsDark: Story = {
  args: requestViewArgs,
  globals: { theme: "dark" },
};

export const EditorRunResultLight: Story = {
  args: requestViewArgs,
  render: () => (
    <ExternalServicesRequestEditor
      collectionName="CRM"
      draft={{
        id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
        name: "Call event",
        enabled: true,
        method: "POST",
        url: "https://crm.example/events",
        query: [{ id: "query", key: "source", value: "phone", enabled: true }],
        headers: [{ id: "header", key: "X-Source", value: "omnicall", enabled: true }],
        body: { mode: "json", value: "{\"event\":\"call_answered\"}" },
        triggers: [{ eventType: "call_answered", delaySeconds: 0 }],
      }}
      busy={false}
      errorMessage={null}
      runState="idle"
      runResult={{
        kind: "error",
        category: "http",
        status: 422,
        durationMs: 85,
        body: "{\"error\":\"invalid\"}",
        bodyTruncated: false,
        jsonValidity: "valid",
      }}
      journal={journal}
      onChange={noop}
      onCommitName={noop}
      onSave={noop}
      onRunNow={noop}
      onDelete={noop}
    />
  ),
  globals: { theme: "light" },
};

export const EditorRunResultDark: Story = {
  ...EditorRunResultLight,
  globals: { theme: "dark" },
};
