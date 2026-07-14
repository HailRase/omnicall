import clsx from "clsx";
import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/button/Button.js";
import { ShellDialpadPanel } from "../../shell/ShellDialpadPanel.js";
import styles from "./OcpLogoutReasonModal.module.css";

export type OcpLogoutReasonItem = Readonly<{
  id: number;
  label: string;
}>;

export type OcpLogoutReasonModalProps = Readonly<{
  open: boolean;
  reasons: ReadonlyArray<OcpLogoutReasonItem>;
  selectedReasonId: number | null;
  submitting: boolean;
  /** When false, Confirm stays enabled without a selected reason (OCP connected-only disconnect). */
  requireReasonSelection?: boolean;
  onSelectReason: (reasonId: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: contacts/history-like left panel to pick an OCP logout reason before session exit.
 * - Inputs: open flag, reason list, selection, submitting flag, callbacks.
 * - Outputs: presentational ShellDialpadPanel with radio list and footer actions.
 * @uiMeta f=F-028 lf=LF-048
 */
export function OcpLogoutReasonModal({
  open,
  reasons,
  selectedReasonId,
  submitting,
  requireReasonSelection = true,
  onSelectReason,
  onConfirm,
  onCancel,
}: OcpLogoutReasonModalProps): JSX.Element {
  const { t } = useI18n();
  const confirmDisabled =
    submitting ||
    (requireReasonSelection && (selectedReasonId === null || reasons.length === 0));

  return (
    <ShellDialpadPanel
      open={open}
      title={t("ocp.logout.modal.title")}
      testId="ocp-logout-reasons-modal"
      closeButtonTestId="ocp-logout-cancel"
      presentation="sidebar"
      onClose={onCancel}
      footer={
        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="ghost"
            data-testid="ocp-logout-cancel-action"
            aria-label={t("ocp.logout.modal.cancelAria")}
            disabled={submitting}
            onClick={onCancel}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="ocp-logout-confirm"
            aria-label={t("ocp.logout.modal.confirmAria")}
            disabled={confirmDisabled}
            loading={submitting}
            onClick={onConfirm}
          >
            {t("ocp.logout.modal.confirm")}
          </Button>
        </div>
      }
    >
      <p className={styles.description}>{t("ocp.logout.modal.description")}</p>
      {reasons.length === 0 ? (
        <p className={styles.empty} data-testid="ocp-logout-reasons-empty">
          {t("ocp.logout.modal.empty")}
        </p>
      ) : (
        <ul className={styles.list} role="radiogroup" aria-label={t("ocp.logout.modal.reasonsAria")}>
          {reasons.map((reason) => {
            const selected = reason.id === selectedReasonId;
            return (
              <li key={reason.id}>
                <label
                  className={clsx(styles.option, selected && styles.optionSelected)}
                  data-testid={`ocp-logout-reason-${reason.id}`}
                >
                  <input
                    type="radio"
                    className={styles.radio}
                    name="ocp-logout-reason"
                    value={reason.id}
                    checked={selected}
                    disabled={submitting}
                    aria-label={t("ocp.logout.modal.reasonOptionAria", { label: reason.label })}
                    onChange={() => {
                      onSelectReason(reason.id);
                    }}
                  />
                  <span className={styles.label}>{reason.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </ShellDialpadPanel>
  );
}
