import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import { mapCampaignModalDisabledReasonWithFallback } from "../../helpers/mapCampaignModalDisabledReason.js";
import { IconControlButton } from "../icons/index.js";
import dialogStyles from "../shell/DialogPanel.module.css";
import styles from "./CampaignEventModal.module.css";

export type CampaignEventModalProps = Readonly<{
  open: boolean;
  title: string;
  progressive: boolean;
  acceptDisabledReason: string | null;
  rejectDisabledReason: string | null;
  responseError: string | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}>;

/**
 * - Purpose: present non-progressive campaign accept/reject modal (LF-039).
 * - Inputs: visibility, title, disabled reasons, callbacks.
 * - Outputs: accessible campaign dialog without business logic.
 */
export function CampaignEventModal({
  open,
  title,
  progressive,
  acceptDisabledReason,
  rejectDisabledReason,
  responseError,
  onAccept,
  onReject,
  onClose,
}: CampaignEventModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  if (!open || progressive) {
    return null;
  }

  const closeAllowed =
    acceptDisabledReason === null && rejectDisabledReason === null;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Escape" && closeAllowed) {
      onClose();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      "button, [tabindex]:not([tabindex='-1'])",
    );
    if (focusable === undefined || focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === undefined || last === undefined) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <section
      ref={modalRef}
      role="dialog"
      aria-label="Запрос кампании"
      aria-modal="true"
      tabIndex={-1}
      className={dialogStyles["modal"]}
      data-testid="campaign-event-modal"
      onKeyDown={handleKeyDown}
    >
      <h2>{title}</h2>
      <p>Примите или отклоните этот запрос кампании.</p>

      {responseError !== null && (
        <div className={styles["error"]} role="alert" data-testid="campaign-modal-error">
          {responseError}
        </div>
      )}

      <div className={dialogStyles["actions"]}>
        <IconControlButton
          iconId="action.confirm"
          ariaLabel="Принять запрос кампании"
          tooltipLabel="Принять"
          testId="campaign-accept"
          className={styles["iconButton"]}
          disabledReason={
            acceptDisabledReason === null
              ? null
              : mapCampaignModalDisabledReasonWithFallback(acceptDisabledReason)
          }
          onClick={onAccept}
        />
        <IconControlButton
          iconId="call.reject"
          ariaLabel="Отклонить запрос кампании"
          tooltipLabel="Отклонить"
          testId="campaign-reject"
          className={styles["iconButton"]}
          disabledReason={
            rejectDisabledReason === null
              ? null
              : mapCampaignModalDisabledReasonWithFallback(rejectDisabledReason)
          }
          onClick={onReject}
        />
        <IconControlButton
          iconId="overlay.close"
          ariaLabel="Закрыть запрос кампании"
          testId="campaign-modal-close"
          className={styles["closeButton"]}
          disabled={!closeAllowed}
          onClick={onClose}
        />
      </div>

      {renderDisabledReason(acceptDisabledReason, rejectDisabledReason)}
    </section>
  );
}

function renderDisabledReason(
  acceptReason: string | null,
  rejectReason: string | null,
): JSX.Element | null {
  const reason = acceptReason ?? rejectReason;
  if (reason === null) {
    return null;
  }

  return (
    <p className={styles["disabledReason"]} data-testid="campaign-disabled-reason" role="status">
      {mapCampaignModalDisabledReasonWithFallback(reason)}
    </p>
  );
}
