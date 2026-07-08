import { createCallId } from "../telephony/CallId.js";
import type {
  CallHistoryDirection,
  CallHistoryEntry,
  CallHistoryOutcome,
} from "./CallHistoryEntry.js";
import { createCallHistoryEntryId } from "./CallHistoryEntryId.js";
import { MAX_CALL_HISTORY_ENTRIES } from "./CallHistoryRetention.js";

export const CALL_HISTORY_DOCUMENT_SCHEMA_VERSION = 1 as const;

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

type PersistedCallHistoryEntryRecordV1 = Readonly<{
  id: string;
  callId: string;
  direction: CallHistoryDirection;
  remoteNumber: string;
  displayLabel: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  outcome: CallHistoryOutcome;
}>;

type PersistedCallHistoryDocumentV1 = Readonly<{
  schemaVersion: typeof CALL_HISTORY_DOCUMENT_SCHEMA_VERSION;
  entries: ReadonlyArray<PersistedCallHistoryEntryRecordV1>;
}>;

/**
 * - Purpose: serialize per-account call history document for atomic persistence.
 * - Inputs: validated CallHistoryEntry list newest-first.
 * - Outputs: JSON string without secret-like field names.
 */
export function serializeCallHistoryDocument(
  entries: ReadonlyArray<CallHistoryEntry>,
): string {
  const document: PersistedCallHistoryDocumentV1 = {
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

  if (schemaVersion !== CALL_HISTORY_DOCUMENT_SCHEMA_VERSION) {
    return { ok: false, error: { code: "unsupported_schema_version" } };
  }

  const entriesRaw = record["entries"];
  if (!Array.isArray(entriesRaw)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const entries: CallHistoryEntry[] = [];

  for (const entry of entriesRaw) {
    const parsedEntry = parsePersistedCallHistoryEntry(entry);
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

function parsePersistedCallHistoryEntry(raw: unknown): CallHistoryEntry | null {
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
  const outcome = readCallHistoryOutcome(record, "outcome");

  if (
    idRaw === null ||
    callIdRaw === null ||
    direction === null ||
    remoteNumber === null ||
    startedAt === null ||
    endedAt === null ||
    durationSec === null ||
    outcome === null
  ) {
    return null;
  }

  const entryId = createCallHistoryEntryId(idRaw);
  if (entryId === null) {
    return null;
  }

  const callId = createCallId(callIdRaw);
  const displayLabel = readNullableString(record, "displayLabel");

  const startedAtMs = Date.parse(startedAt);
  const endedAtMs = Date.parse(endedAt);
  if (Number.isNaN(startedAtMs) || Number.isNaN(endedAtMs) || endedAtMs < startedAtMs) {
    return null;
  }

  if (remoteNumber.trim().length === 0) {
    return null;
  }

  return {
    id: entryId,
    callId,
    direction,
    remoteNumber: remoteNumber.trim(),
    displayLabel,
    startedAt,
    endedAt,
    durationSec,
    outcome,
  };
}

function toPersistedCallHistoryEntryRecord(
  entry: CallHistoryEntry,
): PersistedCallHistoryEntryRecordV1 {
  return {
    id: entry.id,
    callId: entry.callId,
    direction: entry.direction,
    remoteNumber: entry.remoteNumber,
    displayLabel: entry.displayLabel,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    durationSec: entry.durationSec,
    outcome: entry.outcome,
  };
}

function readRequiredString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

function readNullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

function readNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

function readCallHistoryDirection(
  record: Record<string, unknown>,
  key: string,
): CallHistoryDirection | null {
  const value = record[key];
  if (value === "incoming" || value === "outgoing") {
    return value;
  }
  return null;
}

function readCallHistoryOutcome(
  record: Record<string, unknown>,
  key: string,
): CallHistoryOutcome | null {
  const value = record[key];
  if (value === "completed" || value === "missed" || value === "failed") {
    return value;
  }
  return null;
}

const FORBIDDEN_SECRET_FIELD_FRAGMENTS = [
  "password",
  "token",
  "credential",
  "secret",
] as const;

function hasForbiddenSecretField(value: unknown): boolean {
  try {
    scanValueForForbiddenSecretFields(value, []);
    return false;
  } catch {
    return true;
  }
}

function scanValueForForbiddenSecretFields(
  value: unknown,
  path: ReadonlyArray<string>,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      scanValueForForbiddenSecretFields(entry, [...path, String(index)]);
    });
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [fieldName, nestedValue] of Object.entries(value)) {
    if (isForbiddenSecretFieldName(fieldName)) {
      throw new Error(`forbidden_secret_field:${fieldName}`);
    }
    scanValueForForbiddenSecretFields(nestedValue, [...path, fieldName]);
  }
}

function isForbiddenSecretFieldName(fieldName: string): boolean {
  const normalized = fieldName.trim().toLowerCase();
  return FORBIDDEN_SECRET_FIELD_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}
