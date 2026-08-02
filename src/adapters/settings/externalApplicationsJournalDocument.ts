/**
 * - Purpose: serialize and parse External Applications journal files.
 * - Inputs: journal entries or unknown persisted JSON.
 * - Outputs: UTF-8 JSON document or a classified parse failure.
 */

import {
  EXTERNAL_APPLICATION_JOURNAL_OUTCOMES,
  EXTERNAL_APPLICATION_OPEN_MODES,
  EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES,
  isExternalApplicationUuid,
  type ExternalApplicationId,
  type ExternalApplicationJournalEntry,
  type ExternalApplicationJournalOutcome,
  type ExternalApplicationOpenMode,
  type ExternalServiceEventType,
  type SettingsAccountKey,
} from "@domain/index.js";
import { EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES } from "@ports/integration/ExternalApplicationsJournalRepository.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export const EXTERNAL_APPLICATIONS_JOURNAL_FORMAT =
  "omnicall.external-applications-journal" as const;
export const EXTERNAL_APPLICATIONS_JOURNAL_FORMAT_VERSION = 1 as const;

export type ExternalApplicationsJournalDocumentV1 = Readonly<{
  format: typeof EXTERNAL_APPLICATIONS_JOURNAL_FORMAT;
  formatVersion: typeof EXTERNAL_APPLICATIONS_JOURNAL_FORMAT_VERSION;
  entries: ReadonlyArray<ExternalApplicationJournalEntry>;
}>;

export type ExternalApplicationsJournalDocumentParseResult =
  | { readonly ok: true; readonly value: ExternalApplicationsJournalDocumentV1 }
  | {
      readonly ok: false;
      readonly error: Readonly<{ readonly code: "invalid_shape" | "invalid_entry" }>;
    };

const EVENT_TYPES = new Set<string>([
  ...EXTERNAL_SERVICE_AUTOMATIC_EVENT_TYPES,
  "manual_run",
]);
const OUTCOMES = new Set<string>(EXTERNAL_APPLICATION_JOURNAL_OUTCOMES);
const OPEN_MODES = new Set<string>(EXTERNAL_APPLICATION_OPEN_MODES);

export function serializeExternalApplicationsJournalDocument(
  entries: ReadonlyArray<ExternalApplicationJournalEntry>,
): string {
  const document: ExternalApplicationsJournalDocumentV1 = {
    format: EXTERNAL_APPLICATIONS_JOURNAL_FORMAT,
    formatVersion: EXTERNAL_APPLICATIONS_JOURNAL_FORMAT_VERSION,
    entries: entries.slice(0, EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES),
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function parseExternalApplicationsJournalDocument(
  raw: unknown,
): ExternalApplicationsJournalDocumentParseResult {
  if (!isRecord(raw)) {
    return { ok: false, error: { code: "invalid_shape" } };
  }
  if (
    raw["format"] !== EXTERNAL_APPLICATIONS_JOURNAL_FORMAT ||
    raw["formatVersion"] !== EXTERNAL_APPLICATIONS_JOURNAL_FORMAT_VERSION ||
    !Array.isArray(raw["entries"])
  ) {
    return { ok: false, error: { code: "invalid_shape" } };
  }
  const entries: ExternalApplicationJournalEntry[] = [];
  for (const candidate of raw["entries"]) {
    const entry = parseEntry(candidate);
    if (entry === null) {
      return { ok: false, error: { code: "invalid_entry" } };
    }
    entries.push(entry);
  }
  return {
    ok: true,
    value: {
      format: EXTERNAL_APPLICATIONS_JOURNAL_FORMAT,
      formatVersion: EXTERNAL_APPLICATIONS_JOURNAL_FORMAT_VERSION,
      entries: entries.slice(0, EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES),
    },
  };
}

function parseEntry(value: unknown): ExternalApplicationJournalEntry | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = value["id"];
  const profileKey = value["profileKey"];
  const applicationId = value["applicationId"];
  const applicationName = value["applicationName"];
  const eventType = value["eventType"];
  const startedAt = value["startedAt"];
  const outcome = value["outcome"];
  const skipReason = value["skipReason"];
  const resolvedUrl = value["resolvedUrl"];
  const openMode = value["openMode"];
  const callId = value["callId"];
  const correlationId = value["correlationId"];
  if (
    typeof id !== "string" ||
    id.length === 0 ||
    typeof profileKey !== "string" ||
    profileKey.length === 0 ||
    typeof applicationId !== "string" ||
    !isExternalApplicationUuid(applicationId) ||
    typeof applicationName !== "string" ||
    typeof eventType !== "string" ||
    !EVENT_TYPES.has(eventType) ||
    typeof startedAt !== "string" ||
    typeof outcome !== "string" ||
    !OUTCOMES.has(outcome) ||
    (skipReason !== null && typeof skipReason !== "string") ||
    (resolvedUrl !== null && typeof resolvedUrl !== "string") ||
    typeof openMode !== "string" ||
    !OPEN_MODES.has(openMode) ||
    (callId !== null && typeof callId !== "string") ||
    typeof correlationId !== "string"
  ) {
    return null;
  }
  return Object.freeze({
    id,
    profileKey: profileKey as SettingsAccountKey,
    applicationId: applicationId as ExternalApplicationId,
    applicationName,
    eventType: eventType as ExternalServiceEventType,
    startedAt,
    outcome: outcome as ExternalApplicationJournalOutcome,
    skipReason,
    resolvedUrl,
    openMode: openMode as ExternalApplicationOpenMode,
    callId,
    correlationId: correlationId as CorrelationId,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
