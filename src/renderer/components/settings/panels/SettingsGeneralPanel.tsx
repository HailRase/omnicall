import clsx from "clsx";
import type { ChangeEvent, JSX } from "react";
import type { AppTheme } from "@application/index.js";
import { MIN_SIP_REREGISTER_INTERVAL_SEC } from "@application/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsGeneralPanelProps = Readonly<{
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  sipAutoReregisterEnabled: boolean;
  onSipAutoReregisterChange: (enabled: boolean) => void;
  sipReregisterIntervalSec: number;
  onSipReregisterIntervalChange: (intervalSec: number) => void;
}>;

const THEME_OPTIONS: ReadonlyArray<Readonly<{ value: AppTheme; label: string }>> = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];

/**
 * - Purpose: present appearance and SIP re-registration settings in the General section.
 * - Inputs: theme preference, SIP recovery toggles and interval with change callbacks.
 * - Outputs: accessible form fields without facade access.
 */
export function SettingsGeneralPanel({
  theme,
  onThemeChange,
  sipAutoReregisterEnabled,
  onSipAutoReregisterChange,
  sipReregisterIntervalSec,
  onSipReregisterIntervalChange,
}: SettingsGeneralPanelProps): JSX.Element {
  const handleSipAutoReregisterChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onSipAutoReregisterChange(event.target.checked);
  };

  const handleIntervalChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const parsed = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    onSipReregisterIntervalChange(parsed);
  };

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
        <legend className={formStyles["sectionTitle"]}>Восстановление SIP</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-sip-auto-reregister">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>Автоматическая перерегистрация SIP</span>
                <span className={formStyles["toggleDescription"]}>
                  Повторная регистрация при потере транспорта или ошибке
                </span>
              </span>
              <span className={formStyles["switch"]}>
                <input
                  id="settings-sip-auto-reregister"
                  type="checkbox"
                  className={formStyles["switchInput"]}
                  data-testid="settings-sip-auto-reregister-toggle"
                  checked={sipAutoReregisterEnabled}
                  onChange={handleSipAutoReregisterChange}
                />
                <span className={formStyles["switchSlider"]} aria-hidden="true" />
              </span>
            </label>
          </div>
          <div
            className={clsx(
              formStyles["settingBlock"],
              !sipAutoReregisterEnabled && formStyles["settingBlockDisabled"],
            )}
          >
            <div className={formStyles["fieldRow"]}>
              <label
                className={formStyles["fieldLabelGroup"]}
                htmlFor="settings-sip-reregister-interval"
              >
                <span className={formStyles["fieldLabel"]}>Интервал повтора</span>
                <span className={formStyles["fieldDescription"]} data-testid="settings-sip-recovery-hint">
                  Фиксированная задержка между попытками (минимум {MIN_SIP_REREGISTER_INTERVAL_SEC}{" "}
                  с)
                </span>
              </label>
              <div className={formStyles["numberInputGroup"]}>
                <input
                  id="settings-sip-reregister-interval"
                  type="number"
                  min={MIN_SIP_REREGISTER_INTERVAL_SEC}
                  step={1}
                  className={formStyles["numberInput"]}
                  data-testid="settings-sip-reregister-interval"
                  value={sipReregisterIntervalSec}
                  disabled={!sipAutoReregisterEnabled}
                  aria-disabled={!sipAutoReregisterEnabled}
                  onChange={handleIntervalChange}
                />
                <span className={formStyles["inputSuffix"]}>сек</span>
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
