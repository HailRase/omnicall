import {
  USER_NOTIFICATION_LEVELS,
  USER_NOTIFICATION_MODULES,
  type UserNotificationLevel,
  type UserNotificationModule,
} from "./UserNotificationJournalEntry.js";
import {
  DEFAULT_MODULE_PREFERENCES,
  NOTIFICATION_RAISE_WINDOW_MODES,
  type NotificationRaiseWindowMode,
  type UserNotificationModulePreferences,
  type UserNotificationPreferencesParseMode,
} from "./userNotificationPreferencesTypes.js";

/**
 * - Purpose: parse per-module preference map for Notification Center.
 * - Inputs: unknown modules fragment, error accumulator, parse mode.
 * - Outputs: catalog-complete module map; unknown keys rejected or stripped.
 */
export function readUserNotificationModulePreferencesMap(
  value: unknown,
  errors: string[],
  mode: UserNotificationPreferencesParseMode,
): Readonly<Record<UserNotificationModule, UserNotificationModulePreferences>> {
  const defaults = createDefaultModulePreferencesMap();
  if (value === undefined) {
    return defaults;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push("notificationPreferences.modules_invalid");
    return defaults;
  }

  const record = value as Record<string, unknown>;
  const catalog = USER_NOTIFICATION_MODULES as ReadonlyArray<string>;
  const result = { ...defaults };

  for (const key of Object.keys(record)) {
    if (!catalog.includes(key)) {
      if (mode === "strict") {
        errors.push(`notificationPreferences.modules.${key}_unknown`);
      }
      continue;
    }
    const module = key as UserNotificationModule;
    result[module] = readModulePreferences(record[key], module, errors);
  }

  return result;
}

export function createDefaultModulePreferencesMap(): Readonly<
  Record<UserNotificationModule, UserNotificationModulePreferences>
> {
  const modules = {} as Record<
    UserNotificationModule,
    UserNotificationModulePreferences
  >;
  for (const module of USER_NOTIFICATION_MODULES) {
    modules[module] = DEFAULT_MODULE_PREFERENCES;
  }
  return modules;
}

function readModulePreferences(
  value: unknown,
  module: UserNotificationModule,
  errors: string[],
): UserNotificationModulePreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push(`notificationPreferences.modules.${module}_invalid`);
    return DEFAULT_MODULE_PREFERENCES;
  }
  const record = value as Record<string, unknown>;
  const enabled = record["enabled"];
  if (enabled !== undefined && typeof enabled !== "boolean") {
    errors.push(`notificationPreferences.modules.${module}.enabled_invalid`);
  }
  const minLevel = record["minLevel"];
  const parsedMinLevel =
    minLevel === undefined
      ? DEFAULT_MODULE_PREFERENCES.minLevel
      : parseUserNotificationLevel(minLevel);
  if (minLevel !== undefined && parsedMinLevel === null) {
    errors.push(`notificationPreferences.modules.${module}.minLevel_invalid`);
  }
  const raiseWindow = record["raiseWindow"];
  const parsedRaise =
    raiseWindow === undefined
      ? DEFAULT_MODULE_PREFERENCES.raiseWindow
      : parseRaiseWindowMode(raiseWindow);
  if (raiseWindow !== undefined && parsedRaise === null) {
    errors.push(`notificationPreferences.modules.${module}.raiseWindow_invalid`);
  }
  return {
    enabled: typeof enabled === "boolean" ? enabled : DEFAULT_MODULE_PREFERENCES.enabled,
    minLevel: parsedMinLevel ?? DEFAULT_MODULE_PREFERENCES.minLevel,
    raiseWindow: parsedRaise ?? DEFAULT_MODULE_PREFERENCES.raiseWindow,
  };
}

function parseUserNotificationLevel(value: unknown): UserNotificationLevel | null {
  return typeof value === "string" &&
    (USER_NOTIFICATION_LEVELS as ReadonlyArray<string>).includes(value)
    ? (value as UserNotificationLevel)
    : null;
}

function parseRaiseWindowMode(value: unknown): NotificationRaiseWindowMode | null {
  return typeof value === "string" &&
    (NOTIFICATION_RAISE_WINDOW_MODES as ReadonlyArray<string>).includes(value)
    ? (value as NotificationRaiseWindowMode)
    : null;
}
