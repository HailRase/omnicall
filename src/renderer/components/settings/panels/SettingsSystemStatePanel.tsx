import clsx from "clsx";
import { useEffect, useId, useRef, useState, type ChangeEvent, type JSX } from "react";
import type { SipConnectionJournalEntry, SipSystemStateShellView } from "@application/index.js";
import {
  MIN_SIP_RECONNECT_INTERVAL_SEC,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
} from "@application/index.js";
import type { SipManualActionKind } from "../../../hooks/useSipSystemStateActions.js";
import { formatLocaleDateTime, useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/AppIcon.js";
import { IconTooltip } from "../../icons/IconTooltip.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SettingsSystemStatePanel.module.css";
import {
  deriveRegistrationIndicatorTone,
  deriveSummaryIndicatorTone,
  deriveTransportIndicatorTone,
  isIntervalBelowMinimum,
  type SipStateIndicatorTone,
} from "./settingsSystemStatePanelHelpers.js";

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
  onClearJournal: () => void;
  actionLoading: SipManualActionKind | null;
}>;

type StateIndicatorProps = Readonly<{
  tone: SipStateIndicatorTone;
  label: string;
}>;

const STATE_INDICATOR_TONE_CLASS: Record<SipStateIndicatorTone, string> = {
  positive: styles.stateIndicatorPositive,
  progress: styles.stateIndicatorProgress,
  negative: styles.stateIndicatorNegative,
  neutral: styles.stateIndicatorNeutral,
};

function StateIndicator({ tone, label }: StateIndicatorProps): JSX.Element {
  return (
    <span
      className={clsx(styles.stateIndicator, STATE_INDICATOR_TONE_CLASS[tone])}
      role="img"
      aria-label={label}
    />
  );
}

type StateMetricRowProps = Readonly<{
  indicatorLabel: string;
  tone: SipStateIndicatorTone;
  label: string;
  testId: string;
  value: string;
  reason: string | null;
}>;

function StateMetricRow({
  indicatorLabel,
  tone,
  label,
  testId,
  value,
  reason,
}: StateMetricRowProps): JSX.Element {
  return (
    <div className={styles.stateRow}>
      <StateIndicator tone={tone} label={indicatorLabel} />
      <dt className={styles.stateLabel}>{label}</dt>
      <dd className={styles.stateValue} data-testid={testId}>
        {value}
        {reason !== null ? <span className={styles.stateReason}> ({reason})</span> : null}
      </dd>
    </div>
  );
}

type NumberFieldProps = Readonly<{
  id: string;
  label: string;
  description?: string;
  testId: string;
  value: number;
  min: number;
  disabled: boolean;
  withSuffix?: boolean;
  onChange: (value: number) => void;
}>;

