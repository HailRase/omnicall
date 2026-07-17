import clsx from "clsx";
import { useId, type JSX } from "react";
import type { OcpRecoveryAction, OcpSystemStateShellView } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SettingsSystemStatePanel.module.css";
import {
  deriveOcpAuthorizationIndicatorTone,
  deriveOcpServerIndicatorTone,
  type SipStateIndicatorTone,
} from "./settingsSystemStatePanelHelpers.js";

export type SettingsSystemStateOcpTabProps = Readonly<{
  shell: OcpSystemStateShellView;
  recoveryActionLoading: OcpRecoveryAction | null;
  onRecoveryAction: (action: OcpRecoveryAction) => void;
}>;

const STATE_INDICATOR_TONE_CLASS: Record<SipStateIndicatorTone, string> = {
  positive: styles.stateIndicatorPositive,
  progress: styles.stateIndicatorProgress,
  negative: styles.stateIndicatorNegative,
  neutral: styles.stateIndicatorNeutral,
};

const RECOVERY_ACTION_TEST_ID: Readonly<Record<OcpRecoveryAction, string>> = {
  retry_server: "settings-ocp-retry-server",
  retry_authorization: "settings-ocp-retry-authorization",
  reconnect: "settings-ocp-reconnect",
};

/**
 * - Purpose: present OCP Server/Authorization status and dual-FSM recovery (System State).
 * - Inputs: derived OcpSystemStateShellView + recovery callbacks.
 * - Outputs: accessible OCP tab content without facade or WebSocket access.
 * @uiMeta lf=LF-057 f=F-016,F-028
 */
export function SettingsSystemStateOcpTab({
  shell,
  recoveryActionLoading,
  onRecoveryAction,
}: SettingsSystemStateOcpTabProps): JSX.Element {
  const { t } = useI18n();
  const serverLabel = t(shell.serverStateLabelKey);
  const authorizationLabel = t(shell.authorizationStateLabelKey);
  const serverTone = deriveOcpServerIndicatorTone(shell.serverState);
  const authorizationTone = deriveOcpAuthorizationIndicatorTone(shell.authorizationState);
  const liveSummary = t("settings.systemState.ocp.liveSummary", {
    server: serverLabel,
    authorization: authorizationLabel,
  });

  return (
    <fieldset
      className={formStyles.sectionCard}
      data-testid="settings-system-state-ocp-tab"
    >
      <legend className={formStyles.sectionTitle}>
        {t("settings.systemState.currentState.legend")}
      </legend>
      <div className={formStyles.settingsGroup}>
        <div className={formStyles.settingBlock}>
          <p className={styles.liveSummary} aria-live="polite" aria-atomic="true">
            {liveSummary}
          </p>
          <dl className={styles.statePanel}>
            <div className={styles.stateGrid}>
              <OcpStateRow
                tone={serverTone}
                indicatorLabel={t("settings.systemState.metric.serverAria", {
                  value: serverLabel,
                })}
                label={t("settings.systemState.metric.server")}
                testId="settings-ocp-server-status"
                value={serverLabel}
              />
              <OcpStateRow
                tone={authorizationTone}
                indicatorLabel={t("settings.systemState.ocp.metric.authorizationAria", {
                  value: authorizationLabel,
                })}
                label={t("settings.systemState.ocp.metric.authorization")}
                testId="settings-ocp-authorization-status"
                value={authorizationLabel}
              />
            </div>
          </dl>
          {shell.allowedRecoveryActions.length > 0 ? (
            <div className={styles.manualActionList} data-testid="settings-ocp-recovery-actions">
              {shell.allowedRecoveryActions.map((action) => {
                const label = t(shell.recoveryActionLabelKeys[action]);
                const isPrimary = shell.primaryRecoveryAction === action;
                const isLoading = recoveryActionLoading === action;
                return (
                  <div key={action} className={styles.manualActionItem}>
                    <Button
                      variant={isPrimary ? "primary" : "secondary"}
                      size="sm"
                      data-testid={RECOVERY_ACTION_TEST_ID[action]}
                      disabled={recoveryActionLoading !== null}
                      loading={isLoading}
                      aria-label={label}
                      onClick={() => {
                        onRecoveryAction(action);
                      }}
                    >
                      {label}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}

type OcpStateRowProps = Readonly<{
  tone: SipStateIndicatorTone;
  indicatorLabel: string;
  label: string;
  testId: string;
  value: string;
}>;

function OcpStateRow({
  tone,
  indicatorLabel,
  label,
  testId,
  value,
}: OcpStateRowProps): JSX.Element {
  const reasonId = useId();
  return (
    <div className={styles.stateRow}>
      <span
        className={clsx(styles.stateIndicator, STATE_INDICATOR_TONE_CLASS[tone])}
        role="img"
        aria-label={indicatorLabel}
        aria-describedby={reasonId}
      />
      <dt className={styles.stateLabel}>{label}</dt>
      <dd className={styles.stateValue} data-testid={testId} id={reasonId}>
        {value}
      </dd>
    </div>
  );
}
