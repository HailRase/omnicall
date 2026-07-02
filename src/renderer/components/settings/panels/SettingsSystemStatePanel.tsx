import clsx from "clsx";
import type { ChangeEvent, JSX } from "react";
import type { SipConnectionJournalEntry, SipSystemStateShellView } from "@application/index.js";
import {
  MIN_SIP_RECONNECT_INTERVAL_SEC,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
} from "@application/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SettingsSystemStatePanel.module.css";

export type SettingsSystemStatePanelProps = Readonly<{
  shell: SipSystemStateShellView;
  sipAutoReconnectEnabled: boolean;
  onSipAutoReconnectChange: (enabled: boolean) => void;
  sipReconnectIntervalSec: number;
  onSipReconnectIntervalChange: (intervalSec: number) => void;
  sipReconnectMaxAttempts: number;
  onSipReconnectMaxAttemptsChange: (attempts: number) => void;
  sipAutoReregisterEnabled: boolean;
  onSipAutoReregisterChange: (enabled: boolean) => void;
  sipReregisterIntervalSec: number;
  onSipReregisterIntervalChange: (intervalSec: number) => void;
  sipReregisterMaxAttempts: number;
  onSipReregisterMaxAttemptsChange: (attempts: number) => void;
  sipAutoRegisterOnStartup: boolean;
  onSipAutoRegisterOnStartupChange: (enabled: boolean) => void;
  onManualTransportReconnect: () => void;
  onManualReregister: () => void;
  onForceRefreshRegistration: () => void;
  onClearJournal: () => void;
  actionError: string | null;
}>;

function formatJournalTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function renderJournalEntry(entry: SipConnectionJournalEntry): JSX.Element {
  const detail = entry.detail === null ? "" : ` — ${entry.detail}`;
  return (
    <li
      key={`${entry.timestamp}-${entry.correlationId}-${entry.eventType}`}
      className={styles["journalEntry"]}
      data-testid="settings-sip-journal-entry"
      data-category={entry.category}
    >
      <span className={styles["journalTime"]}>{formatJournalTimestamp(entry.timestamp)}</span>
      <span className={styles["journalEvent"]}>{entry.eventType}</span>
      <span className={styles["journalCorrelation"]}>{entry.correlationId}</span>
      {detail.length > 0 ? (
        <span className={styles["journalDetail"]}>{detail}</span>
      ) : null}
    </li>
  );
}

/**
 * - Purpose: present SIP transport/registration status, recovery policy, and journal.
 * - Inputs: derived shell view-model, user settings fields, and action callbacks.
 * - Outputs: accessible settings panel without facade or SIP access.
 * @uiMeta lf=LF-008,LF-057 f=F-014,F-016 smoke=R7-*
 */
