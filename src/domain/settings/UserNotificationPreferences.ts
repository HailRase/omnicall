import {
  clampNotificationDurationMs,
  clampNotificationMaxVisible,
  DEFAULT_NOTIFICATION_CLOSABLE,
  DEFAULT_NOTIFICATION_DURATION_MS,
  DEFAULT_NOTIFICATION_MAX_VISIBLE,
  DEFAULT_NOTIFICATION_PLACEMENT,
  DEFAULT_NOTIFICATION_STACKING,
  MAX_NOTIFICATION_DURATION_MS,
  MAX_NOTIFICATION_MAX_VISIBLE,
  MIN_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_MAX_VISIBLE,
  parseNotificationPlacement,
  parseNotificationStacking,
  type NotificationPlacement,
  type NotificationStacking,
} from "./NotificationSettings.js";
import {
  createDefaultModulePreferencesMap,
  readUserNotificationModulePreferencesMap,
} from "./parseUserNotificationModulePreferences.js";
import type {
  ParseUserNotificationPreferencesResult,
  UserNotificationAppearancePreferences,
  UserNotificationPreferences,
  UserNotificationPreferencesParseMode,
} from "./userNotificationPreferencesTypes.js";

export type {
  NotificationRaiseWindowMode,
  ParseUserNotificationPreferencesResult,
  UserNotificationAppearancePreferences,
  UserNotificationModulePreferences,
  UserNotificationPreferences,
  UserNotificationPreferencesParseMode,
} from "./userNotificationPreferencesTypes.js";
export {
  DEFAULT_MODULE_PREFERENCES,
  NOTIFICATION_RAISE_WINDOW_MODES,
  USER_NOTIFICATION_LEVEL_RANK,
} from "./userNotificationPreferencesTypes.js";

/**
 * - Purpose: default Notification Center preferences (popup-on, all modules open).
 * - Inputs: none.
 * - Outputs: immutable preferences aggregate matching pre-F-034 toast defaults.
 */
export function createDefaultUserNotificationPreferences(): UserNotificationPreferences {
  return {
    masterInAppPopupEnabled: true,
    appearance: {
      placement: DEFAULT_NOTIFICATION_PLACEMENT,
      stacking: DEFAULT_NOTIFICATION_STACKING,
      durationMs: DEFAULT_NOTIFICATION_DURATION_MS,
      closable: DEFAULT_NOTIFICATION_CLOSABLE,
      maxVisible: DEFAULT_NOTIFICATION_MAX_VISIBLE,
    },
    modules: createDefaultModulePreferencesMap(),
  };
}

/**
 * - Purpose: narrow unknown nested preferences for settings schema / migration.
 * - Inputs: unknown JSON fragment; mode `strict` rejects unknown modules.
 * - Outputs: ok with preferences or structured validation errors.
 */
export function parseUserNotificationPreferences(
  value: unknown,
  mode: UserNotificationPreferencesParseMode = "strict",
): ParseUserNotificationPreferencesResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, errors: ["notificationPreferences_invalid"] };
  }

  const record = value as Record<string, unknown>;
  const errors: string[] = [];
  const defaults = createDefaultUserNotificationPreferences();
  const masterInAppPopupEnabled = readMasterPopupEnabled(record, errors, defaults);
  const appearance = readAppearance(record["appearance"], errors, defaults.appearance);
  const modules = readUserNotificationModulePreferencesMap(
    record["modules"],
    errors,
    mode,
  );

  if (mode === "strict" && errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      masterInAppPopupEnabled,
      appearance,
      modules,
    },
  };
}

function readMasterPopupEnabled(
  record: Record<string, unknown>,
  errors: string[],
  defaults: UserNotificationPreferences,
): boolean {
  const raw = record["masterInAppPopupEnabled"];
  if (raw === undefined) {
    return defaults.masterInAppPopupEnabled;
  }
  if (typeof raw !== "boolean") {
    errors.push("notificationPreferences.masterInAppPopupEnabled_invalid");
    return defaults.masterInAppPopupEnabled;
  }
  return raw;
}

function readAppearance(
  value: unknown,
  errors: string[],
  defaults: UserNotificationAppearancePreferences,
): UserNotificationAppearancePreferences {
  if (value === undefined) {
    return defaults;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push("notificationPreferences.appearance_invalid");
    return defaults;
  }
  const record = value as Record<string, unknown>;
  return {
    placement: readPlacement(record, errors, defaults.placement),
    stacking: readStacking(record, errors, defaults.stacking),
    durationMs: readDurationMs(record, errors, defaults.durationMs),
    closable: readClosable(record, errors, defaults.closable),
    maxVisible: readMaxVisible(record, errors, defaults.maxVisible),
  };
}

function readPlacement(
  record: Record<string, unknown>,
  errors: string[],
  defaultValue: NotificationPlacement,
): NotificationPlacement {
  const raw = record["placement"];
  if (raw === undefined) {
    return defaultValue;
  }
  const parsed = parseNotificationPlacement(raw);
  if (parsed === null) {
    errors.push("notificationPreferences.appearance.placement_invalid");
    return defaultValue;
  }
  return parsed;
}

function readStacking(
  record: Record<string, unknown>,
  errors: string[],
  defaultValue: NotificationStacking,
): NotificationStacking {
  const raw = record["stacking"];
  if (raw === undefined) {
    return defaultValue;
  }
  const parsed = parseNotificationStacking(raw);
  if (parsed === null) {
    errors.push("notificationPreferences.appearance.stacking_invalid");
    return defaultValue;
  }
  return parsed;
}

function readDurationMs(
  record: Record<string, unknown>,
  errors: string[],
  defaultValue: number,
): number {
  const raw = record["durationMs"];
  if (raw === undefined) {
    return defaultValue;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    errors.push("notificationPreferences.appearance.durationMs_invalid");
    return defaultValue;
  }
  if (raw < MIN_NOTIFICATION_DURATION_MS || raw > MAX_NOTIFICATION_DURATION_MS) {
    errors.push("notificationPreferences.appearance.durationMs_out_of_range");
    return clampNotificationDurationMs(raw);
  }
  return raw;
}

function readClosable(
  record: Record<string, unknown>,
  errors: string[],
  defaultValue: boolean,
): boolean {
  const raw = record["closable"];
  if (raw === undefined) {
    return defaultValue;
  }
  if (typeof raw !== "boolean") {
    errors.push("notificationPreferences.appearance.closable_invalid");
    return defaultValue;
  }
  return raw;
}

function readMaxVisible(
  record: Record<string, unknown>,
  errors: string[],
  defaultValue: number,
): number {
  const raw = record["maxVisible"];
  if (raw === undefined) {
    return defaultValue;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    errors.push("notificationPreferences.appearance.maxVisible_invalid");
    return defaultValue;
  }
  if (raw < MIN_NOTIFICATION_MAX_VISIBLE || raw > MAX_NOTIFICATION_MAX_VISIBLE) {
    errors.push("notificationPreferences.appearance.maxVisible_out_of_range");
    return clampNotificationMaxVisible(raw);
  }
  return raw;
}
