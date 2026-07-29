/**
 * - Purpose: persist safe per-profile External Services dispatch history.
 * - Inputs: profile keys and already redacted, truncated journal entries.
 * - Outputs: newest-first immutable journal records capped by the adapter.
 */
import type { ExternalServiceJournalEntry, SettingsAccountKey } from "@domain/index.js";

export const EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES = 100;

export interface ExternalServicesJournalRepository {
  list(
    profileKey: SettingsAccountKey,
    limit: number,
  ): Promise<ReadonlyArray<ExternalServiceJournalEntry>>;
  append(
    profileKey: SettingsAccountKey,
    entry: ExternalServiceJournalEntry,
  ): Promise<void>;
}
