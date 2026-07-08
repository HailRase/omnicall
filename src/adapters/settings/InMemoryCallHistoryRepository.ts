import type { CallHistoryEntry, CallHistoryEntryId } from "@domain/index.js";
import { MAX_CALL_HISTORY_ENTRIES } from "@domain/index.js";
import type { CallHistoryRepository } from "@ports/settings/CallHistoryRepository.js";

/**
 * - Purpose: in-memory call history store for tests and mock bootstrap.
 * - Inputs: append/list/get operations on CallHistoryEntry records.
 * - Outputs: CallHistoryRepository with LF-054 retention enforcement.
 */
export class InMemoryCallHistoryRepository implements CallHistoryRepository {
  private readonly entries: CallHistoryEntry[] = [];

  listEntries(): Promise<ReadonlyArray<CallHistoryEntry>> {
    return Promise.resolve([...this.entries]);
  }

  appendEntry(entry: CallHistoryEntry): Promise<void> {
    const existingIndex = this.entries.findIndex(
      (candidate) => candidate.id === entry.id || candidate.callId === entry.callId,
    );
    if (existingIndex >= 0) {
      this.entries.splice(existingIndex, 1);
    }

    this.entries.unshift(entry);
    if (this.entries.length > MAX_CALL_HISTORY_ENTRIES) {
      this.entries.length = MAX_CALL_HISTORY_ENTRIES;
    }

    return Promise.resolve();
  }

  getEntryById(entryId: CallHistoryEntryId): Promise<CallHistoryEntry | null> {
    const match = this.entries.find((entry) => entry.id === entryId);
    return Promise.resolve(match ?? null);
  }

  deleteEntry(entryId: CallHistoryEntryId): Promise<boolean> {
    const index = this.entries.findIndex((entry) => entry.id === entryId);
    if (index < 0) {
      return Promise.resolve(false);
    }

    this.entries.splice(index, 1);
    return Promise.resolve(true);
  }

  /** Replaces all entries — used when hydrating from disk parse result. */
  replaceEntries(entries: ReadonlyArray<CallHistoryEntry>): void {
    this.entries.length = 0;
    for (const entry of entries) {
      this.entries.push(entry);
    }
    if (this.entries.length > MAX_CALL_HISTORY_ENTRIES) {
      this.entries.length = MAX_CALL_HISTORY_ENTRIES;
    }
  }
}
