/**
 * - Purpose: retain External Applications journal records in test memory.
 * - Inputs: profile-scoped open-history entries and list limits.
 * - Outputs: newest-first records capped to the latest one hundred per profile.
 */

import type {
  ExternalApplicationJournalEntry,
  SettingsAccountKey,
} from "@domain/index.js";
import type { ExternalApplicationsJournalRepository } from "@ports/integration/ExternalApplicationsJournalRepository.js";
import { EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES } from "@ports/integration/ExternalApplicationsJournalRepository.js";

function copyEntry(
  entry: ExternalApplicationJournalEntry,
): ExternalApplicationJournalEntry {
  return { ...entry };
}

export class InMemoryExternalApplicationsJournalRepository
  implements ExternalApplicationsJournalRepository
{
  private readonly entriesByProfile = new Map<
    SettingsAccountKey,
    ExternalApplicationJournalEntry[]
  >();

  list(
    profileKey: SettingsAccountKey,
    limit: number,
  ): Promise<ReadonlyArray<ExternalApplicationJournalEntry>> {
    if (!Number.isSafeInteger(limit) || limit < 0) {
      return Promise.reject(new Error("Journal list limit must be a non-negative integer."));
    }
    const entries = this.entriesByProfile.get(profileKey) ?? [];
    return Promise.resolve(entries.slice(0, limit).map(copyEntry));
  }

  append(
    profileKey: SettingsAccountKey,
    entry: ExternalApplicationJournalEntry,
  ): Promise<void> {
    if (entry.profileKey !== profileKey) {
      return Promise.reject(
        new Error("External Applications journal profile key must match its bucket."),
      );
    }
    const existingEntries = this.entriesByProfile.get(profileKey) ?? [];
    const nextEntries = [
      copyEntry(entry),
      ...existingEntries.filter((candidate) => candidate.id !== entry.id),
    ].slice(0, EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES);
    this.entriesByProfile.set(profileKey, nextEntries);
    return Promise.resolve();
  }

  replaceEntries(
    profileKey: SettingsAccountKey,
    entries: ReadonlyArray<ExternalApplicationJournalEntry>,
  ): void {
    this.entriesByProfile.set(
      profileKey,
      entries.slice(0, EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES).map(copyEntry),
    );
  }
}
