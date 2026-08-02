import { createDefaultUserNotificationPreferences } from "@application/index.js";

/**
 * - Purpose: story-safe Notification Center props for SettingsPanel mounts.
 * - Inputs: none.
 * - Outputs: default preferences + noop callbacks.
 */
export const settingsNotificationCenterStoryDefaults = {
  notificationPreferences: createDefaultUserNotificationPreferences(),
  onMasterInAppPopupEnabledChange: () => undefined,
  onNotificationModuleEnabledChange: () => undefined,
  onNotificationModuleMinLevelChange: () => undefined,
  onNotificationModuleRaiseWindowChange: () => undefined,
  onNotificationPreferencesPreset: () => undefined,
} as const;
