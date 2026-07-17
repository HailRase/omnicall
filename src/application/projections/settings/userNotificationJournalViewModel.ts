import {
  USER_NOTIFICATION_MODULES,
  createSettingsAccountKey,
  createUserNotificationJournalEntryId,
  type SettingsAccountKey,
  type UserNotificationJournalEntry,
  type UserNotificationJournalEntryId,
  type UserNotificationModule,
} from "@domain/index.js";

export const USER_NOTIFICATION_MODULE_FILTERS = USER_NOTIFICATION_MODULES;
export type UserNotificationModuleFilter = UserNotificationModule;

export type UserNotificationJournalQueryViewInput = Readonly<{
  accountKey?: SettingsAccountKey;
  module?: UserNotificationModule;
  search?: string;
  page?: number;
  pageSize?: number;
}>;

export type UserNotificationJournalQueryView = Readonly<{
  entries: ReadonlyArray<UserNotificationJournalEntry>;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  identities: ReadonlyArray<
    Readonly<{ accountKey: SettingsAccountKey; displayLabel: string }>
  >;
}>;

export function createUserNotificationAccountFilter(
  value: string,
): SettingsAccountKey {
  return createSettingsAccountKey(value);
}

export function createUserNotificationEntryViewId(
  value: string,
): UserNotificationJournalEntryId {
  const id = createUserNotificationJournalEntryId(value);
  if (id === null) {
    throw new Error("notification_entry_id_required");
  }
  return id;
}
