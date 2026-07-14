import clsx from "clsx";
import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/button/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog/index.js";
import styles from "./OcpPostCallStatusModal.module.css";

export type OcpPostCallStatusModalProps = Readonly<{
  open: boolean;
  pendingReasonLabel: string;
  chosenAction: "finish" | "reserve" | null;
  submitting: boolean;
  onChooseFinish: () => void;
  onChooseReserve: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: blurred dialog to choose finish-vs-reserve during post-call processing.
 * - Inputs: open flag, pending reason, selected action, submitting, callbacks.
 * - Outputs: single-step presentational Dialog (status summary + two actions + footer).
 * @uiMeta f=F-028 lf=LF-044
 */
export function OcpPostCallStatusModal({
  open,
  pendingReasonLabel,
  chosenAction,
  submitting,
  onChooseFinish,
  onChooseReserve,
  onConfirm,
  onCancel,
}: OcpPostCallStatusModalProps): JSX.Element {
  const { t } = useI18n();
  const confirmDisabled = submitting || chosenAction === null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) {
          onCancel();
        }
      }}
    >
      <DialogContent
        size="sm"
        data-testid="ocp-post-call-status-modal"
        closeLabel={t("common.close")}
        showCloseButton={false}
        onPointerDownOutside={(event) => {
          if (submitting) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (submitting) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("ocp.postCall.modal.title")}</DialogTitle>
          <DialogDescription>{t("ocp.postCall.modal.description")}</DialogDescription>
        </DialogHeader>

        <div className={styles.summary} data-testid="ocp-post-call-pending-reason">
          <span className={styles.summaryLabel}>
            {t("ocp.postCall.modal.pendingStatus")}
          </span>
          <span className={styles.summaryValue}>{pendingReasonLabel}</span>
        </div>

        <div className={styles.actionsColumn} role="radiogroup" aria-label={t("ocp.postCall.modal.actionsAria")}>
          <button
            type="button"
            className={clsx(
              styles.choiceCard,
              chosenAction === "finish" && styles.choiceCardSelected,
            )}
            data-testid="ocp-post-call-choose-finish"
            disabled={submitting}
            aria-pressed={chosenAction === "finish"}
            onClick={onChooseFinish}
          >
            <span className={styles.choiceTitle}>{t("ocp.postCall.modal.finish")}</span>
            <span className={styles.choiceHint}>{t("ocp.postCall.modal.finishHint")}</span>
          </button>
          <button
            type="button"
            className={clsx(
              styles.choiceCard,
              chosenAction === "reserve" && styles.choiceCardSelected,
            )}
            data-testid="ocp-post-call-choose-reserve"
            disabled={submitting}
            aria-pressed={chosenAction === "reserve"}
            onClick={onChooseReserve}
          >
            <span className={styles.choiceTitle}>{t("ocp.postCall.modal.reserve")}</span>
            <span className={styles.choiceHint}>{t("ocp.postCall.modal.reserveHint")}</span>
          </button>
        </div>

        <DialogFooter className={styles.footer}>
          <Button
            type="button"
            variant="ghost"
            data-testid="ocp-post-call-cancel"
            disabled={submitting}
            onClick={onCancel}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            data-testid="ocp-post-call-confirm"
            disabled={confirmDisabled}
            loading={submitting}
            onClick={onConfirm}
          >
            {t("ocp.postCall.modal.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
