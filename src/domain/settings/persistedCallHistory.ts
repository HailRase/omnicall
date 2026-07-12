import type {
  CallHistoryDirection,
  CallHistoryEndReason,
  CallHistoryEntry,
  CallHistoryOutcome,
} from "./CallHistoryEntry.js";
import { MAX_CALL_HISTORY_ENTRIES } from "./CallHistoryRetention.js";
import {
  buildValidatedCallHistoryEntry,
  parsePersistedCallHistoryEntryV1,
} from "./persistedCallHistoryMigration.js";
import {
  hasForbiddenSecretField,
  readCallHistoryDirection,
  readCallHistoryEndReason,
  readCallHistoryOutcome,
  readNonNegativeInteger,
  readNullableString,
  readRequiredString,
} from "./persistedCallHistoryReaders.js";

export const CALL_HISTORY_DOCUMENT_SCHEMA_VERSION = 2 as const;
export const CALL_HISTORY_DOCUMENT_SCHEMA_VERSION_V1 = 1 as const;

export type CallHistoryDocumentV1 = Readonly<{
  schemaVersion: typeof CALL_HISTORY_DOCUMENT_SCHEMA_VERSION;
  entries: ReadonlyArray<CallHistoryEntry>;
}>;

export type CallHistoryDocumentParseErrorCode =
  | "invalid_shape"
  | "unsupported_schema_version"
  | "forbidden_secret_field";

export type CallHistoryDocumentParseResult =
  | { readonly ok: true; readonly value: CallHistoryDocumentV1 }
  | {
      readonly ok: false;
      readonly error: Readonly<{ readonly code: CallHistoryDocumentParseErrorCode }>;
    };

type PersistedCallHistoryEntryRecordV2 = Readonly<{
  id: string;
  callId: string;
  direction: CallHistoryDirection;
  remoteNumber: string;
  displayLabel: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  ringDurationSec: number;
  talkDurationSec: number;
  outcome: CallHistoryOutcome;
  endReason: CallHistoryEndReason;
}>;

type PersistedCallHistoryDocumentV2 = Readonly<{
  schemaVersion: typeof CALL_HISTORY_DOCUMENT_SCHEMA_VERSION;
  entries: ReadonlyArray<PersistedCallHistoryEntryRecordV2>;
}>;

/**
 * - Purpose: serialize per-account call history document for atomic persistence.
 * - Inputs: validated CallHistoryEntry list newest-first.
 * - Outputs: JSON string without secret-like field names.
 */
export function serializeCallHistoryDocument(
  entries: ReadonlyArray<CallHistoryEntry>,
): string {
  const document: PersistedCallHistoryDocumentV2 = {
    schemaVersion: CALL_HISTORY_DOCUMENT_SCHEMA_VERSION,
    entries: entries.map(toPersistedCallHistoryEntryRecord),
  };

  return JSON.stringify(document);
}

/**
 * - Purpose: parse unknown JSON into call history document with retention enforcement.
 * - Inputs: parsed JSON value from call-history store file.
 * - Outputs: validated document or classified parse error.
 */
export function parsePersistedCallHistoryDocument(
  raw: unknown,
): CallHistoryDocumentParseResult {
  if (hasForbiddenSecretField(raw)) {
    return { ok: false, error: { code: "forbidden_secret_field" } };
  }

  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const record = raw as Record<string, unknown>;
  const schemaVersion = record["schemaVersion"];

  if (
    schemaVersion !== CALL_HISTORY_DOCUMENT_SCHEMA_VERSION &&
    schemaVersion !== CALL_HISTORY_DOCUMENT_SCHEMA_VERSION_V1
  ) {
    return { ok: false, error: { code: "unsupported_schema_version" } };
  }

  const entriesRaw = record["entries"];
  if (!Array.isArray(entriesRaw)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const entries: CallHistoryEntry[] = [];

  for (const entry of entriesRaw) {
    const parsedEntry =
      schemaVersion === CALL_HISTORY_DOCUMENT_SCHEMA_VERSION_V1
        ? parsePersistedCallHistoryEntryV1(entry)
        : parsePersistedCallHistoryEntryV2(entry);
    if (parsedEntry === null) {
      continue;
    }

    if (entries.some((existing) => existing.id === parsedEntry.id)) {
      continue;
    }

    entries.push(parsedEntry);
  }

  const retained =
    entries.length > MAX_CALL_HISTORY_ENTRIES
      ? entries.slice(0, MAX_CALL_HISTORY_ENTRIES)
      : entries;

  return {
    ok: true,
    value: {
      schemaVersion: CALL_HISTORY_DOCUMENT_SCHEMA_VERSION,
      entries: retained,
    },
  };
}

function parsePersistedCallHistoryEntryV2(raw: unknown): CallHistoryEntry | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const idRaw = readRequiredString(record, "id");
  const callIdRaw = readRequiredString(record, "callId");
  const direction = readCallHistoryDirection(record, "direction");
  const remoteNumber = readRequiredString(record, "remoteNumber");
  const startedAt = readRequiredString(record, "startedAt");
  const endedAt = readRequiredString(record, "endedAt");
  const durationSec = readNonNegativeInteger(record, "durationSec");
  const ringDurationSec = readNonNegativeInteger(record, "ringDurationSec");
  const talkDurationSec = readNonNegativeInteger(record, "talkDurationSec");
  const outcome = readCallHistoryOutcome(record, "outcome");
  const endReason = readCallHistoryEndReason(record, "endReason");

  if (
    idRaw === null ||
    callIdRaw === null ||
    direction === null ||
    remoteNumber === null ||
    startedAt === null ||
    endedAt === null ||
    durationSec === null ||
    ringDurationSec === null ||
    talkDurationSec === null ||
    outcome === null ||
    endReason === null
  ) {
    return null;
  }

  return buildValidatedCallHistoryEntry({
    idRaw,
    callIdRaw,
    direction,
    remoteNumber,
    displayLabel: readNullableString(record, "displayLabel"),
    startedAt,
    endedAt,
    durationSec,
    ringDurationSec,
    talkDurationSec,
    outcome,
    endReason,
  });
}

function toPersistedCallHistoryEntryRecord(
  entry: CallHistoryEntry,
): PersistedCallHistoryEntryRecordV2 {
  return {
    id: entry.id,
    callId: entry.callId,
    direction: entry.direction,
    remoteNumber: entry.remoteNumber,
    displayLabel: entry.displayLabel,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    durationSec: entry.durationSec,
    ringDurationSec: entry.ringDurationSec,
    talkDurationSec: entry.talkDurationSec,
    outcome: entry.outcome,
    endReason: entry.endReason,
  };
}
