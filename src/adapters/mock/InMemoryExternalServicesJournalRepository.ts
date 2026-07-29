/**
 * - Purpose: retain safe External Services journal records in isolated test memory.
 * - Inputs: profile-scoped, redacted dispatch entries and list limits.
 * - Outputs: newest-first records capped to the latest one hundred per profile.
 */
import type { ExternalServiceJournalEntry } from "@domain/index.js";
import type {
  ExternalServicesJournalRepository,
} from "@ports/integration/ExternalServicesJournalRepository.js";
import { EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES } from "@ports/integration/ExternalServicesJournalRepository.js";
import type { SettingsAccountKey } from "@domain/index.js";

const PROTECTED_HEADER_NAMES = new Set(["authorization", "cookie", "x-api-key"]);

function copyEntry(entry: ExternalServiceJournalEntry): ExternalServiceJournalEntry {
  return {
    ...entry,
    requestHeaders: entry.requestHeaders.map((header) => ({ ...header })),
  };
}

function assertSafeJournalEntry(
  profileKey: SettingsAccountKey,
  entry: ExternalServiceJournalEntry,
): void {
  if (entry.profileKey !== profileKey) {
    throw new Error("External Services journal profile key must match its bucket.");
  }

  const hasUnredactedProtectedHeader = entry.requestHeaders.some(
    (header) =>
      PROTECTED_HEADER_NAMES.has(header.key.trim().toLowerCase()) &&
      header.value !== "***",
  );
  if (hasUnredactedProtectedHeader) {
    throw new Error("External Services journal entries must redact protected headers.");
  }
}

export class InMemoryExternalServicesJournalRepository
  implements ExternalServicesJournalRepository
{
  private readonly entriesByProfile = new Map<
    SettingsAccountKey,
    ExternalServiceJournalEntry[]
  >();

  list(
    profileKey: SettingsAccountKey,
    limit: number,
  ): Promise<ReadonlyArray<ExternalServiceJournalEntry>> {
    if (!Number.isSafeInteger(limit) || limit < 0) {
      return Promise.reject(new Error("Journal list limit must be a non-negative integer."));
    }

    const entries = this.entriesByProfile.get(profileKey) ?? [];
    return Promise.resolve(entries.slice(0, limit).map(copyEntry));
  }

  append(
    profileKey: SettingsAccountKey,
    entry: ExternalServiceJournalEntry,
  ): Promise<void> {
    try {
      assertSafeJournalEntry(profileKey, entry);
    } catch (error: unknown) {
      return Promise.reject(
        error instanceof Error
          ? error
          : new Error("External Services journal entry validation failed."),
      );
    }
    const existingEntries = this.entriesByProfile.get(profileKey) ?? [];
    const nextEntries = [
      copyEntry(entry),
      ...existingEntries.filter((candidate) => candidate.id !== entry.id),
    ].slice(0, EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES);
    this.entriesByProfile.set(profileKey, nextEntries);
    return Promise.resolve();
  }

  replaceEntries(
    profileKey: SettingsAccountKey,
    entries: ReadonlyArray<ExternalServiceJournalEntry>,
  ): void {
    this.entriesByProfile.set(
      profileKey,
      entries
        .slice(0, EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES)
        .map(copyEntry),
    );
  }
}
