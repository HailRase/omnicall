import clsx from "clsx";
import type { ChangeEvent, JSX } from "react";
import {
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_AUTO_ANSWER_TIMEOUT_SEC,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
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
  const { t } = useI18n();
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
        <legend className={formStyles["sectionTitle"]}>{t("settings.sessions.legend")}</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-multi-sessions">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>
                  {t("settings.sessions.multiSessions.label")}
                </span>
                <span className={formStyles["toggleDescription"]}>
                  {t("settings.sessions.multiSessions.description")}
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
              {t("settings.sessions.multiSessions.hint")}
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>{t("settings.sessions.autoAnswer.legend")}</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-auto-answer-enabled">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>
                  {t("settings.sessions.autoAnswer.enabledLabel")}
                </span>
                <span className={formStyles["toggleDescription"]}>
                  {t("settings.sessions.autoAnswer.enabledDescription")}
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
                <span className={formStyles["fieldLabel"]}>
                  {t("settings.sessions.autoAnswer.timeoutLabel")}
                </span>
                <span className={formStyles["fieldDescription"]} data-testid="settings-auto-answer-hint">
                  {t("settings.sessions.autoAnswer.timeoutHint", {
                    maxSec: MAX_AUTO_ANSWER_TIMEOUT_SEC,
                  })}
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
                <span className={formStyles["inputSuffix"]}>
                  {t("settings.sessions.autoAnswer.secondsShort")}
                </span>
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
                <span className={formStyles["toggleLabel"]}>
                  {t("settings.sessions.autoAnswer.activeCallLabel")}
                </span>
                <span className={formStyles["toggleDescription"]}>
                  {t("settings.sessions.autoAnswer.activeCallDescription")}
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
                ? t("settings.sessions.autoAnswer.activeCallHintMultiOff")
                : t("settings.sessions.autoAnswer.activeCallHintMultiOn")}
            </p>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
