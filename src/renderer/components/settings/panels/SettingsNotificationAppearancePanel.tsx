import clsx from "clsx";
import type { JSX } from "react";
import {
  MAX_NOTIFICATION_DURATION_MS,
  MAX_NOTIFICATION_MAX_VISIBLE,
  MIN_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_MAX_VISIBLE,
  NOTIFICATION_PLACEMENTS,
  NOTIFICATION_STACKING_MODES,
  type NotificationPlacement,
  type NotificationStacking,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import { SettingsNumberInput } from "../SettingsNumberInput.js";
import { Button, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsNotificationAppearancePanelProps = Readonly<{
  notificationPlacement: NotificationPlacement;
  onNotificationPlacementChange: (placement: NotificationPlacement) => void;
  notificationStacking: NotificationStacking;
  onNotificationStackingChange: (stacking: NotificationStacking) => void;
  notificationDurationMs: number;
  onNotificationDurationMsChange: (durationMs: number) => void;
  notificationMaxVisible: number;
  onNotificationMaxVisibleChange: (maxVisible: number) => void;
  notificationClosable: boolean;
  onNotificationClosableChange: (closable: boolean) => void;
}>;

const PLACEMENT_LABELS: Readonly<Record<NotificationPlacement, TranslationKey>> = {
  "bottom-right": "settings.general.notifications.placement.bottomRight",
  "bottom-left": "settings.general.notifications.placement.bottomLeft",
  "top-right": "settings.general.notifications.placement.topRight",
  "top-left": "settings.general.notifications.placement.topLeft",
};

const STACKING_LABELS: Readonly<Record<NotificationStacking, TranslationKey>> = {
  stacked: "settings.general.notifications.stacking.stacked",
  single: "settings.general.notifications.stacking.single",
};

/**
 * - Purpose: present toast chrome appearance controls in Notification Center.
 * - Inputs: placement, stacking, duration, maxVisible with change callbacks.
 * - Outputs: accessible form fields without capture or facade access.
 * @uiMeta lf=LF-060 f=F-034
 */
export function SettingsNotificationAppearancePanel({
  notificationPlacement,
  onNotificationPlacementChange,
  notificationStacking,
  onNotificationStackingChange,
  notificationDurationMs,
  onNotificationDurationMsChange,
  notificationMaxVisible,
  onNotificationMaxVisibleChange,
  notificationClosable,
  onNotificationClosableChange,
}: SettingsNotificationAppearancePanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div
      className={formStyles.panelStack}
      data-testid="settings-notification-appearance"
    >
      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.notifications.appearance.legend")}
        </legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <span className={formStyles.fieldLabel} id="settings-notification-placement-label">
              {t("settings.general.notifications.placement.label")}
            </span>
            <div
              className={formStyles.segmentedControl}
              role="radiogroup"
              aria-labelledby="settings-notification-placement-label"
              data-testid="settings-notification-placement-control"
            >
              {NOTIFICATION_PLACEMENTS.map((placement) => {
                const selected = placement === notificationPlacement;
                return (
                  <Button
                    key={placement}
                    variant="ghost"
                    size="sm"
                    role="radio"
                    aria-checked={selected}
                    className={clsx(
                      formStyles.segmentOption,
                      selected && formStyles.segmentOptionSelected,
                    )}
                    data-testid={`settings-notification-placement-${placement}`}
                    onClick={() => {
                      onNotificationPlacementChange(placement);
                    }}
                  >
                    {t(PLACEMENT_LABELS[placement])}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className={formStyles.settingBlock}>
            <span className={formStyles.fieldLabel} id="settings-notification-stacking-label">
              {t("settings.general.notifications.stacking.label")}
            </span>
            <div
              className={formStyles.segmentedControl}
              role="radiogroup"
              aria-labelledby="settings-notification-stacking-label"
              data-testid="settings-notification-stacking-control"
            >
              {NOTIFICATION_STACKING_MODES.map((stacking) => {
                const selected = stacking === notificationStacking;
                return (
                  <Button
                    key={stacking}
                    variant="ghost"
                    size="sm"
                    role="radio"
                    aria-checked={selected}
                    className={clsx(
                      formStyles.segmentOption,
                      selected && formStyles.segmentOptionSelected,
                    )}
                    data-testid={`settings-notification-stacking-${stacking}`}
                    onClick={() => {
                      onNotificationStackingChange(stacking);
                    }}
                  >
                    {t(STACKING_LABELS[stacking])}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className={formStyles.settingBlock}>
            <div className={formStyles.fieldRow}>
              <label className={formStyles.fieldLabelGroup} htmlFor="settings-notification-duration">
                <span className={formStyles.fieldLabel}>
                  {t("settings.general.notifications.duration.label")}
                </span>
              </label>
              <SettingsNumberInput
                id="settings-notification-duration"
                min={MIN_NOTIFICATION_DURATION_MS}
                max={MAX_NOTIFICATION_DURATION_MS}
                step={100}
                value={notificationDurationMs}
                suffix={t("settings.general.notifications.duration.unit")}
                data-testid="settings-notification-duration"
                onChange={onNotificationDurationMsChange}
              />
            </div>
            <div className={formStyles.fieldRow}>
              <label
                className={formStyles.fieldLabelGroup}
                htmlFor="settings-notification-max-visible"
              >
                <span className={formStyles.fieldLabel}>
                  {t("settings.general.notifications.maxVisible.label")}
                </span>
              </label>
              <SettingsNumberInput
                id="settings-notification-max-visible"
                min={MIN_NOTIFICATION_MAX_VISIBLE}
                max={MAX_NOTIFICATION_MAX_VISIBLE}
                value={notificationMaxVisible}
                data-testid="settings-notification-max-visible"
                onChange={onNotificationMaxVisibleChange}
              />
            </div>
            <div className={formStyles.fieldRow}>
              <label
                className={formStyles.fieldLabelGroup}
                htmlFor="settings-notification-closable"
              >
                <span className={formStyles.fieldLabel}>
                  {t("settings.general.notifications.closable.label")}
                </span>
              </label>
              <Switch
                id="settings-notification-closable"
                checked={notificationClosable}
                data-testid="settings-notification-closable"
                onCheckedChange={onNotificationClosableChange}
              />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
