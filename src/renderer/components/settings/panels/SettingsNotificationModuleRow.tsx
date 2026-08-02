import clsx from "clsx";
import type { JSX } from "react";
import type {
  NotificationRaiseWindowMode,
  UserNotificationLevel,
  UserNotificationModule,
  UserNotificationModulePreferences,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Select, Switch, type SelectItemOption } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import {
  MIN_LEVEL_OPTION_LABEL_KEY,
  MODULE_DESCRIPTION_KEY,
  MODULE_LABEL_KEY,
  NOTIFICATION_RAISE_WINDOW_MODES,
  RAISE_WINDOW_LABEL_KEY,
  USER_NOTIFICATION_LEVELS,
} from "./notificationPreferencesUi.js";
import styles from "./SettingsNotificationCenterPanel.module.css";

export type SettingsNotificationModuleRowProps = Readonly<{
  module: UserNotificationModule;
  preferences: UserNotificationModulePreferences;
  onEnabledChange: (enabled: boolean) => void;
  onMinLevelChange: (minLevel: UserNotificationLevel) => void;
  onRaiseWindowChange: (raiseWindow: NotificationRaiseWindowMode) => void;
}>;

/**
 * - Purpose: present one Notification Center module preference row.
 * - Inputs: module id, prefs, enable/minLevel/raise callbacks.
 * - Outputs: accessible switch + compact threshold/raise selects.
 */
export function SettingsNotificationModuleRow({
  module,
  preferences,
  onEnabledChange,
  onMinLevelChange,
  onRaiseWindowChange,
}: SettingsNotificationModuleRowProps): JSX.Element {
  const { t } = useI18n();
  const enabledId = `settings-notification-module-${module}-enabled`;
  const minLevelId = `settings-notification-module-${module}-min-level`;
  const raiseId = `settings-notification-module-${module}-raise`;
  const minLevelHintId = `${minLevelId}-hint`;
  const levelItems: ReadonlyArray<SelectItemOption> = USER_NOTIFICATION_LEVELS.map(
    (level) => ({
      value: level,
      label: t(MIN_LEVEL_OPTION_LABEL_KEY[level]),
    }),
  );
  const raiseItems: ReadonlyArray<SelectItemOption> =
    NOTIFICATION_RAISE_WINDOW_MODES.map((mode) => ({
      value: mode,
      label: t(RAISE_WINDOW_LABEL_KEY[mode]),
    }));

  function handleMinLevelChange(value: string): void {
    if (
      value === "info" ||
      value === "success" ||
      value === "warning" ||
      value === "error"
    ) {
      onMinLevelChange(value);
    }
  }

  function handleRaiseWindowChange(value: string): void {
    if (value === "never" || value === "errors_only") {
      onRaiseWindowChange(value);
    }
  }

  return (
    <div
      className={styles.moduleRow}
      data-testid={`settings-notification-module-${module}`}
    >
      <div className={styles.moduleHeader}>
        <div className={styles.moduleText}>
          <p className={styles.moduleTitle}>{t(MODULE_LABEL_KEY[module])}</p>
          <p className={styles.moduleDescription}>
            {t(MODULE_DESCRIPTION_KEY[module])}
          </p>
        </div>
        <Switch
          id={enabledId}
          checked={preferences.enabled}
          aria-label={t("settings.notifications.preferences.moduleEnabledAria", {
            module: t(MODULE_LABEL_KEY[module]),
          })}
          data-testid={`settings-notification-module-${module}-enabled`}
          onCheckedChange={onEnabledChange}
        />
      </div>
      <div
        className={clsx(
          styles.moduleControls,
          !preferences.enabled && formStyles.settingBlockDisabled,
        )}
      >
        <div className={styles.controlField}>
          <label className={formStyles.fieldLabelGroup} htmlFor={minLevelId}>
            <span className={formStyles.fieldLabel}>
              {t("settings.notifications.preferences.minLevel.label")}
            </span>
            {preferences.enabled ? (
              <span className={formStyles.fieldDescription} id={minLevelHintId}>
                {t("settings.notifications.preferences.minLevel.description")}
              </span>
            ) : (
              <span className={formStyles.fieldDescription}>
                {t("settings.notifications.preferences.moduleDisabledReason")}
              </span>
            )}
          </label>
          <Select
            id={minLevelId}
            size="sm"
            value={preferences.minLevel}
            items={levelItems}
            disabled={!preferences.enabled}
            data-testid={`settings-notification-module-${module}-min-level`}
            aria-label={t("settings.notifications.preferences.minLevel.label")}
            {...(preferences.enabled
              ? { "aria-describedby": minLevelHintId }
              : {})}
            onValueChange={handleMinLevelChange}
          />
        </div>
        <div className={styles.controlField}>
          <label className={formStyles.fieldLabelGroup} htmlFor={raiseId}>
            <span className={formStyles.fieldLabel}>
              {t("settings.notifications.preferences.raise.label")}
            </span>
            <span className={formStyles.fieldDescription}>
              {t("settings.notifications.preferences.raise.description")}
            </span>
          </label>
          <Select
            id={raiseId}
            size="sm"
            value={preferences.raiseWindow}
            items={raiseItems}
            disabled={!preferences.enabled}
            data-testid={`settings-notification-module-${module}-raise`}
            aria-label={t("settings.notifications.preferences.raise.label")}
            onValueChange={handleRaiseWindowChange}
          />
        </div>
      </div>
    </div>
  );
}
