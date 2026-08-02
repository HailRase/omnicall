import clsx from "clsx";
import type { JSX } from "react";
import {
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  MIN_AUTO_ANSWER_TIMEOUT_SEC,
  type IncomingRingtoneId,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { SettingsNumberInput } from "../SettingsNumberInput.js";
import { Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import { SettingsRingtoneSection } from "./SettingsRingtoneSection.js";

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
  incomingRingtoneId: IncomingRingtoneId;
  onIncomingRingtoneIdChange: (ringtoneId: IncomingRingtoneId) => void;
  onPreviewIncomingRingtone: (ringtoneId: IncomingRingtoneId) => void;
  onStopIncomingRingtonePreview: () => void;
}>;

/**
 * - Purpose: present multi-call, ringtone, and auto-answer session settings.
 * - Inputs: session flags, ringtone id, auto-answer delay, and change callbacks.
 * - Outputs: accessible toggles and composed ringtone section without facade access.
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
  incomingRingtoneId,
  onIncomingRingtoneIdChange,
  onPreviewIncomingRingtone,
  onStopIncomingRingtonePreview,
}: SettingsSessionsPanelProps): JSX.Element {
  const { t } = useI18n();

  const busyAutoAnswerDisabled = !autoAnswerEnabled || !multiSessionsEnabled;

  return (
    <div className={formStyles.panelStack} data-testid="settings-sessions-panel">
      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>{t("settings.sessions.legend")}</legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <label className={formStyles.toggleRow} htmlFor="settings-multi-sessions">
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.sessions.multiSessions.label")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.sessions.multiSessions.description")}
                </span>
              </span>
              <Switch
                id="settings-multi-sessions"
                checked={multiSessionsEnabled}
                data-testid="settings-multi-sessions-toggle"
                onCheckedChange={onMultiSessionsChange}
              />
            </label>
            <p className={formStyles.blockHint} data-testid="settings-multi-sessions-hint">
              {t("settings.sessions.multiSessions.hint")}
            </p>
          </div>
        </div>
      </fieldset>

      <SettingsRingtoneSection
        incomingRingtoneId={incomingRingtoneId}
        onIncomingRingtoneIdChange={onIncomingRingtoneIdChange}
        onPreviewIncomingRingtone={onPreviewIncomingRingtone}
        onStopIncomingRingtonePreview={onStopIncomingRingtonePreview}
      />

      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>{t("settings.sessions.autoAnswer.legend")}</legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <label className={formStyles.toggleRow} htmlFor="settings-auto-answer-enabled">
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.sessions.autoAnswer.enabledLabel")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.sessions.autoAnswer.enabledDescription")}
                </span>
              </span>
              <Switch
                id="settings-auto-answer-enabled"
                checked={autoAnswerEnabled}
                data-testid="settings-auto-answer-enabled-toggle"
                onCheckedChange={onAutoAnswerEnabledChange}
              />
            </label>
          </div>

          <div
            className={clsx(
              formStyles.settingBlock,
              !autoAnswerEnabled && formStyles.settingBlockDisabled,
            )}
          >
            <div className={formStyles.fieldRow}>
              <label
                className={formStyles.fieldLabelGroup}
                htmlFor="settings-auto-answer-timeout"
              >
                <span className={formStyles.fieldLabel}>
                  {t("settings.sessions.autoAnswer.timeoutLabel")}
                </span>
                <span className={formStyles.fieldDescription} data-testid="settings-auto-answer-hint">
                  {t("settings.sessions.autoAnswer.timeoutHint", {
                    maxSec: MAX_AUTO_ANSWER_TIMEOUT_SEC,
                  })}
                </span>
              </label>
              <SettingsNumberInput
                id="settings-auto-answer-timeout"
                min={MIN_AUTO_ANSWER_TIMEOUT_SEC}
                max={MAX_AUTO_ANSWER_TIMEOUT_SEC}
                value={autoAnswerTimeoutSec}
                disabled={!autoAnswerEnabled}
                suffix={t("settings.sessions.autoAnswer.secondsShort")}
                data-testid="settings-auto-answer-timeout"
                onChange={onAutoAnswerTimeoutChange}
              />
            </div>
          </div>

          <div
            className={clsx(
              formStyles.settingBlock,
              busyAutoAnswerDisabled && formStyles.settingBlockDisabled,
            )}
          >
            <label
              className={formStyles.toggleRow}
              htmlFor="settings-auto-answer-during-active-session"
            >
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.sessions.autoAnswer.activeCallLabel")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.sessions.autoAnswer.activeCallDescription")}
                </span>
              </span>
              <Switch
                id="settings-auto-answer-during-active-session"
                checked={autoAnswerDuringActiveSessionEnabled}
                disabled={busyAutoAnswerDisabled}
                data-testid="settings-auto-answer-during-active-session-toggle"
                onCheckedChange={onAutoAnswerDuringActiveSessionChange}
              />
            </label>
            <p
              className={formStyles.blockHint}
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
