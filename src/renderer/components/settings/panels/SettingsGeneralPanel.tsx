import clsx from "clsx";
import type { ChangeEvent, JSX } from "react";
import {
  SUPPORTED_LANGUAGES,
  parseSupportedLanguage,
  type AppTheme,
  type SupportedLanguage,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
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

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const parsed = parseSupportedLanguage(event.target.value);
    if (parsed === null) {
      return;
    }
    onLanguageChange(parsed);
  };

  return (
    <div className={formStyles["panelStack"]} data-testid="settings-general-panel">
      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>
          {t("settings.general.appearanceLegend")}
        </legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <span className={formStyles["fieldLabel"]} id="settings-theme-label">
              {t("settings.general.themeLabel")}
            </span>
            <p className={formStyles["fieldDescription"]}>
              {t("settings.general.themeDescription")}
            </p>
            <div
              className={formStyles["segmentedControl"]}
              role="radiogroup"
              aria-labelledby="settings-theme-label"
              data-testid="settings-theme-control"
            >
              {THEME_OPTIONS.map((option) => {
                const selected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={clsx(
                      formStyles["segmentOption"],
                      selected && formStyles["segmentOptionSelected"],
                    )}
                    data-testid={`settings-theme-${option.value}`}
                    onClick={() => {
                      onThemeChange(option.value);
                    }}
                  >
                    {t(option.label)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["fieldLabelGroup"]} htmlFor="settings-language-select">
              <span className={formStyles["fieldLabel"]}>
                {t("settings.general.languageLabel")}
              </span>
              <span className={formStyles["fieldDescription"]}>
                {t("settings.general.languageDescription")}
              </span>
            </label>
            <div className={formStyles["languageSelectGroup"]}>
              <select
                id="settings-language-select"
                className={formStyles["languageSelect"]}
                data-testid="settings-language-select"
                value={language}
                onChange={handleLanguageChange}
              >
                {SUPPORTED_LANGUAGES.map((locale) => (
                  <option key={locale} value={locale}>
                    {t(LANGUAGE_LABELS[locale])}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>
          {t("settings.general.aboutLegend")}
        </legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <p className={formStyles["fieldLabel"]} id="settings-current-version-label">
              {t("settings.general.currentVersion")}
            </p>
            <p
              className={formStyles["fieldValue"]}
              aria-labelledby="settings-current-version-label"
              data-testid="settings-current-version"
            >
              {currentVersion}
            </p>
            {latestVersion !== undefined ? (
              <p className={formStyles["fieldDescription"]} data-testid="settings-latest-version">
                {t("settings.general.latestVersion", { version: latestVersion })}
              </p>
            ) : null}
          </div>
          <div className={formStyles["settingBlock"]}>
            <p
              className={formStyles["fieldDescription"]}
              role="status"
              aria-live="polite"
              data-testid="settings-update-status"
            >
              {updateStatusMessage}
            </p>
            <div className={formStyles["actionRow"]}>
              <button
                type="button"
                className={formStyles["primaryButton"]}
                data-testid="settings-check-updates"
                disabled={!canCheckForUpdates}
                aria-disabled={!canCheckForUpdates}
                aria-busy={isCheckingUpdates}
                onClick={onCheckForUpdates}
              >
                {isCheckingUpdates
                  ? t("settings.general.checkingUpdates")
                  : t("settings.general.checkUpdates")}
              </button>
              {canOpenDownloadPage ? (
                <button
                  type="button"
                  className={formStyles["secondaryButton"]}
                  data-testid="settings-open-download-page"
                  onClick={onOpenDownloadPage}
                >
                  {t("settings.general.openDownloadPage")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
