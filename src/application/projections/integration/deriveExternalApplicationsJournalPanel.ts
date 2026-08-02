/**
 * - Purpose: project External Applications journal entries into UI view-models.
 * - Inputs: domain journal entries and load state.
 * - Outputs: renderer-safe panel VM without Domain imports in components.
 */

import type { ExternalApplicationJournalEntry } from "@domain/index.js";

export type ExternalApplicationsJournalEntryVm = Readonly<{
  id: string;
  applicationId: string;
  applicationName: string;
  eventType: string;
  startedAt: string;
  outcome:
    | "opened"
    | "focused_existing"
    | "skipped_condition"
    | "skipped_invalid_url"
    | "skipped_lifecycle"
    | "failed";
  skipReason: string | null;
  resolvedUrl: string | null;
  openMode: "electron_window" | "external_browser";
  callId: string | null;
}>;

export type ExternalApplicationsJournalPanelVm = Readonly<{
  loadState: "loading" | "ready" | "error";
  entries: ReadonlyArray<ExternalApplicationsJournalEntryVm>;
}>;

export function toExternalApplicationsJournalEntryVm(
  entry: ExternalApplicationJournalEntry,
): ExternalApplicationsJournalEntryVm {
  return {
    id: entry.id,
    applicationId: entry.applicationId,
    applicationName: entry.applicationName,
    eventType: entry.eventType,
    startedAt: entry.startedAt,
    outcome: entry.outcome,
    skipReason: entry.skipReason,
    resolvedUrl: entry.resolvedUrl,
    openMode: entry.openMode,
    callId: entry.callId,
  };
}

export function deriveExternalApplicationsJournalPanel(
  loadState: ExternalApplicationsJournalPanelVm["loadState"],
  entries: ReadonlyArray<ExternalApplicationJournalEntry>,
): ExternalApplicationsJournalPanelVm {
  return {
    loadState,
    entries: entries.map(toExternalApplicationsJournalEntryVm),
  };
}
