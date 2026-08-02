/**
 * - Purpose: serialize and parse External Services journal files.
 * - Inputs: redacted journal entries or unknown persisted JSON.
 * - Outputs: UTF-8 JSON document or a classified parse failure.
 */

import {
  EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES,
  EXTERNAL_SERVICE_JOURNAL_OUTCOMES,
  isExternalServiceHttpMethod,
  isExternalServiceUuid,
  type ExternalServiceCollectionId,
  type ExternalServiceEventType,
  type ExternalServiceHttpMethod,
  type ExternalServiceJournalEntry,
  type ExternalServiceJournalOutcome,
  type ExternalServiceKeyValue,
  type ExternalServiceKeyValueId,
  type ExternalServiceRequestId,
  type SettingsAccountKey,
} from "@domain/index.js";
import { EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES } from "@ports/integration/ExternalServicesJournalRepository.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export const EXTERNAL_SERVICES_JOURNAL_FORMAT =
  "omnicall.external-services-journal" as const;
export const EXTERNAL_SERVICES_JOURNAL_FORMAT_VERSION = 1 as const;

export type ExternalServicesJournalDocumentV1 = Readonly<{
  format: typeof EXTERNAL_SERVICES_JOURNAL_FORMAT;
  formatVersion: typeof EXTERNAL_SERVICES_JOURNAL_FORMAT_VERSION;
  entries: ReadonlyArray<ExternalServiceJournalEntry>;
}>;

export type ExternalServicesJournalDocumentParseErrorCode =
  | "invalid_shape"
  | "unsupported_format"
  | "unsupported_format_version"
  | "invalid_entry"
  | "unredacted_protected_header";

export type ExternalServicesJournalDocumentParseResult =
  | { readonly ok: true; readonly value: ExternalServicesJournalDocumentV1 }
  | {
      readonly ok: false;
      readonly error: Readonly<{
        readonly code: ExternalServicesJournalDocumentParseErrorCode;
      }>;
    };

const PROTECTED_HEADER_NAMES = new Set(["authorization", "cookie", "x-api-key"]);
const EVENT_TYPES = new Set<string>([
  ...EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES,
  "manual_run",
]);

/**
 * - Purpose: encode newest-first journal entries for atomic disk persistence.
 * - Inputs: validated, redacted journal entries already capped by the repository.
 * - Outputs: pretty JSON string with trailing newline.
 */
export function serializeExternalServicesJournalDocument(
  entries: ReadonlyArray<ExternalServiceJournalEntry>,
): string {
  const document: ExternalServicesJournalDocumentV1 = {
    format: EXTERNAL_SERVICES_JOURNAL_FORMAT,
    formatVersion: EXTERNAL_SERVICES_JOURNAL_FORMAT_VERSION,
    entries: entries.slice(0, EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES).map(copyEntry),
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

/**
 * - Purpose: validate unknown journal JSON into immutable Domain entries.
 * - Inputs: parsed JSON from a per-profile journal file.
 * - Outputs: validated document or classified parse error.
 */
export function parseExternalServicesJournalDocument(
  raw: unknown,
  expectedProfileKey: SettingsAccountKey,
): ExternalServicesJournalDocumentParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }
  const record = raw as Record<string, unknown>;
  if (record["format"] !== EXTERNAL_SERVICES_JOURNAL_FORMAT) {
    return { ok: false, error: { code: "unsupported_format" } };
  }
  if (record["formatVersion"] !== EXTERNAL_SERVICES_JOURNAL_FORMAT_VERSION) {
    return { ok: false, error: { code: "unsupported_format_version" } };
  }
  if (!Array.isArray(record["entries"])) {
    return { ok: false, error: { code: "invalid_shape" } };
  }

  const entries: ExternalServiceJournalEntry[] = [];
  for (const candidate of record["entries"]) {
    const parsed = parseJournalEntry(candidate, expectedProfileKey);
    if (!parsed.ok) {
      return parsed;
    }
    entries.push(parsed.value);
  }

  return {
    ok: true,
    value: {
      format: EXTERNAL_SERVICES_JOURNAL_FORMAT,
      formatVersion: EXTERNAL_SERVICES_JOURNAL_FORMAT_VERSION,
      entries: entries.slice(0, EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES),
    },
  };
}

