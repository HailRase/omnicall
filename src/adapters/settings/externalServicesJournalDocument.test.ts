/**
 * - Purpose: validate External Services journal document round-trips.
 * - Inputs: fixture entries and malformed JSON shapes.
 * - Outputs: parse/serialize contract assertions.
 */

import { describe, expect, it } from "vitest";
import type {
  ExternalServiceCollectionId,
  ExternalServiceJournalEntry,
  ExternalServiceKeyValueId,
  ExternalServiceRequestId,
  SettingsAccountKey,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  parseExternalServicesJournalDocument,
  serializeExternalServicesJournalDocument,
} from "./externalServicesJournalDocument.js";

const profileKey = "agent-a@example.test" as SettingsAccountKey;

function createEntry(id: string): ExternalServiceJournalEntry {
  return {
    id,
    profileKey,
    collectionId: "00000000-0000-4000-8000-000000000001" as ExternalServiceCollectionId,
    collectionName: "Main",
    requestId: "00000000-0000-4000-8000-000000000002" as ExternalServiceRequestId,
    requestName: "Notify",
    method: "POST",
    eventType: "manual_run",
    startedAt: "2026-07-29T00:00:00.000Z",
    durationMs: 10,
    outcome: "http_success",
    status: 200,
    requestUrl: "https://example.test/webhook",
    requestHeaders: [
      {
        id: "00000000-0000-4000-8000-000000000003" as ExternalServiceKeyValueId,
        key: "Authorization",
        value: "***",
        enabled: true,
      },
    ],
    responseBody: "ok",
    responseBodyTruncated: false,
    errorCode: null,
    errorMessage: null,
    correlationId: "corr_external_services_journal" as CorrelationId,
  };
}

describe("externalServicesJournalDocument", () => {
  it("round-trips redacted journal entries", () => {
    const json = serializeExternalServicesJournalDocument([
      createEntry("second"),
      createEntry("first"),
    ]);
    const parsed = parseExternalServicesJournalDocument(
      JSON.parse(json) as unknown,
      profileKey,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.entries.map((entry) => entry.id)).toEqual([
      "second",
      "first",
    ]);
    expect(parsed.value.entries[0]?.method).toBe("POST");
  });

  it("defaults missing method on legacy journal rows", () => {
    const legacy = createEntry("legacy");
    const parsed = parseExternalServicesJournalDocument(
      {
        format: "omnicall.external-services-journal",
        formatVersion: 1,
        entries: [
          {
            id: legacy.id,
            profileKey: legacy.profileKey,
            collectionId: legacy.collectionId,
            collectionName: legacy.collectionName,
            requestId: legacy.requestId,
            requestName: legacy.requestName,
            eventType: legacy.eventType,
            startedAt: legacy.startedAt,
            durationMs: legacy.durationMs,
            outcome: legacy.outcome,
            status: legacy.status,
            requestUrl: legacy.requestUrl,
            requestHeaders: legacy.requestHeaders,
            responseBody: legacy.responseBody,
            responseBodyTruncated: legacy.responseBodyTruncated,
            errorCode: legacy.errorCode,
            errorMessage: legacy.errorMessage,
            correlationId: legacy.correlationId,
          },
        ],
      },
      profileKey,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.entries[0]?.method).toBe("GET");
  });

  it("rejects unsupported format and unredacted protected headers", () => {
    expect(
      parseExternalServicesJournalDocument(
        { format: "other", formatVersion: 1, entries: [] },
        profileKey,
      ),
    ).toMatchObject({ ok: false, error: { code: "unsupported_format" } });

    const unsafe = createEntry("unsafe");
    const parsed = parseExternalServicesJournalDocument(
      {
        format: "omnicall.external-services-journal",
        formatVersion: 1,
        entries: [
          {
            ...unsafe,
            requestHeaders: [
              {
                id: "00000000-0000-4000-8000-000000000003",
                key: "Authorization",
                value: "secret",
                enabled: true,
              },
            ],
          },
        ],
      },
      profileKey,
    );
    expect(parsed).toMatchObject({
      ok: false,
      error: { code: "unredacted_protected_header" },
    });
  });
});
