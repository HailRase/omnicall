import type { SettingsAccountKey } from "./SettingsAccountKey.js";
import type { NotificationSuppressReason } from "./userNotificationPresentationPolicy.js";

export const USER_NOTIFICATION_LEVELS = [
  "info",
  "success",
  "warning",
  "error",
] as const;

export type UserNotificationLevel = (typeof USER_NOTIFICATION_LEVELS)[number];

export const USER_NOTIFICATION_MODULES = [
  "system",
  "account",
  "telephony",
  "ocp",
  "settings",
  "contacts",
  "history",
  "headset",
  "media",
  "sdk",
  "updates",
  "externalServices",
  "externalApplications",
] as const;

export type UserNotificationModule = (typeof USER_NOTIFICATION_MODULES)[number];

export type UserNotificationJournalEntryId = string & {
  readonly __brand: "UserNotificationJournalEntryId";
};

export type UserNotificationTitleParam = string | number;

export type UserNotificationJournalEntry = Readonly<{
  id: UserNotificationJournalEntryId;
  emittedAt: string;
  accountKey: SettingsAccountKey;
  accountDisplayLabel: string;
  level: UserNotificationLevel;
  module: UserNotificationModule;
  functionId: string;
  titleKey: string | null;
  titleParams: Readonly<Record<string, UserNotificationTitleParam>>;
  titleSnapshot: string;
  suppressedAtEmission: boolean;
  /**
   * Structured presentation suppress reasons from capture policy.
   * Absent/empty on legacy journal rows loaded before this field existed.
   */
  suppressReasons: ReadonlyArray<NotificationSuppressReason>;
  correlationId: string | null;
}>;

export function createUserNotificationJournalEntryId(
  value: string,
): UserNotificationJournalEntryId | null {
  const normalized = value.trim();
  return normalized.length > 0
    ? (normalized as UserNotificationJournalEntryId)
    : null;
}
