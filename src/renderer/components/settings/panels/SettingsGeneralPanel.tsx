import clsx from "clsx";
import type { JSX } from "react";
import {
  MAX_NOTIFICATION_DURATION_MS,
  MAX_NOTIFICATION_MAX_VISIBLE,
  MIN_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_MAX_VISIBLE,
  NOTIFICATION_PLACEMENTS,
  NOTIFICATION_STACKING_MODES,
  SUPPORTED_LANGUAGES,
  parseSupportedLanguage,
  type AppTheme,
  type NotificationPlacement,
  type NotificationStacking,
  type SupportedLanguage,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import { Button, Select, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsGeneralPanelProps = Readonly<{
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  notificationPlacement: NotificationPlacement;
  onNotificationPlacementChange: (placement: NotificationPlacement) => void;
  notificationStacking: NotificationStacking;
  onNotificationStackingChange: (stacking: NotificationStacking) => void;
  notificationDurationMs: number;
  onNotificationDurationMsChange: (durationMs: number) => void;
  notificationClosable: boolean;
  onNotificationClosableChange: (closable: boolean) => void;
  notificationMaxVisible: number;
  onNotificationMaxVisibleChange: (maxVisible: number) => void;
  currentVersion: string;
  latestVersion: string | undefined;
  updateStatusMessage: string;
  canCheckForUpdates: boolean;
  canOpenDownloadPage: boolean;
  isCheckingUpdates: boolean;
  onCheckForUpdates: () => void;
  onOpenDownloadPage: () => void;
}>;

const THEME_OPTIONS: ReadonlyArray<Readonly<{ value: AppTheme; label: TranslationKey }>> = [
  { value: "light", label: "settings.general.theme.light" },
  { value: "dark", label: "settings.general.theme.dark" },
];

const LANGUAGE_LABELS: Readonly<Record<SupportedLanguage, TranslationKey>> = {
  ru: "settings.general.language.ru",
  en: "settings.general.language.en",
  fr: "settings.general.language.fr",
  de: "settings.general.language.de",
  bg: "settings.general.language.bg",
};

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
 * - Purpose: present appearance and app update settings in the General section.
 * - Inputs: language, theme preference, and update metadata with change callbacks.
 * - Outputs: accessible form fields without facade access.
 */
export function SettingsGeneralPanel({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  notificationPlacement,
  onNotificationPlacementChange,
  notificationStacking,
  onNotificationStackingChange,
  notificationDurationMs,
  onNotificationDurationMsChange,
  notificationClosable,
  onNotificationClosableChange,
  notificationMaxVisible,
  onNotificationMaxVisibleChange,
  currentVersion,
  latestVersion,
  updateStatusMessage,
  canCheckForUpdates,
  canOpenDownloadPage,
  isCheckingUpdates,
  onCheckForUpdates,
  onOpenDownloadPage,
}: SettingsGeneralPanelProps): JSX.Element {
  const { t } = useI18n();

  const languageItems = SUPPORTED_LANGUAGES.map((locale) => ({
    value: locale,
    label: t(LANGUAGE_LABELS[locale]),
  }));

  const handleLanguageChange = (value: string): void => {
    const parsed = parseSupportedLanguage(value);
    if (parsed === null) {
      return;
    }
    onLanguageChange(parsed);
  };

  return (
    <div className={formStyles.panelStack} data-testid="settings-general-panel">
      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.general.appearanceLegend")}
        </legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <span className={formStyles.fieldLabel} id="settings-theme-label">
              {t("settings.general.themeLabel")}
            </span>
            <p className={formStyles.fieldDescription}>
              {t("settings.general.themeDescription")}
            </p>
            <div
              className={formStyles.segmentedControl}
              role="radiogroup"
              aria-labelledby="settings-theme-label"
              data-testid="settings-theme-control"
            >
              {THEME_OPTIONS.map((option) => {
                const selected = theme === option.value;
                return (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    role="radio"
                    aria-checked={selected}
                    className={clsx(
                      formStyles.segmentOption,
                      selected && formStyles.segmentOptionSelected,
                    )}
                    data-testid={`settings-theme-${option.value}`}
                    onClick={() => {
                      onThemeChange(option.value);
                    }}
                  >
                    {t(option.label)}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className={formStyles.settingBlock}>
            <label className={formStyles.fieldLabelGroup} htmlFor="settings-language-select">
              <span className={formStyles.fieldLabel} id="settings-language-select-label">
                {t("settings.general.languageLabel")}
              </span>
              <span className={formStyles.fieldDescription}>
                {t("settings.general.languageDescription")}
              </span>
            </label>
            <div className={formStyles.languageSelectField}>
              <Select
                id="settings-language-select"
                data-testid="settings-language-select"
                aria-labelledby="settings-language-select-label"
                items={languageItems}
                value={language}
                onValueChange={handleLanguageChange}
              />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.general.notifications.legend")}
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
              <div className={formStyles.numberInputGroup}>
                <input
                  id="settings-notification-duration"
                  type="number"
                  min={MIN_NOTIFICATION_DURATION_MS}
                  max={MAX_NOTIFICATION_DURATION_MS}
                  step={100}
                  className={formStyles.numberInput}
                  value={notificationDurationMs}
                  data-testid="settings-notification-duration"
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      onNotificationDurationMsChange(parsed);
                    }
                  }}
                />
                <span className={formStyles.inputSuffix}>
                  {t("settings.general.notifications.duration.unit")}
                </span>
              </div>
            </div>
            <div className={formStyles.fieldRow}>
              <label className={formStyles.fieldLabelGroup} htmlFor="settings-notification-max-visible">
                <span className={formStyles.fieldLabel}>
                  {t("settings.general.notifications.maxVisible.label")}
                </span>
              </label>
              <div className={formStyles.numberInputGroup}>
                <input
                  id="settings-notification-max-visible"
                  type="number"
                  min={MIN_NOTIFICATION_MAX_VISIBLE}
                  max={MAX_NOTIFICATION_MAX_VISIBLE}
                  step={1}
                  className={formStyles.numberInput}
                  value={notificationMaxVisible}
                  data-testid="settings-notification-max-visible"
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      onNotificationMaxVisibleChange(parsed);
                    }
                  }}
                />
              </div>
            </div>
            <label className={formStyles.toggleRow} htmlFor="settings-notification-closable">
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.general.notifications.closable.label")}
                </span>
              </span>
              <Switch
                id="settings-notification-closable"
                checked={notificationClosable}
                data-testid="settings-notification-closable"
                onCheckedChange={onNotificationClosableChange}
              />
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.general.aboutLegend")}
        </legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <p className={formStyles.fieldLabel} id="settings-current-version-label">
              {t("settings.general.currentVersion")}
            </p>
            <p
              className={formStyles.fieldValue}
              aria-labelledby="settings-current-version-label"
              data-testid="settings-current-version"
            >
              {currentVersion}
            </p>
            {latestVersion !== undefined ? (
              <p className={formStyles.fieldDescription} data-testid="settings-latest-version">
                {t("settings.general.latestVersion", { version: latestVersion })}
              </p>
            ) : null}
          </div>
          <div className={formStyles.settingBlock}>
            <p
              className={formStyles.fieldDescription}
              role="status"
              aria-live="polite"
              data-testid="settings-update-status"
            >
              {updateStatusMessage}
            </p>
            <div className={formStyles.actionRow}>
              <Button
                variant="primary"
                size="sm"
                data-testid="settings-check-updates"
                disabled={!canCheckForUpdates}
                loading={isCheckingUpdates}
                onClick={onCheckForUpdates}
              >
                {isCheckingUpdates
                  ? t("settings.general.checkingUpdates")
                  : t("settings.general.checkUpdates")}
              </Button>
              {canOpenDownloadPage ? (
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid="settings-open-download-page"
                  onClick={onOpenDownloadPage}
                >
                  {t("settings.general.openDownloadPage")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
