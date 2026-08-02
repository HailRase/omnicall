import {
  clampNotificationDurationMs,
  clampNotificationMaxVisible,
  parseNotificationPlacement,
  parseNotificationStacking,
} from "./NotificationSettings.js";
import {
  createDefaultUserNotificationPreferences,
  parseUserNotificationPreferences,
  type UserNotificationPreferences,
} from "./UserNotificationPreferences.js";

/**
 * - Purpose: build preferences during settings migration from flat or nested fields.
 * - Inputs: raw settings record (schema ≤13 flat or nested fragment).
 * - Outputs: preferences with missing modules filled; unknown modules stripped.
 */
export function coerceUserNotificationPreferencesFromRecord(
  record: Record<string, unknown>,
): UserNotificationPreferences {
  const nested = record["notificationPreferences"];
  if (typeof nested === "object" && nested !== null && !Array.isArray(nested)) {
    const parsed = parseUserNotificationPreferences(nested, "migrate");
    if (parsed.ok) {
      return parsed.value;
    }
  }
  return createPreferencesFromFlatFields(record);
}

function createPreferencesFromFlatFields(
  record: Record<string, unknown>,
): UserNotificationPreferences {
  const defaults = createDefaultUserNotificationPreferences();
  const placement =
    parseNotificationPlacement(record["notificationPlacement"]) ??
    defaults.appearance.placement;
  const stacking =
    parseNotificationStacking(record["notificationStacking"]) ??
    defaults.appearance.stacking;
  const durationRaw = record["notificationDurationMs"];
  const durationMs =
    typeof durationRaw === "number" && Number.isInteger(durationRaw)
      ? clampNotificationDurationMs(durationRaw)
      : defaults.appearance.durationMs;
  const closable =
    typeof record["notificationClosable"] === "boolean"
      ? record["notificationClosable"]
      : defaults.appearance.closable;
  const maxVisibleRaw = record["notificationMaxVisible"];
  const maxVisible =
    typeof maxVisibleRaw === "number" && Number.isInteger(maxVisibleRaw)
      ? clampNotificationMaxVisible(maxVisibleRaw)
      : defaults.appearance.maxVisible;
  const masterInAppPopupEnabled =
    typeof record["notificationPopupEnabled"] === "boolean"
      ? record["notificationPopupEnabled"]
      : defaults.masterInAppPopupEnabled;

  return {
    masterInAppPopupEnabled,
    appearance: {
      placement,
      stacking,
      durationMs,
      closable,
      maxVisible,
    },
    modules: defaults.modules,
  };
}
