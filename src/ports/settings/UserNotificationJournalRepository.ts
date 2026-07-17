import type { UserNotificationJournalEntry } from "@domain/index.js";

export interface UserNotificationJournalRepository {
  listEntries(nowMs?: number): Promise<ReadonlyArray<UserNotificationJournalEntry>>;
  appendEntry(
    entry: UserNotificationJournalEntry,
    nowMs?: number,
  ): Promise<void>;
  clearEntries(): Promise<void>;
}