function parseJournalEntry(
  raw: unknown,
  expectedProfileKey: SettingsAccountKey,
):
  | { readonly ok: true; readonly value: ExternalServiceJournalEntry }
  | {
      readonly ok: false;
      readonly error: Readonly<{
        readonly code: ExternalServicesJournalDocumentParseErrorCode;
      }>;
    } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: { code: "invalid_entry" } };
  }
  const record = raw as Record<string, unknown>;
  const id = readRequiredString(record["id"]);
  const profileKey = readRequiredString(record["profileKey"]);
  const collectionId = readRequiredString(record["collectionId"]);
  const requestId = readRequiredString(record["requestId"]);
  const collectionName = readRequiredString(record["collectionName"]);
  const requestName = readRequiredString(record["requestName"]);
  const eventType = readRequiredString(record["eventType"]);
  const startedAt = readRequiredString(record["startedAt"]);
  const requestUrl = readRequiredString(record["requestUrl"]);
  const responseBody = readString(record["responseBody"]);
  // Legacy v1 rows may omit request body fields; treat as empty (no body captured).
  const requestBody =
    record["requestBody"] === undefined ? "" : readString(record["requestBody"]);
  const correlationId = readRequiredString(record["correlationId"]);
  const outcome = record["outcome"];
  const durationMs = record["durationMs"];
  const status = record["status"];
  const responseBodyTruncated = record["responseBodyTruncated"];
  const requestBodyTruncated =
    record["requestBodyTruncated"] === undefined
      ? false
      : record["requestBodyTruncated"];
  const errorCode = record["errorCode"];
  const errorMessage = record["errorMessage"];
  const headersRaw = record["requestHeaders"];
  const methodRaw = record["method"];
  // Legacy v1 rows may omit method; default GET so existing journals still load.
  const method: ExternalServiceHttpMethod | null =
    methodRaw === undefined
      ? "GET"
      : isExternalServiceHttpMethod(methodRaw)
        ? methodRaw
        : null;

  if (
    id === null ||
    profileKey === null ||
    collectionId === null ||
    requestId === null ||
    collectionName === null ||
    requestName === null ||
    eventType === null ||
    startedAt === null ||
    requestUrl === null ||
    requestBody === null ||
    responseBody === null ||
    correlationId === null ||
    method === null ||
    !isExternalServiceUuid(collectionId) ||
    !isExternalServiceUuid(requestId) ||
    !EVENT_TYPES.has(eventType) ||
    !isJournalOutcome(outcome) ||
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs < 0 ||
    typeof requestBodyTruncated !== "boolean" ||
    typeof responseBodyTruncated !== "boolean" ||
    !Array.isArray(headersRaw) ||
    profileKey !== expectedProfileKey
  ) {
    return { ok: false, error: { code: "invalid_entry" } };
  }

  if (
    !(status === null || (typeof status === "number" && Number.isInteger(status))) ||
    !(errorCode === null || typeof errorCode === "string") ||
    !(errorMessage === null || typeof errorMessage === "string")
  ) {
    return { ok: false, error: { code: "invalid_entry" } };
  }

  const requestHeaders: ExternalServiceKeyValue[] = [];
  for (const headerRaw of headersRaw) {
    const header = parseHeader(headerRaw);
    if (header === null) {
      return { ok: false, error: { code: "invalid_entry" } };
    }
    if (
      PROTECTED_HEADER_NAMES.has(header.key.trim().toLowerCase()) &&
      header.value !== "***"
    ) {
      return { ok: false, error: { code: "unredacted_protected_header" } };
    }
    requestHeaders.push(header);
  }

  return {
    ok: true,
    value: {
      id,
      profileKey: profileKey as SettingsAccountKey,
      collectionId: collectionId as ExternalServiceCollectionId,
      collectionName,
      requestId: requestId as ExternalServiceRequestId,
      requestName,
      method,
      eventType: eventType as ExternalServiceEventType,
      startedAt,
      durationMs,
      outcome,
      status,
      requestUrl,
      requestHeaders,
      requestBody,
      requestBodyTruncated,
      responseBody,
      responseBodyTruncated,
      errorCode,
      errorMessage,
      correlationId: correlationId as CorrelationId,
    },
  };
}

function parseHeader(raw: unknown): ExternalServiceKeyValue | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const id = readRequiredString(record["id"]);
  const key = readRequiredString(record["key"]);
  const value = readString(record["value"]);
  const enabled = record["enabled"];
  if (
    id === null ||
    key === null ||
    value === null ||
    typeof enabled !== "boolean" ||
    !isExternalServiceUuid(id)
  ) {
    return null;
  }
  return {
    id: id as ExternalServiceKeyValueId,
    key,
    value,
    enabled,
  };
}

function copyEntry(entry: ExternalServiceJournalEntry): ExternalServiceJournalEntry {
  return {
    ...entry,
    requestHeaders: entry.requestHeaders.map((header) => ({ ...header })),
  };
}

function readRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isJournalOutcome(value: unknown): value is ExternalServiceJournalOutcome {
  return (
    typeof value === "string" &&
    (EXTERNAL_SERVICE_JOURNAL_OUTCOMES as ReadonlyArray<string>).includes(value)
  );
}
