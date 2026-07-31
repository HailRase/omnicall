/**
 * - Purpose: verify journal panel projection cap, redaction display, and truncation flags.
 * - Inputs: synthetic journal fixtures with protected headers and large-body markers.
 * - Outputs: newest-first UI VMs without Domain branded identifiers.
 */

import { describe, expect, it } from "vitest";
import {
  createSettingsAccountKey,
  type ExternalServiceCollectionId,
  type ExternalServiceJournalEntry,
  type ExternalServiceKeyValueId,
  type ExternalServiceRequestId,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  deriveExternalServicesJournalPanel,
  EXTERNAL_SERVICES_JOURNAL_UI_LIMIT,
} from "./deriveExternalServicesJournalPanel.js";

const profileKey = createSettingsAccountKey("journal-ui@example.test");

function createEntry(
  id: string,
  overrides: Partial<ExternalServiceJournalEntry> = {},
): ExternalServiceJournalEntry {
  return {
    id,
    profileKey,
    collectionId: "00000000-0000-4000-8000-000000000001" as ExternalServiceCollectionId,
    collectionName: "CRM",
    requestId: "00000000-0000-4000-8000-000000000002" as ExternalServiceRequestId,
    requestName: "Notify",
    method: "POST",
    eventType: "manual_run",
    startedAt: "2026-07-29T12:00:00.000Z",
    durationMs: 42,
    outcome: "http_success",
    status: 200,
    requestUrl: "https://crm.example.test/hooks",
    requestHeaders: [
      {
        id: "00000000-0000-4000-8000-000000000003" as ExternalServiceKeyValueId,
        key: "Authorization",
        value: "***",
        enabled: true,
      },
      {
        id: "00000000-0000-4000-8000-000000000004" as ExternalServiceKeyValueId,
        key: "X-Trace",
        value: "safe",
        enabled: true,
      },
    ],
    responseBody: "{\"ok\":true}",
    responseBodyTruncated: false,
    errorCode: null,
    errorMessage: null,
    correlationId: "corr_journal_ui" as CorrelationId,
    ...overrides,
  };
}

describe("deriveExternalServicesJournalPanel", () => {
  it("preserves newest-first order and already-redacted protected headers", () => {
    const panel = deriveExternalServicesJournalPanel(
      [createEntry("newer"), createEntry("older")],
      "ready",
    );

    expect(panel.loadState).toBe("ready");
    expect(panel.entries.map((entry) => entry.id)).toEqual(["newer", "older"]);
    expect(panel.entries[0]?.method).toBe("POST");
    expect(panel.entries[0]?.requestHeaders[0]?.value).toBe("***");
    expect(panel.entries[0]?.requestHeaders[0]?.value).not.toContain("Bearer");
  });

  it("caps displayed entries at 100 and surfaces truncation markers", () => {
    const journal = Array.from({ length: EXTERNAL_SERVICES_JOURNAL_UI_LIMIT + 5 }, (_, index) =>
      createEntry(`entry-${index}`, {
        responseBody: "truncated-body",
        responseBodyTruncated: true,
        outcome: "http_error",
        status: 500,
        errorCode: "http_error",
        errorMessage: "server failed",
      }),
    );

    const panel = deriveExternalServicesJournalPanel(journal, "ready");

    expect(panel.entries).toHaveLength(EXTERNAL_SERVICES_JOURNAL_UI_LIMIT);
    expect(panel.capped).toBe(true);
    expect(panel.entries[0]?.responseBodyTruncated).toBe(true);
    expect(panel.entries[0]?.errorMessage).toBe("server failed");
  });

  it("keeps loading and error shells empty until journal rows arrive", () => {
    expect(deriveExternalServicesJournalPanel(null, "loading")).toEqual({
      loadState: "loading",
      entries: [],
      capped: false,
    });
    expect(deriveExternalServicesJournalPanel(null, "error")).toEqual({
      loadState: "error",
      entries: [],
      capped: false,
    });
  });
});
