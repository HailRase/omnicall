import type { Meta, StoryObj } from "@storybook/react";
import type { ExternalServicesJournalEntryVm } from "@application/index.js";
import { ExternalServicesJournal } from "./ExternalServicesJournal.js";

const meta = {
  title: "Settings/External Services Journal",
  component: ExternalServicesJournal,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ExternalServicesJournal>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = (): void => undefined;

const fixtureEntry: ExternalServicesJournalEntryVm = {
  id: "journal-fixture-1",
  startedAt: "2026-07-29T12:00:00.000Z",
  collectionName: "CRM",
  requestName: "Notify",
  method: "POST",
  eventType: "manual_run",
  outcome: "http_success",
  status: 200,
  durationMs: 42,
  requestUrl: "https://crm.example.test/hooks",
  requestHeaders: [
    { id: "header-auth", key: "Authorization", value: "***" },
    { id: "header-cookie", key: "Cookie", value: "***" },
    { id: "header-trace", key: "X-Trace", value: "safe-value" },
  ],
  requestBody: "{\"event\":\"manual_run\"}",
  requestBodyTruncated: false,
  responseBody: "{\"ok\":true,\"truncated\":false}",
  responseBodyTruncated: true,
  errorCode: null,
  errorMessage: null,
};

export const EmptyLight: Story = {
  args: {
    panel: { loadState: "ready", entries: [], capped: false },
    onRetry: noop,
  },
  globals: { theme: "light" },
};

export const EmptyDark: Story = {
  args: {
    panel: { loadState: "ready", entries: [], capped: false },
    onRetry: noop,
  },
  globals: { theme: "dark" },
};

export const WithEntriesLight: Story = {
  args: {
    panel: {
      loadState: "ready",
      capped: true,
      entries: [
        fixtureEntry,
        {
          ...fixtureEntry,
          id: "journal-fixture-2",
          outcome: "timeout",
          status: null,
          responseBody: "",
          responseBodyTruncated: false,
          errorCode: "timeout",
          errorMessage: "Request timed out",
        },
      ],
    },
    onRetry: noop,
  },
  globals: { theme: "light" },
};

export const WithEntriesDark: Story = {
  args: {
    ...WithEntriesLight.args,
  },
  globals: { theme: "dark" },
};