function NumberField({
  id,
  label,
  description,
  testId,
  value,
  min,
  disabled,
  withSuffix = false,
  onChange,
}: NumberFieldProps): JSX.Element {
  const { t } = useI18n();
  const descriptionId = `${id}-description`;
  const suffixId = `${id}-suffix`;
  const errorId = `${id}-error`;
  const hasError = !disabled && isIntervalBelowMinimum(value, min);

  return (
    <div className={formStyles.fieldRow}>
      <label className={formStyles.fieldLabelGroup} htmlFor={id}>
        <span className={formStyles.fieldLabel}>{label}</span>
        {description !== undefined ? (
          <span id={descriptionId} className={formStyles.fieldDescription}>
            {description}
          </span>
        ) : null}
      </label>
      <div>
        <div
          className={clsx(formStyles.numberInputGroup, styles.numberInputTouchTarget)}
        >
          <input
            id={id}
            type="number"
            min={min}
            step={1}
            className={clsx(formStyles.numberInput, hasError && styles.numberInputInvalid)}
            data-testid={testId}
            value={value}
            disabled={disabled}
            aria-disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={
              [
                description !== undefined ? descriptionId : null,
                withSuffix ? `${suffixId}-sr` : null,
                hasError ? errorId : null,
              ]
                .filter((part): part is string => part !== null)
                .join(" ") || undefined
            }
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const parsed = Number.parseInt(event.target.value, 10);
              if (!Number.isNaN(parsed)) {
                onChange(parsed);
              }
            }}
          />
          {withSuffix ? (
            <>
              <span id={suffixId} className={formStyles.inputSuffix} aria-hidden="true">
                {t("settings.systemState.field.secondsShort")}
              </span>
              <span id={`${suffixId}-sr`} className={styles.suffixAccessible}>
                {t("settings.systemState.field.secondsAccessible")}
              </span>
            </>
          ) : null}
        </div>
        {hasError ? (
          <p id={errorId} className={styles.fieldError} role="alert">
            {t("settings.systemState.field.minValueError", { min })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type ManualActionButtonProps = Readonly<{
  testId: string;
  reasonTestId: string;
  label: string;
  loadingLabel: string;
  disabled: boolean;
  disabledReason: string | null;
  isLoading: boolean;
  onClick: () => void;
}>;

function ManualActionButton({
  testId,
  reasonTestId,
  label,
  loadingLabel,
  disabled,
  disabledReason,
  isLoading,
  onClick,
}: ManualActionButtonProps): JSX.Element {
  const reasonId = useId();
  const isDisabled = disabled || isLoading;

  return (
    <div className={styles.manualActionItem}>
      <IconTooltip label={disabledReason ?? ""}>
        <button
          type="button"
          className={formStyles.secondaryButton}
          data-testid={testId}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-busy={isLoading || undefined}
          aria-describedby={disabledReason !== null ? reasonId : undefined}
          onClick={onClick}
        >
          {isLoading ? (
            <span className={styles.buttonLoading}>
              <span className={styles.buttonSpinner} aria-hidden="true" />
              {loadingLabel}
            </span>
          ) : (
            label
          )}
        </button>
      </IconTooltip>
      {disabledReason !== null ? (
        <span id={reasonId} className={styles.disabledReasonSrOnly} data-testid={reasonTestId}>
          {disabledReason}
        </span>
      ) : null}
    </div>
  );
}

type StateWithActionsRowProps = Readonly<{
  metric: StateMetricRowProps;
  children?: JSX.Element | null;
}>;

function StateWithActionsRow({ metric, children }: StateWithActionsRowProps): JSX.Element {
  return (
    <div className={styles.stateActionRow}>
      <div className={styles.stateActionMetric}>
        <StateMetricRow {...metric} />
      </div>
      {children !== null && children !== undefined ? (
        <div className={styles.stateActionControls}>{children}</div>
      ) : null}
    </div>
  );
}

function journalEntryKey(entry: SipConnectionJournalEntry): string {
  return `${entry.timestamp}-${entry.correlationId}-${entry.eventType}`;
}

/**
 * - Purpose: present SIP transport/registration status, recovery policy, and journal.
 * - Inputs: derived shell view-model, user settings fields, and action callbacks.
 * - Outputs: accessible settings panel without facade or SIP access.
 * @uiMeta lf=LF-008,LF-057 f=F-014,F-016,F-021 smoke=R7-*
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
  onClearJournal,
  actionLoading,
}: SettingsSystemStatePanelProps): JSX.Element {
  const { t, language } = useI18n();
  const transportLabel = t(shell.transportStateLabelKey);
  const registrationLabel = t(shell.registrationStateLabelKey);
  const summaryText = t(shell.summaryLabelKey);
  const manualTransportDisabledReason =
    shell.manualTransportReconnectDisabledReasonKey === null
      ? null
      : t(shell.manualTransportReconnectDisabledReasonKey);
  const manualReregisterDisabledReason =
    shell.manualReregisterDisabledReasonKey === null
      ? null
      : t(shell.manualReregisterDisabledReasonKey);
  const autoReconnectDescriptionId = useId();
  const autoReregisterDescriptionId = useId();
  const autoRegisterStartupDescriptionId = useId();
  const knownJournalKeysRef = useRef<ReadonlySet<string>>(new Set());
  const [highlightedKeys, setHighlightedKeys] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const currentKeys = new Set(shell.journalEntries.map((entry) => journalEntryKey(entry)));
    const freshKeys = new Set<string>();

    for (const key of currentKeys) {
      if (!knownJournalKeysRef.current.has(key)) {
        freshKeys.add(key);
      }
    }

    knownJournalKeysRef.current = currentKeys;

    if (freshKeys.size === 0) {
      return;
    }

    setHighlightedKeys(freshKeys);
    const timer = setTimeout(() => {
      setHighlightedKeys(new Set());
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [shell.journalEntries]);

  const transportTone = deriveTransportIndicatorTone(shell.transportState);
  const registrationTone = deriveRegistrationIndicatorTone(shell.effectiveRegistrationState);
  const summaryTone = deriveSummaryIndicatorTone(
    shell.transportState,
    shell.effectiveRegistrationState,
  );

  const liveStateSummary = t("settings.systemState.liveSummary", {
    transport: transportLabel,
    registration: registrationLabel,
    summary: summaryText,
  });

  return (
    <div className={formStyles.panelStack} data-testid="settings-system-state-panel">
      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.systemState.currentState.legend")}
        </legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <p className={styles.liveSummary} aria-live="polite" aria-atomic="true">
              {liveStateSummary}
            </p>
            <dl className={styles.statePanel}>
              <div className={styles.stateGrid}>
                <StateWithActionsRow
                  metric={{
                    indicatorLabel: t("settings.systemState.metric.serverAria", {
                      value: transportLabel,
                    }),
                    tone: transportTone,
                    label: t("settings.systemState.metric.server"),
                    testId: "settings-sip-transport-state",
                    value: transportLabel,
                    reason: shell.transportFailureReason,
                  }}
                >
                  <ManualActionButton
                    testId="settings-sip-manual-transport-reconnect"
                    reasonTestId="settings-sip-transport-disabled-reason"
                    label={t("settings.systemState.action.reconnectServer")}
                    loadingLabel={t("settings.systemState.action.reconnecting")}
                    disabled={manualTransportDisabledReason !== null}
                    disabledReason={manualTransportDisabledReason}
                    isLoading={actionLoading === "transport"}
                    onClick={onManualTransportReconnect}
                  />
                </StateWithActionsRow>
                <StateWithActionsRow
                  metric={{
                    indicatorLabel: t("settings.systemState.metric.registrationAria", {
                      value: registrationLabel,
                    }),
                    tone: registrationTone,
                    label: t("settings.systemState.metric.registration"),
                    testId: "settings-sip-registration-state",
                    value: registrationLabel,
                    reason: shell.registrationFailureReason,
                  }}
                >
                  <>
                    <ManualActionButton
                      testId="settings-sip-manual-reregister"
                      reasonTestId="settings-sip-reregister-disabled-reason"
                      label={t("settings.systemState.action.reregister")}
                      loadingLabel={t("settings.systemState.action.reregistering")}
                      disabled={manualReregisterDisabledReason !== null}
                      disabledReason={manualReregisterDisabledReason}
                      isLoading={actionLoading === "reregister"}
                      onClick={onManualReregister}
                    />
                  </>
                </StateWithActionsRow>
                <StateWithActionsRow
                  metric={{
                    indicatorLabel: t("settings.systemState.metric.summaryAria", {
                      value: summaryText,
                    }),
                    tone: summaryTone,
                    label: t("settings.systemState.metric.summary"),
                    testId: "settings-sip-summary-label",
                    value: summaryText,
                    reason: null,
                  }}
                />
              </div>
            </dl>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.systemState.autoRecovery.legend")}
        </legend>
        <div className={formStyles.settingsGroup}>
          <p className={clsx(formStyles.fieldDescription, styles.recoveryIntro)}>
            {t("settings.systemState.autoRecovery.intro")}
          </p>

          <div className={styles.recoverySubsection} data-testid="settings-sip-recovery-server">
            <h4 className={styles.recoverySubsectionTitle}>
              {t("settings.systemState.autoRecovery.serverTitle")}
            </h4>
            <div className={styles.recoveryBlock}>
              <div className={formStyles.settingBlock}>
                <label className={formStyles.toggleRow} htmlFor="settings-sip-auto-reconnect">
                <span className={formStyles.toggleText}>
                  <span className={formStyles.toggleLabel}>
                    {t("settings.systemState.autoRecovery.serverToggleLabel")}
                  </span>
                  <span
                    id={autoReconnectDescriptionId}
                    className={formStyles.toggleDescription}
                  >
                    {t("settings.systemState.autoRecovery.serverToggleDescription")}
                  </span>
                </span>
                <span className={formStyles.switch}>
                  <input
                    id="settings-sip-auto-reconnect"
                    type="checkbox"
                    className={formStyles.switchInput}
                    data-testid="settings-sip-auto-reconnect-toggle"
                    checked={sipAutoReconnectEnabled}
                    aria-describedby={autoReconnectDescriptionId}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      onSipAutoReconnectChange(event.target.checked);
                    }}
                  />
                  <span className={formStyles.switchSlider} aria-hidden="true" />
                </span>
              </label>
            </div>
            <div
              className={clsx(
                styles.dependentFields,
                !sipAutoReconnectEnabled && styles.dependentFieldsCollapsed,
              )}
            >
              <div
                className={clsx(
                  styles.dependentFieldsInner,
                  !sipAutoReconnectEnabled && styles.dependentFieldsInnerMuted,
                )}
              >
                <div
                  className={clsx(
                    formStyles.settingBlock,
                    !sipAutoReconnectEnabled && formStyles.settingBlockDisabled,
                  )}
                >
                  <NumberField
                    id="settings-sip-reconnect-interval"
                    label={t("settings.systemState.autoRecovery.reconnectIntervalLabel")}
                    description={t("settings.systemState.autoRecovery.reconnectIntervalHint", {
                      minSec: MIN_SIP_RECONNECT_INTERVAL_SEC,
                    })}
                    testId="settings-sip-reconnect-interval"
                    value={sipReconnectIntervalSec}
                    min={MIN_SIP_RECONNECT_INTERVAL_SEC}
                    disabled={!sipAutoReconnectEnabled}
                    withSuffix
                    onChange={onSipReconnectIntervalChange}
                  />
                  <NumberField
                    id="settings-sip-reconnect-max-attempts"
                    label={t("settings.systemState.autoRecovery.reconnectAttemptsLabel")}
                    testId="settings-sip-reconnect-max-attempts"
                    value={sipReconnectMaxAttempts}
                    min={1}
                    disabled={!sipAutoReconnectEnabled}
                    onChange={onSipReconnectMaxAttemptsChange}
                  />
                </div>
              </div>
            </div>
            </div>
          </div>

          <div
            className={styles.recoverySubsection}
            data-testid="settings-sip-recovery-registration"
          >
            <h4 className={styles.recoverySubsectionTitle}>
              {t("settings.systemState.autoRecovery.registrationTitle")}
            </h4>
            <div className={styles.recoveryBlock}>
              <div className={formStyles.settingBlock}>
                <label className={formStyles.toggleRow} htmlFor="settings-sip-auto-reregister">
                <span className={formStyles.toggleText}>
                  <span className={formStyles.toggleLabel}>
                    {t("settings.systemState.autoRecovery.reregisterToggleLabel")}
                  </span>
                  <span
                    id={autoReregisterDescriptionId}
                    className={formStyles.toggleDescription}
                  >
                    {t("settings.systemState.autoRecovery.reregisterToggleDescription")}
                  </span>
                </span>
                <span className={formStyles.switch}>
                  <input
                    id="settings-sip-auto-reregister"
                    type="checkbox"
                    className={formStyles.switchInput}
                    data-testid="settings-sip-auto-reregister-toggle"
                    checked={sipAutoReregisterEnabled}
                    aria-describedby={autoReregisterDescriptionId}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      onSipAutoReregisterChange(event.target.checked);
                    }}
                  />
                  <span className={formStyles.switchSlider} aria-hidden="true" />
                </span>
              </label>
            </div>
            <div
              className={clsx(
                styles.dependentFields,
                !sipAutoReregisterEnabled && styles.dependentFieldsCollapsed,
              )}
            >
              <div
                className={clsx(
                  styles.dependentFieldsInner,
                  !sipAutoReregisterEnabled && styles.dependentFieldsInnerMuted,
                )}
              >
                <div
                  className={clsx(
                    formStyles.settingBlock,
                    !sipAutoReregisterEnabled && formStyles.settingBlockDisabled,
                  )}
                >
                  <NumberField
                    id="settings-sip-reregister-interval"
                    label={t("settings.systemState.autoRecovery.reregisterIntervalLabel")}
                    description={t("settings.systemState.autoRecovery.reregisterIntervalHint", {
                      minSec: MIN_SIP_REREGISTER_INTERVAL_SEC,
                    })}
                    testId="settings-sip-reregister-interval"
                    value={sipReregisterIntervalSec}
                    min={MIN_SIP_REREGISTER_INTERVAL_SEC}
                    disabled={!sipAutoReregisterEnabled}
                    withSuffix
                    onChange={onSipReregisterIntervalChange}
                  />
                  <NumberField
                    id="settings-sip-reregister-max-attempts"
                    label={t("settings.systemState.autoRecovery.reregisterAttemptsLabel")}
                    testId="settings-sip-reregister-max-attempts"
                    value={sipReregisterMaxAttempts}
                    min={1}
                    disabled={!sipAutoReregisterEnabled}
                    onChange={onSipReregisterMaxAttemptsChange}
                  />
                </div>
              </div>
            </div>
            </div>

            <div className={styles.recoveryBlock}>
              <div className={formStyles.settingBlock}>
                <label
                  className={formStyles.toggleRow}
                  htmlFor="settings-sip-auto-register-startup"
                >
                  <span className={formStyles.toggleText}>
                    <span className={formStyles.toggleLabel}>
                      {t("settings.systemState.autoRecovery.startupToggleLabel")}
                    </span>
                    <span
                      id={autoRegisterStartupDescriptionId}
                      className={formStyles.toggleDescription}
                    >
                      {t("settings.systemState.autoRecovery.startupToggleDescription")}
                    </span>
                  </span>
                  <span className={formStyles.switch}>
                    <input
                      id="settings-sip-auto-register-startup"
                      type="checkbox"
                      className={formStyles.switchInput}
                      data-testid="settings-sip-auto-register-startup-toggle"
                      checked={sipAutoRegisterOnStartup}
                      aria-describedby={autoRegisterStartupDescriptionId}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        onSipAutoRegisterOnStartupChange(event.target.checked);
                      }}
                    />
                    <span className={formStyles.switchSlider} aria-hidden="true" />
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>
          {t("settings.systemState.journal.legend")}
        </legend>
        <div className={formStyles.settingsGroup}>
          <div className={styles.journalContainer} data-testid="settings-sip-journal">
            {shell.journalEntries.length === 0 ? (
              <div className={styles.journalEmpty} data-testid="settings-sip-journal-empty">
                <AppIcon
                  id="shell.diagnostics"
                  className={styles.journalEmptyIcon ?? ""}
                  decorative={false}
                  label={t("settings.systemState.journal.emptyIconLabel")}
                  size={28}
                />
                <p className={styles.journalEmptyTitle}>
                  {t("settings.systemState.journal.emptyTitle")}
                </p>
                <p className={clsx(formStyles.fieldDescription, styles.journalEmptyHint)}>
                  {t("settings.systemState.journal.emptyHint")}
                </p>
              </div>
            ) : (
              <ul className={styles.journalList} role="list">
                {shell.journalEntries.map((entry) => {
                  const key = journalEntryKey(entry);
                  const detail = entry.detail === null ? "" : ` — ${entry.detail}`;
                  return (
                    <li
                      key={key}
                      className={clsx(
                        styles.journalEntry,
                        highlightedKeys.has(key) && styles.journalEntryHighlight,
                      )}
                      data-testid="settings-sip-journal-entry"
                      data-category={entry.category}
                    >
                      <span className={styles.journalTime}>
                        {formatLocaleDateTime(entry.timestamp, language)}
                      </span>
                      <span className={styles.journalEvent}>{entry.eventType}</span>
                      <span className={styles.journalCorrelation}>{entry.correlationId}</span>
                      {detail.length > 0 ? (
                        <span className={styles.journalDetail}>{detail}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className={styles.journalActions}>
            <button
              type="button"
              className={formStyles.secondaryButton}
              data-testid="settings-sip-journal-clear"
              disabled={shell.journalEntries.length === 0}
              aria-disabled={shell.journalEntries.length === 0}
              onClick={onClearJournal}
            >
              {t("settings.systemState.journal.clear")}
            </button>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