export function SettingsSystemStatePanel({
  shell,
  sipAutoReconnectEnabled,
  onSipAutoReconnectChange,
  sipReconnectIntervalSec,
  onSipReconnectIntervalChange,
  sipReconnectMaxAttempts,
  onSipReconnectMaxAttemptsChange,
  sipAutoReregisterEnabled,
  onSipAutoReregisterChange,
  sipReregisterIntervalSec,
  onSipReregisterIntervalChange,
  sipReregisterMaxAttempts,
  onSipReregisterMaxAttemptsChange,
  sipAutoRegisterOnStartup,
  onSipAutoRegisterOnStartupChange,
  onManualTransportReconnect,
  onManualReregister,
  onForceRefreshRegistration,
  onClearJournal,
  actionError,
}: SettingsSystemStatePanelProps): JSX.Element {
  const transportReconnectDisabled = shell.manualTransportReconnectDisabledReason !== null;
  const manualReregisterDisabled = shell.manualReregisterDisabledReason !== null;
  const forceRefreshDisabled = shell.forceRefreshDisabledReason !== null;

  return (
    <div className={formStyles["panelStack"]} data-testid="settings-system-state-panel">
      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>Текущее состояние</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <dl className={styles["stateGrid"]}>
              <div className={styles["stateRow"]}>
                <dt className={styles["stateLabel"]}>Сокет</dt>
                <dd className={styles["stateValue"]} data-testid="settings-sip-transport-state">
                  {shell.transportStateLabel}
                  {shell.transportFailureReason !== null ? (
                    <span className={styles["stateReason"]}> ({shell.transportFailureReason})</span>
                  ) : null}
                </dd>
              </div>
              <div className={styles["stateRow"]}>
                <dt className={styles["stateLabel"]}>Регистрация</dt>
                <dd className={styles["stateValue"]} data-testid="settings-sip-registration-state">
                  {shell.registrationStateLabel}
                  {shell.registrationFailureReason !== null ? (
                    <span className={styles["stateReason"]}>
                      {" "}
                      ({shell.registrationFailureReason})
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className={styles["stateRow"]}>
                <dt className={styles["stateLabel"]}>Сводка</dt>
                <dd className={styles["stateValue"]} data-testid="settings-sip-summary-label">
                  {shell.summaryLabel}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>Автоматическое восстановление</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-sip-auto-reconnect">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>Авто-переподключение сокета</span>
                <span className={formStyles["toggleDescription"]}>
                  Повторное подключение WebSocket при обрыве
                </span>
              </span>
              <span className={formStyles["switch"]}>
                <input
                  id="settings-sip-auto-reconnect"
                  type="checkbox"
                  className={formStyles["switchInput"]}
                  data-testid="settings-sip-auto-reconnect-toggle"
                  checked={sipAutoReconnectEnabled}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onSipAutoReconnectChange(event.target.checked);
                  }}
                />
                <span className={formStyles["switchSlider"]} aria-hidden="true" />
              </span>
            </label>
          </div>
          <div
            className={clsx(
              formStyles["settingBlock"],
              !sipAutoReconnectEnabled && formStyles["settingBlockDisabled"],
            )}
          >
            <div className={formStyles["fieldRow"]}>
              <label
                className={formStyles["fieldLabelGroup"]}
                htmlFor="settings-sip-reconnect-interval"
              >
                <span className={formStyles["fieldLabel"]}>Интервал переподключения</span>
                <span className={formStyles["fieldDescription"]}>
                  Минимум {MIN_SIP_RECONNECT_INTERVAL_SEC} с
                </span>
              </label>
              <div className={formStyles["numberInputGroup"]}>
                <input
                  id="settings-sip-reconnect-interval"
                  type="number"
                  min={MIN_SIP_RECONNECT_INTERVAL_SEC}
                  step={1}
                  className={formStyles["numberInput"]}
                  data-testid="settings-sip-reconnect-interval"
                  value={sipReconnectIntervalSec}
                  disabled={!sipAutoReconnectEnabled}
                  aria-disabled={!sipAutoReconnectEnabled}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      onSipReconnectIntervalChange(parsed);
                    }
                  }}
                />
                <span className={formStyles["inputSuffix"]}>сек</span>
              </div>
            </div>
            <div className={formStyles["fieldRow"]}>
              <label
                className={formStyles["fieldLabelGroup"]}
                htmlFor="settings-sip-reconnect-max-attempts"
              >
                <span className={formStyles["fieldLabel"]}>Попыток переподключения</span>
              </label>
              <div className={formStyles["numberInputGroup"]}>
                <input
                  id="settings-sip-reconnect-max-attempts"
                  type="number"
                  min={1}
                  step={1}
                  className={formStyles["numberInput"]}
                  data-testid="settings-sip-reconnect-max-attempts"
                  value={sipReconnectMaxAttempts}
                  disabled={!sipAutoReconnectEnabled}
                  aria-disabled={!sipAutoReconnectEnabled}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      onSipReconnectMaxAttemptsChange(parsed);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-sip-auto-reregister">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>Авто-перерегистрация</span>
                <span className={formStyles["toggleDescription"]}>
                  Повторная SIP-регистрация при ошибке REGISTER
                </span>
              </span>
              <span className={formStyles["switch"]}>
                <input
                  id="settings-sip-auto-reregister"
                  type="checkbox"
                  className={formStyles["switchInput"]}
                  data-testid="settings-sip-auto-reregister-toggle"
                  checked={sipAutoReregisterEnabled}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onSipAutoReregisterChange(event.target.checked);
                  }}
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
                <span className={formStyles["fieldLabel"]}>Интервал перерегистрации</span>
                <span className={formStyles["fieldDescription"]}>
                  Минимум {MIN_SIP_REREGISTER_INTERVAL_SEC} с
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
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      onSipReregisterIntervalChange(parsed);
                    }
                  }}
                />
                <span className={formStyles["inputSuffix"]}>сек</span>
              </div>
            </div>
            <div className={formStyles["fieldRow"]}>
              <label
                className={formStyles["fieldLabelGroup"]}
                htmlFor="settings-sip-reregister-max-attempts"
              >
                <span className={formStyles["fieldLabel"]}>Попыток перерегистрации</span>
              </label>
              <div className={formStyles["numberInputGroup"]}>
                <input
                  id="settings-sip-reregister-max-attempts"
                  type="number"
                  min={1}
                  step={1}
                  className={formStyles["numberInput"]}
                  data-testid="settings-sip-reregister-max-attempts"
                  value={sipReregisterMaxAttempts}
                  disabled={!sipAutoReregisterEnabled}
                  aria-disabled={!sipAutoReregisterEnabled}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      onSipReregisterMaxAttemptsChange(parsed);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className={formStyles["settingBlock"]}>
            <label className={formStyles["toggleRow"]} htmlFor="settings-sip-auto-register-startup">
              <span className={formStyles["toggleText"]}>
                <span className={formStyles["toggleLabel"]}>Авто-регистрация при запуске</span>
                <span className={formStyles["toggleDescription"]}>
                  Автоматическая регистрация после авторизации (подготовка)
                </span>
              </span>
              <span className={formStyles["switch"]}>
                <input
                  id="settings-sip-auto-register-startup"
                  type="checkbox"
                  className={formStyles["switchInput"]}
                  data-testid="settings-sip-auto-register-startup-toggle"
                  checked={sipAutoRegisterOnStartup}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onSipAutoRegisterOnStartupChange(event.target.checked);
                  }}
                />
                <span className={formStyles["switchSlider"]} aria-hidden="true" />
              </span>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>Ручные действия</legend>
        <div className={formStyles["settingsGroup"]}>
          {actionError !== null ? (
            <p className={formStyles["error"]} role="alert" data-testid="settings-sip-action-error">
              {actionError}
            </p>
          ) : null}
          <div className={formStyles["actionRow"]}>
            <button
              type="button"
              className={formStyles["secondaryButton"]}
              data-testid="settings-sip-manual-transport-reconnect"
              disabled={transportReconnectDisabled}
              aria-disabled={transportReconnectDisabled}
              onClick={onManualTransportReconnect}
            >
              Переподключить сокет
            </button>
            <button
              type="button"
              className={formStyles["secondaryButton"]}
              data-testid="settings-sip-manual-reregister"
              disabled={manualReregisterDisabled}
              aria-disabled={manualReregisterDisabled}
              onClick={onManualReregister}
            >
              Перерегистрировать
            </button>
            <button
              type="button"
              className={formStyles["secondaryButton"]}
              data-testid="settings-sip-force-refresh"
              disabled={forceRefreshDisabled}
              aria-disabled={forceRefreshDisabled}
              onClick={onForceRefreshRegistration}
            >
              Обновить регистрацию
            </button>
          </div>
          {transportReconnectDisabled && shell.manualTransportReconnectDisabledReason !== null ? (
            <p className={formStyles["fieldDescription"]} data-testid="settings-sip-transport-disabled-reason">
              Переподключить сокет: {shell.manualTransportReconnectDisabledReason}
            </p>
          ) : null}
          {manualReregisterDisabled && shell.manualReregisterDisabledReason !== null ? (
            <p className={formStyles["fieldDescription"]} data-testid="settings-sip-reregister-disabled-reason">
              Перерегистрировать: {shell.manualReregisterDisabledReason}
            </p>
          ) : null}
          {forceRefreshDisabled && shell.forceRefreshDisabledReason !== null ? (
            <p className={formStyles["fieldDescription"]} data-testid="settings-sip-force-refresh-disabled-reason">
              Обновить регистрацию: {shell.forceRefreshDisabledReason}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className={formStyles["sectionCard"]}>
        <legend className={formStyles["sectionTitle"]}>Журнал</legend>
        <div className={formStyles["settingsGroup"]}>
          <div className={styles["journalContainer"]} data-testid="settings-sip-journal">
            {shell.journalEntries.length === 0 ? (
              <p className={formStyles["fieldDescription"]} data-testid="settings-sip-journal-empty">
                Событий пока нет
              </p>
            ) : (
              <ul className={styles["journalList"]} role="list">
                {shell.journalEntries.map((entry) => renderJournalEntry(entry))}
              </ul>
            )}
          </div>
          <div className={formStyles["actionRow"]}>
            <button
              type="button"
              className={formStyles["secondaryButton"]}
              data-testid="settings-sip-journal-clear"
              disabled={shell.journalEntries.length === 0}
              aria-disabled={shell.journalEntries.length === 0}
              onClick={onClearJournal}
            >
              Очистить журнал
            </button>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
