import type {
  NotificationPlacement,
  NotificationStacking,
} from "./NotificationSettings.js";
import type {
  UserNotificationLevel,
  UserNotificationModule,
} from "./UserNotificationJournalEntry.js";

export const NOTIFICATION_RAISE_WINDOW_MODES = ["never", "errors_only"] as const;

export type NotificationRaiseWindowMode =
  (typeof NOTIFICATION_RAISE_WINDOW_MODES)[number];

export const USER_NOTIFICATION_LEVEL_RANK: Readonly<
  Record<UserNotificationLevel, number>
> = {
  info: 0,
  success: 1,
  warning: 2,
  error: 3,
};

export type UserNotificationModulePreferences = Readonly<{
  enabled: boolean;
  minLevel: UserNotificationLevel;
  raiseWindow: NotificationRaiseWindowMode;
}>;

export type UserNotificationAppearancePreferences = Readonly<{
  placement: NotificationPlacement;
  stacking: NotificationStacking;
  durationMs: number;
  closable: boolean;
  maxVisible: number;
}>;

export type UserNotificationPreferences = Readonly<{
  masterInAppPopupEnabled: boolean;
  appearance: UserNotificationAppearancePreferences;
  modules: Readonly<Record<UserNotificationModule, UserNotificationModulePreferences>>;
}>;

export const DEFAULT_MODULE_PREFERENCES: UserNotificationModulePreferences = {
  enabled: true,
  minLevel: "info",
  raiseWindow: "never",
};

export type ParseUserNotificationPreferencesResult =
  | Readonly<{ ok: true; value: UserNotificationPreferences }>
  | Readonly<{ ok: false; errors: ReadonlyArray<string> }>;

export type UserNotificationPreferencesParseMode = "strict" | "migrate";
