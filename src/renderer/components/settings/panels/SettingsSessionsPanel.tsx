import clsx from "clsx";
import type { ChangeEvent, JSX } from "react";
import {
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_AUTO_ANSWER_TIMEOUT_SEC,
} from "@application/index.js";
import formStyles from "../SettingsForm.module.css";

export const DEFAULT_AUTO_ANSWER_TIMEOUT_SEC = 5;

export type SettingsSessionsPanelProps = Readonly<{
  multiSessionsEnabled: boolean;
  onMultiSessionsChange: (enabled: boolean) => void;
  autoAnswerEnabled: boolean;
  autoAnswerTimeoutSec: number;
  onAutoAnswerEnabledChange: (enabled: boolean) => void;
  onAutoAnswerTimeoutChange: (timeoutSec: number) => void;
  autoAnswerDuringActiveSessionEnabled: boolean;
  onAutoAnswerDuringActiveSessionChange: (enabled: boolean) => void;
}>;

/**
 * - Purpose: present multi-call and auto-answer session settings.
 * - Inputs: session flags, auto-answer delay, and change callbacks.
 * - Outputs: accessible toggles and numeric field without facade access.
 */
export function SettingsSessionsPanel({
  multiSessionsEnabled,
  onMultiSessionsChange,
  autoAnswerEnabled,
  autoAnswerTimeoutSec,
  onAutoAnswerEnabledChange,
  onAutoAnswerTimeoutChange,
  autoAnswerDuringActiveSessionEnabled,
  onAutoAnswerDuringActiveSessionChange,
}: SettingsSessionsPanelProps): JSX.Element {
  const handleMultiSessionsChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onMultiSessionsChange(event.target.checked);
  };

  const handleAutoAnswerEnabledChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onAutoAnswerEnabledChange(event.target.checked);
  };

  const handleAutoAnswerTimeoutChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const parsed = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    onAutoAnswerTimeoutChange(parsed);
  };

  const handleAutoAnswerDuringActiveSessionChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    onAutoAnswerDuringActiveSessionChange(event.target.checked);
  };

  const busyAutoAnswerDisabled = !autoAnswerEnabled || !multiSessionsEnabled;

  return (
    <div className={formStyles["panelStack"]} data-testid="settings-sessions-panel">
      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>Сессии звонков</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-multi-sessions">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>Разрешить несколько сессий звонков</span>
                <span className={formStyles["toggleDescription"]}>
                  Второй звонок при активной линии
                </span>
              </span>
              <span className={formStyles["switch"]}>
                <input
                  id="settings-multi-sessions"
                  type="checkbox"
                  className={formStyles["switchInput"]}
                  data-testid="settings-multi-sessions-toggle"
                  checked={multiSessionsEnabled}
                  onChange={handleMultiSessionsChange}
                />
                <span className={formStyles["switchSlider"]} aria-hidden="true" />
              </span>
            </label>
            <p className={formStyles["blockHint"]} data-testid="settings-multi-sessions-hint">
              Если отключено, второй входящий или исходящий звонок блокируется при активном звонке.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>Автоответ</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-auto-answer-enabled">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>Включить автоответ</span>
                <span className={formStyles["toggleDescription"]}>
                  Входящий звонок принимается автоматически по таймеру
                </span>
              </span>
              <span className={formStyles["switch"]}>
                <input
                  id="settings-auto-answer-enabled"
                  type="checkbox"
                  className={formStyles["switchInput"]}
                  data-testid="settings-auto-answer-enabled-toggle"
                  checked={autoAnswerEnabled}
                  onChange={handleAutoAnswerEnabledChange}
                />
                <span className={formStyles["switchSlider"]} aria-hidden="true" />
              </span>
            </label>
          </div>

          <div
            className={clsx(
              formStyles["settingBlock"],
              !autoAnswerEnabled && formStyles["settingBlockDisabled"],
            )}
          >
            <div className={formStyles["fieldRow"]}>
              <label
                className={formStyles["fieldLabelGroup"]}
                htmlFor="settings-auto-answer-timeout"
              >
                <span className={formStyles["fieldLabel"]}>Задержка автоответа</span>
                <span className={formStyles["fieldDescription"]} data-testid="settings-auto-answer-hint">
                  0 — немедленный ответ; максимум {MAX_AUTO_ANSWER_TIMEOUT_SEC} с
                </span>
              </label>
              <div className={formStyles["numberInputGroup"]}>
                <input
                  id="settings-auto-answer-timeout"
                  type="number"
                  min={MIN_AUTO_ANSWER_TIMEOUT_SEC}
                  max={MAX_AUTO_ANSWER_TIMEOUT_SEC}
                  step={1}
                  className={formStyles["numberInput"]}
                  data-testid="settings-auto-answer-timeout"
                  value={autoAnswerTimeoutSec}
                  disabled={!autoAnswerEnabled}
                  aria-disabled={!autoAnswerEnabled}
                  onChange={handleAutoAnswerTimeoutChange}
                />
                <span className={formStyles["inputSuffix"]}>сек</span>
              </div>
            </div>
          </div>

          <div
            className={clsx(
              formStyles["settingBlock"],
              busyAutoAnswerDisabled && formStyles["settingBlockDisabled"],
            )}
          >
            <label
              className={formStyles["toggleRow"]}
              htmlFor="settings-auto-answer-during-active-session"
            >
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>Автоответ при активном звонке</span>
                <span className={formStyles["toggleDescription"]}>
                  Текущий разговор ставится на удержание перед автоответом
                </span>
              </span>
              <span className={formStyles["switch"]}>
                <input
                  id="settings-auto-answer-during-active-session"
                  type="checkbox"
                  className={formStyles["switchInput"]}
                  data-testid="settings-auto-answer-during-active-session-toggle"
                  checked={autoAnswerDuringActiveSessionEnabled}
                  disabled={busyAutoAnswerDisabled}
                  aria-disabled={busyAutoAnswerDisabled}
                  onChange={handleAutoAnswerDuringActiveSessionChange}
                />
                <span className={formStyles["switchSlider"]} aria-hidden="true" />
              </span>
            </label>
            <p
              className={formStyles["blockHint"]}
              data-testid="settings-auto-answer-during-active-session-hint"
            >
              {!multiSessionsEnabled
                ? "Доступно только при включённых нескольких сессиях."
                : "Если отключено, автоответ не сработает, пока идёт другой разговор."}
            </p>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
