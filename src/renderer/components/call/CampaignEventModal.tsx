import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import { mapCampaignModalDisabledReasonWithFallback } from "../../helpers/mapCampaignModalDisabledReason.js";

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
      aria-label="Campaign request"
      aria-modal="true"
      tabIndex={-1}
      className="campaign-event-modal"
      data-testid="campaign-event-modal"
      onKeyDown={handleKeyDown}
    >
      <h2>{title}</h2>
      <p>Accept or reject this campaign request.</p>

      {responseError !== null && (
        <div role="alert" data-testid="campaign-modal-error">
          {responseError}
        </div>
      )}

      <div className="campaign-event-modal__actions">
        <button
          type="button"
          data-testid="campaign-accept"
          aria-label="Accept campaign request"
          disabled={acceptDisabledReason !== null}
          onClick={onAccept}
        >
          Accept
        </button>
        <button
          type="button"
          data-testid="campaign-reject"
          aria-label="Reject campaign request"
          disabled={rejectDisabledReason !== null}
          onClick={onReject}
        >
          Reject
        </button>
        <button
          type="button"
          data-testid="campaign-modal-close"
          aria-label="Close campaign request"
          disabled={!closeAllowed}
          onClick={onClose}
        >
          Close
        </button>
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
    <p data-testid="campaign-disabled-reason" role="status">
      {mapCampaignModalDisabledReasonWithFallback(reason)}
    </p>
  );
}
