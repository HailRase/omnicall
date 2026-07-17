import {
  retainUserNotificationJournalEntries,
  type UserNotificationJournalEntry,
} from "@domain/index.js";
import type { UserNotificationJournalRepository } from "@ports/settings/UserNotificationJournalRepository.js";

export class InMemoryUserNotificationJournalRepository
  implements UserNotificationJournalRepository
{
  private entries: UserNotificationJournalEntry[] = [];

  listEntries(nowMs: number = Date.now()): Promise<
    ReadonlyArray<UserNotificationJournalEntry>
  > {
    this.entries = [...retainUserNotificationJournalEntries(this.entries, nowMs)];
    return Promise.resolve([...this.entries]);
  }

  appendEntry(
    entry: UserNotificationJournalEntry,
    nowMs: number = Date.now(),
  ): Promise<void> {
    this.entries = [
      ...retainUserNotificationJournalEntries(
        [entry, ...this.entries.filter((candidate) => candidate.id !== entry.id)],
        nowMs,
      ),
    ];
    return Promise.resolve();
  }

  clearEntries(): Promise<void> {
    this.entries = [];
    return Promise.resolve();
  }

  replaceEntries(entries: ReadonlyArray<UserNotificationJournalEntry>): void {
    this.entries = [...entries];
  }
}
