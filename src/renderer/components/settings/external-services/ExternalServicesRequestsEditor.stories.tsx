import type { Meta, StoryObj } from "@storybook/react";
import { ExternalServicesRequestEditor } from "./ExternalServicesRequestEditor.js";
import { ExternalServicesRequestsView } from "./ExternalServicesRequestsView.js";

const noop = (): void => undefined;

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

const request = {
  id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
  name: "Call event",
  enabled: true,
  method: "POST",
};

const requestViewArgs = {
  collection,
  requests: [request],
  busy: false,
  onBack: noop,
  onCreate: noop,
  onOpen: noop,
  onToggle: noop,
  onRename: noop,
  onDuplicate: noop,
  onDelete: noop,
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
      draft={{
        ...request,
        url: "https://crm.example/events",
        query: [{ id: "query", key: "source", value: "phone", enabled: true }],
        headers: [{ id: "header", key: "X-Source", value: "omnicall", enabled: true }],
        body: { mode: "json", value: "{\"event\":\"call_answered\"}" },
        triggers: ["call_answered"],
      }}
      busy={false}
      errorMessage={null}
      isDirty={false}
      runState="idle"
      runResult={{ kind: "error", category: "http", status: 422, durationMs: 85, body: "{\"error\":\"invalid\"}", bodyTruncated: false, jsonValidity: "valid" }}
      onBack={noop}
      onChange={noop}
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
