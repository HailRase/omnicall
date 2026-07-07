import type { CallHistoryEntry, CallHistoryEntryId } from "@domain/index.js";

export interface CallHistoryRepository {
  listEntries(): Promise<ReadonlyArray<CallHistoryEntry>>;
  appendEntry(entry: CallHistoryEntry): Promise<void>;
  getEntryById(entryId: CallHistoryEntryId): Promise<CallHistoryEntry | null>;
}
