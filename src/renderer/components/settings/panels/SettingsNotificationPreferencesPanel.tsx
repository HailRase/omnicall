import type { JSX } from "react";
import type {
  NotificationRaiseWindowMode,
  UserNotificationLevel,
  UserNotificationModule,
  UserNotificationPreferences,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import {
  USER_NOTIFICATION_MODULES,
  type NotificationPreferencesPresetId,
} from "./notificationPreferencesUi.js";
import { SettingsNotificationModuleRow } from "./SettingsNotificationModuleRow.js";
import styles from "./SettingsNotificationCenterPanel.module.css";

export type SettingsNotificationPreferencesPanelProps = Readonly<{
  preferences: UserNotificationPreferences;
  onMasterInAppPopupEnabledChange: (enabled: boolean) => void;
  onModuleEnabledChange: (
    module: UserNotificationModule,
    enabled: boolean,
  ) => void;
  onModuleMinLevelChange: (
    module: UserNotificationModule,
    minLevel: UserNotificationLevel,
  ) => void;
  onModuleRaiseWindowChange: (
    module: UserNotificationModule,
    raiseWindow: NotificationRaiseWindowMode,
  ) => void;
  onApplyPreset: (preset: NotificationPreferencesPresetId) => void;
}>;

/**
 * - Purpose: present Notification Center master + per-module preference controls.
 * - Inputs: current preferences aggregate and save callbacks.
 * - Outputs: accessible form without capture/policy logic.
 */
export function SettingsNotificationPreferencesPanel({
  preferences,
  onMasterInAppPopupEnabledChange,
  onModuleEnabledChange,
  onModuleMinLevelChange,
  onModuleRaiseWindowChange,
  onApplyPreset,
}: SettingsNotificationPreferencesPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div
      className={formStyles.panelStack}
      data-testid="settings-notification-preferences"
    >
      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.notifications.preferences.master.legend")}
        </legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <label
              className={formStyles.toggleRow}
              htmlFor="settings-notification-master-popup"
            >
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.notifications.preferences.master.label")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.notifications.preferences.master.description")}
                </span>
              </span>
              <Switch
                id="settings-notification-master-popup"
                checked={preferences.masterInAppPopupEnabled}
                data-testid="settings-notification-master-popup"
                onCheckedChange={onMasterInAppPopupEnabledChange}
              />
            </label>
            {!preferences.masterInAppPopupEnabled ? (
              <p
                className={formStyles.blockHint}
                data-testid="settings-notification-master-off-hint"
              >
                {t("settings.notifications.preferences.masterOffHint")}
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.notifications.preferences.modules.legend")}
        </legend>
        <div
          className={styles.presetRow}
          role="group"
          aria-label={t("settings.notifications.preferences.presetsAria")}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="settings-notification-preset-default"
            onClick={() => {
              onApplyPreset("default");
            }}
          >
            {t("settings.notifications.preferences.preset.default")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="settings-notification-preset-quiet-successes"
            onClick={() => {
              onApplyPreset("quietSuccesses");
            }}
          >
            {t("settings.notifications.preferences.preset.quietSuccesses")}
          </Button>
        </div>
        <div className={formStyles.settingsGroup}>
          {USER_NOTIFICATION_MODULES.map((module) => (
            <SettingsNotificationModuleRow
              key={module}
              module={module}
              preferences={preferences.modules[module]}
              onEnabledChange={(enabled) => {
                onModuleEnabledChange(module, enabled);
              }}
              onMinLevelChange={(minLevel) => {
                onModuleMinLevelChange(module, minLevel);
              }}
              onRaiseWindowChange={(raiseWindow) => {
                onModuleRaiseWindowChange(module, raiseWindow);
              }}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
