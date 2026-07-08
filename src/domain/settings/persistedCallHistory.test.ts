import { describe, expect, it } from "vitest";
import { createCallId } from "../telephony/CallId.js";
import { createCallHistoryEntryFromSession } from "./CallHistoryEntry.js";
import { MAX_CALL_HISTORY_ENTRIES } from "./CallHistoryRetention.js";
import {
  CALL_HISTORY_DOCUMENT_SCHEMA_VERSION,
  parsePersistedCallHistoryDocument,
  serializeCallHistoryDocument,
} from "./persistedCallHistory.js";

function createSampleEntry(index: number) {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId(`call-${index}`),
    direction: "outgoing",
    remoteNumber: `+1202555${String(index).padStart(4, "0")}`,
    displayLabel: null,
    startedAt: "2026-07-07T10:00:00.000Z",
    endedAt: "2026-07-07T10:01:00.000Z",
    wasAnswered: true,
    failed: false,
    missedBeforeAnswer: false,
  });
  if (!created.ok) {
    throw new Error("expected valid entry");
  }
  return created.value;
}

describe("parsePersistedCallHistoryDocument", () => {
  it("round-trips valid entries through serialize and parse", () => {
    const entry = createSampleEntry(1);
    const json = serializeCallHistoryDocument([entry]);
    const parsed = parsePersistedCallHistoryDocument(JSON.parse(json) as unknown);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.schemaVersion).toBe(CALL_HISTORY_DOCUMENT_SCHEMA_VERSION);
    expect(parsed.value.entries).toEqual([entry]);
  });

  it("enforces retention limit on load when document stores newest-first", () => {
    const entries = Array.from({ length: MAX_CALL_HISTORY_ENTRIES + 5 }, (_, index) =>
      createSampleEntry(index),
    ).reverse();

    const json = serializeCallHistoryDocument(entries);
    const parsed = parsePersistedCallHistoryDocument(JSON.parse(json) as unknown);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.entries).toHaveLength(MAX_CALL_HISTORY_ENTRIES);
    expect(parsed.value.entries[0]?.callId).toBe(createCallId(`call-${MAX_CALL_HISTORY_ENTRIES + 4}`));
  });

  it("rejects documents with forbidden secret field names", () => {
    const result = parsePersistedCallHistoryDocument({
      schemaVersion: CALL_HISTORY_DOCUMENT_SCHEMA_VERSION,
      entries: [],
      token: "abc",
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "forbidden_secret_field" },
    });
  });
});
