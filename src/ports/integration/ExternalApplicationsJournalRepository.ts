/**
 * - Purpose: persist safe per-profile External Applications open history.
 * - Inputs: profile keys and completed open-attempt journal entries.
 * - Outputs: newest-first immutable journal records capped by the adapter.
 */

import type {
  ExternalApplicationJournalEntry,
  SettingsAccountKey,
} from "@domain/index.js";

export const EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES = 100;

export interface ExternalApplicationsJournalRepository {
  list(
    profileKey: SettingsAccountKey,
    limit: number,
  ): Promise<ReadonlyArray<ExternalApplicationJournalEntry>>;
  append(
    profileKey: SettingsAccountKey,
    entry: ExternalApplicationJournalEntry,
  ): Promise<void>;
}
