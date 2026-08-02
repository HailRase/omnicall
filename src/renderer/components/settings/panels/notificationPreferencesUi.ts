import {
  createDefaultUserNotificationPreferences,
  DEFAULT_MODULE_PREFERENCES,
  NOTIFICATION_RAISE_WINDOW_MODES,
  USER_NOTIFICATION_LEVELS,
  USER_NOTIFICATION_MODULES,
  type NotificationRaiseWindowMode,
  type UserNotificationLevel,
  type UserNotificationModule,
  type UserNotificationModulePreferences,
  type UserNotificationPreferences,
} from "@application/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";

export type NotificationPreferencesPresetId = "default" | "quietSuccesses";

export const NOTIFICATION_CENTER_TAB_IDS = [
  "preferences",
  "appearance",
  "history",
] as const;

export type NotificationCenterTabId = (typeof NOTIFICATION_CENTER_TAB_IDS)[number];

export const MODULE_LABEL_KEY: Readonly<
  Record<UserNotificationModule, TranslationKey>
> = {
  system: "settings.notifications.module.system",
  account: "settings.notifications.module.account",
  telephony: "settings.notifications.module.telephony",
  ocp: "settings.notifications.module.ocp",
  settings: "settings.notifications.module.settings",
  contacts: "settings.notifications.module.contacts",
  history: "settings.notifications.module.history",
  headset: "settings.notifications.module.headset",
  media: "settings.notifications.module.media",
  sdk: "settings.notifications.module.sdk",
  updates: "settings.notifications.module.updates",
  externalServices: "settings.notifications.module.externalServices",
};

export const MODULE_DESCRIPTION_KEY: Readonly<
  Record<UserNotificationModule, TranslationKey>
> = {
  system: "settings.notifications.module.system.description",
  account: "settings.notifications.module.account.description",
  telephony: "settings.notifications.module.telephony.description",
  ocp: "settings.notifications.module.ocp.description",
  settings: "settings.notifications.module.settings.description",
  contacts: "settings.notifications.module.contacts.description",
  history: "settings.notifications.module.history.description",
  headset: "settings.notifications.module.headset.description",
  media: "settings.notifications.module.media.description",
  sdk: "settings.notifications.module.sdk.description",
  updates: "settings.notifications.module.updates.description",
  externalServices: "settings.notifications.module.externalServices.description",
};

/**
 * Preferences select options: threshold copy (“this severity and above”),
 * not raw level names. Domain value remains `minLevel`.
 */
export const MIN_LEVEL_OPTION_LABEL_KEY: Readonly<
  Record<UserNotificationLevel, TranslationKey>
> = {
  info: "settings.notifications.preferences.minLevel.option.all",
  success: "settings.notifications.preferences.minLevel.option.successAndAbove",
  warning: "settings.notifications.preferences.minLevel.option.warningsAndErrors",
  error: "settings.notifications.preferences.minLevel.option.errorsOnly",
};

export const RAISE_WINDOW_LABEL_KEY: Readonly<
  Record<NotificationRaiseWindowMode, TranslationKey>
> = {
  never: "settings.notifications.preferences.raise.never",
  errors_only: "settings.notifications.preferences.raise.errorsOnly",
};

/**
 * - Purpose: build preference modules for a named UI preset.
 * - Inputs: preset id.
 * - Outputs: immutable module map for persistence.
 */
export function createNotificationModulesForPreset(
  preset: NotificationPreferencesPresetId,
): Readonly<Record<UserNotificationModule, UserNotificationModulePreferences>> {
  if (preset === "quietSuccesses") {
    const quiet: UserNotificationModulePreferences = {
      ...DEFAULT_MODULE_PREFERENCES,
      minLevel: "warning",
    };
    const modules = {} as Record<
      UserNotificationModule,
      UserNotificationModulePreferences
    >;
    for (const module of USER_NOTIFICATION_MODULES) {
      modules[module] = quiet;
    }
    return modules;
  }

  return createDefaultUserNotificationPreferences().modules;
}

/**
 * - Purpose: apply a Preferences UI preset onto current preferences.
 * - Inputs: current prefs and preset id.
 * - Outputs: next preferences with appearance preserved.
 */
export function applyNotificationPreferencesPreset(
  current: UserNotificationPreferences,
  preset: NotificationPreferencesPresetId,
): UserNotificationPreferences {
  if (preset === "default") {
    const defaults = createDefaultUserNotificationPreferences();
    return {
      masterInAppPopupEnabled: defaults.masterInAppPopupEnabled,
      appearance: current.appearance,
      modules: defaults.modules,
    };
  }

  return {
    ...current,
    modules: createNotificationModulesForPreset(preset),
  };
}

export {
  NOTIFICATION_RAISE_WINDOW_MODES,
  USER_NOTIFICATION_LEVELS,
  USER_NOTIFICATION_MODULES,
};
