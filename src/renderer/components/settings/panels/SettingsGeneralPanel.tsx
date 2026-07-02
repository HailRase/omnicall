import clsx from "clsx";
import type { JSX } from "react";
import type { AppTheme } from "@application/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsGeneralPanelProps = Readonly<{
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

const THEME_OPTIONS: ReadonlyArray<Readonly<{ value: AppTheme; label: string }>> = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];

/**
 * - Purpose: present appearance and app update settings in the General section.
 * - Inputs: theme preference and update metadata with change callbacks.
 * - Outputs: accessible form fields without facade access.
 */
export function SettingsGeneralPanel({
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
  return (
    <div className={formStyles["panelStack"]} data-testid="settings-general-panel">
      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>Оформление</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <span className={formStyles["fieldLabel"]} id="settings-theme-label">
              Тема интерфейса
            </span>
            <p className={formStyles["fieldDescription"]}>
              Цветовая схема приложения. Применяется сразу после выбора.
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
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>О программе</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <p className={formStyles["fieldLabel"]} id="settings-current-version-label">
              Текущая версия
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
                Последняя версия: {latestVersion}
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
                {isCheckingUpdates ? "Проверка…" : "Проверить обновления"}
              </button>
              {canOpenDownloadPage ? (
                <button
                  type="button"
                  className={formStyles["secondaryButton"]}
                  data-testid="settings-open-download-page"
                  onClick={onOpenDownloadPage}
                >
                  Открыть страницу загрузки
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
