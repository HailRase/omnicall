import clsx from "clsx";
import type { JSX } from "react";
import {
  SUPPORTED_LANGUAGES,
  parseSupportedLanguage,
  type AppTheme,
  type SupportedLanguage,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import { SettingsPreferencesTransferSection } from "./SettingsPreferencesTransferSection.js";
import { Button, Select } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsGeneralPanelProps = Readonly<{
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  currentVersion: string;
  latestVersion: string | undefined;
  updateStatusMessage: string;
  canCheckForUpdates: boolean;
  canOpenDownloadPage: boolean;
  isCheckingUpdates: boolean;
  onCheckForUpdates: () => void;
  onOpenDownloadPage: () => void;
  preferencesTransferBusy?: boolean | undefined;
  preferencesTransferStatusMessage?: string | null | undefined;
  onExportPreferences?: (() => void) | undefined;
  onImportPreferences?: (() => void) | undefined;
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

/**
 * - Purpose: present theme, language, preferences transfer, and app update settings.
 * - Inputs: language, theme, update metadata, preferences transfer callbacks.
 * - Outputs: accessible form fields without facade access.
 */
export function SettingsGeneralPanel({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  currentVersion,
  latestVersion,
  updateStatusMessage,
  canCheckForUpdates,
  canOpenDownloadPage,
  isCheckingUpdates,
  onCheckForUpdates,
  onOpenDownloadPage,
  preferencesTransferBusy = false,
  preferencesTransferStatusMessage = null,
  onExportPreferences,
  onImportPreferences,
}: SettingsGeneralPanelProps): JSX.Element {
  const { t } = useI18n();
  const showPreferencesTransfer =
    onExportPreferences !== undefined && onImportPreferences !== undefined;

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

      {showPreferencesTransfer ? (
        <SettingsPreferencesTransferSection
          isBusy={preferencesTransferBusy}
          statusMessage={preferencesTransferStatusMessage}
          onExport={onExportPreferences}
          onImport={onImportPreferences}
        />
      ) : null}

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
