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
import styles from "./OcpRejectBreakReasonModal.module.css";

export type OcpRejectBreakReasonItem = Readonly<{
  id: number;
  label: string;
}>;

export type OcpRejectBreakReasonModalProps = Readonly<{
  open: boolean;
  reasons: ReadonlyArray<OcpRejectBreakReasonItem>;
  selectedReasonId: number | null;
  submitting: boolean;
  onSelectReason: (reasonId: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: blurred-scrim dialog to pick a break reason before rejecting an inbound call.
 * - Inputs: open flag, reason list, selection, submitting flag, callbacks.
 * - Outputs: presentational Dialog with radio list and confirm/cancel actions.
 * @uiMeta f=F-028
 */
export function OcpRejectBreakReasonModal({
  open,
  reasons,
  selectedReasonId,
  submitting,
  onSelectReason,
  onConfirm,
  onCancel,
}: OcpRejectBreakReasonModalProps): JSX.Element {
  const { t } = useI18n();
  const confirmDisabled =
    submitting || selectedReasonId === null || reasons.length === 0;

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
        data-testid="ocp-reject-break-modal"
        closeLabel={t("common.close")}
        showCloseButton={!submitting}
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
          <DialogTitle>{t("ocp.incomingCall.breakModal.title")}</DialogTitle>
          <DialogDescription>
            {t("ocp.incomingCall.breakModal.description")}
          </DialogDescription>
        </DialogHeader>

        {reasons.length === 0 ? (
          <p className={styles.empty} data-testid="ocp-reject-break-empty">
            {t("ocp.incomingCall.breakModal.empty")}
          </p>
        ) : (
          <ul
            className={styles.list}
            role="radiogroup"
            aria-label={t("ocp.incomingCall.breakModal.reasonsAria")}
          >
            {reasons.map((reason) => {
              const selected = reason.id === selectedReasonId;
              return (
                <li key={reason.id}>
                  <label
                    className={clsx(styles.option, selected && styles.optionSelected)}
                    data-testid={`ocp-reject-break-reason-${reason.id}`}
                  >
                    <input
                      type="radio"
                      className={styles.radio}
                      name="ocp-reject-break-reason"
                      value={reason.id}
                      checked={selected}
                      disabled={submitting}
                      aria-label={t("ocp.incomingCall.breakModal.reasonOptionAria", {
                        label: reason.label,
                      })}
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

        <DialogFooter className={styles.footer}>
          <Button
            type="button"
            variant="ghost"
            data-testid="ocp-reject-break-cancel"
            aria-label={t("ocp.incomingCall.breakModal.cancelAria")}
            disabled={submitting}
            onClick={onCancel}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="ocp-reject-break-confirm"
            aria-label={t("ocp.incomingCall.breakModal.confirmAria")}
            disabled={confirmDisabled}
            loading={submitting}
            onClick={onConfirm}
          >
            {t("ocp.incomingCall.breakModal.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
