/**
 * - Purpose: map External Services journal query facts to UI-safe view models.
 * - Inputs: query journal rows and load/error status without Domain branded types.
 * - Outputs: newest-first capped entries with already-redacted diagnostics for Settings.
 */

import type { ExternalServiceJournalEntry } from "@domain/index.js";
import type { QueryExternalServicesOutcome } from "../../use-cases/integration/QueryExternalServicesUseCase.js";

export const EXTERNAL_SERVICES_JOURNAL_UI_LIMIT = 100;

export type ExternalServicesJournalLoadState =
  | "loading"
  | "ready"
  | "error"
  | "unavailable";

export type ExternalServicesJournalHeaderVm = Readonly<{
  id: string;
  key: string;
  value: string;
}>;

export type ExternalServicesJournalOutcomeVm =
  | "http_success"
  | "http_error"
  | "network_error"
  | "timeout"
  | "aborted";

export type ExternalServicesJournalEntryVm = Readonly<{
  id: string;
  startedAt: string;
  collectionName: string;
  requestName: string;
  method: string;
  eventType: string;
  outcome: ExternalServicesJournalOutcomeVm;
  status: number | null;
  durationMs: number;
  requestUrl: string;
  requestHeaders: ReadonlyArray<ExternalServicesJournalHeaderVm>;
  requestBody: string;
  requestBodyTruncated: boolean;
  responseBody: string;
  responseBodyTruncated: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}>;

export type ExternalServicesJournalPanelVm = Readonly<{
  loadState: ExternalServicesJournalLoadState;
  entries: ReadonlyArray<ExternalServicesJournalEntryVm>;
  capped: boolean;
}>;

export function deriveExternalServicesJournalPanel(
  journal: ReadonlyArray<ExternalServiceJournalEntry> | null,
  loadState: ExternalServicesJournalLoadState,
): ExternalServicesJournalPanelVm {
  if (journal === null) {
    return {
      loadState,
      entries: [],
      capped: false,
    };
  }

  const entries = journal
    .slice(0, EXTERNAL_SERVICES_JOURNAL_UI_LIMIT)
    .map(toJournalEntryVm);

  return {
    loadState: loadState === "loading" ? "ready" : loadState,
    entries,
    capped: journal.length >= EXTERNAL_SERVICES_JOURNAL_UI_LIMIT,
  };
}

export function deriveExternalServicesJournalFromOutcome(
  outcome: QueryExternalServicesOutcome | null,
  loadState: ExternalServicesJournalLoadState,
): ExternalServicesJournalPanelVm {
  if (outcome === null) {
    return deriveExternalServicesJournalPanel(null, loadState);
  }
  return deriveExternalServicesJournalPanel(outcome.journal, loadState);
}

function toJournalEntryVm(
  entry: ExternalServiceJournalEntry,
): ExternalServicesJournalEntryVm {
  return {
    id: entry.id,
    startedAt: entry.startedAt,
    collectionName: entry.collectionName,
    requestName: entry.requestName,
    method: entry.method,
    eventType: entry.eventType,
    outcome: entry.outcome,
    status: entry.status,
    durationMs: entry.durationMs,
    requestUrl: entry.requestUrl,
    requestHeaders: entry.requestHeaders.map((header) => ({
      id: header.id,
      key: header.key,
      value: header.value,
    })),
    requestBody: entry.requestBody,
    requestBodyTruncated: entry.requestBodyTruncated,
    responseBody: entry.responseBody,
    responseBodyTruncated: entry.responseBodyTruncated,
    errorCode: entry.errorCode,
    errorMessage: entry.errorMessage,
  };
}
