import {
  toUserNotificationAccountDisplayLabel,
  type SettingsAccountKey,
  type UserNotificationJournalEntry,
  type UserNotificationModule,
} from "@domain/index.js";
import type { UserNotificationJournalRepository } from "@ports/index.js";

export type QueryUserNotificationJournalInput = Readonly<{
  accountKey?: SettingsAccountKey;
  module?: UserNotificationModule;
  search?: string;
  page?: number;
  pageSize?: number;
  nowMs?: number;
}>;

export type QueryUserNotificationJournalOutcome = Readonly<{
  entries: ReadonlyArray<UserNotificationJournalEntry>;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  identities: ReadonlyArray<
    Readonly<{ accountKey: SettingsAccountKey; displayLabel: string }>
  >;
}>;

export class QueryUserNotificationJournalUseCase {
  constructor(private readonly repository: UserNotificationJournalRepository) {}

  async execute(
    input: QueryUserNotificationJournalInput = {},
  ): Promise<QueryUserNotificationJournalOutcome> {
    const entries = await this.repository.listEntries(input.nowMs);
    const search = input.search?.trim().toLocaleLowerCase() ?? "";
    const filtered = entries.filter(
      (entry) =>
        (input.accountKey === undefined ||
          entry.accountKey === input.accountKey) &&
        (input.module === undefined || entry.module === input.module) &&
        (search.length === 0 ||
          entry.titleSnapshot.toLocaleLowerCase().includes(search)),
    );
    const pageSize = clampInteger(input.pageSize ?? 20, 1, 100);
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = clampInteger(input.page ?? 1, 1, pageCount);
    const start = (page - 1) * pageSize;
    const identities = Array.from(
      new Map(
        entries.map((entry) => [
          entry.accountKey,
          {
            accountKey: entry.accountKey,
            displayLabel: toUserNotificationAccountDisplayLabel(
              entry.accountDisplayLabel,
            ),
          },
        ]),
      ).values(),
    ).sort((left, right) => left.displayLabel.localeCompare(right.displayLabel));
    return {
      entries: filtered.slice(start, start + pageSize).map((entry) => ({
        ...entry,
        accountDisplayLabel: toUserNotificationAccountDisplayLabel(
          entry.accountDisplayLabel,
        ),
      })),
      total: filtered.length,
      page,
      pageSize,
      pageCount,
      identities,
    };
  }
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}
