import { useEffect, useRef, type JSX } from "react";
import { RejectReasonSelector } from "../call/RejectReasonSelector.js";
import dialogStyles from "../shell/DialogPanel.module.css";

export type LogoutReasonModalProps = Readonly<{
  open: boolean;
  reasons: ReadonlyArray<string>;
  reasonRequired: boolean;
  selectedReason: string | null;
  onSelectReason: (reason: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}>;

/**
 * - Purpose: capture logout reason and submit to LogoutOperatorUseCase (LF-047).
 * - Inputs: modal visibility, reason list, selection, and submit/close callbacks.
 * - Outputs: accessible logout reason dialog without business logic.
 */
export function LogoutReasonModal({
  open,
  reasons,
  reasonRequired,
  selectedReason,
  onSelectReason,
  onSubmit,
  onClose,
}: LogoutReasonModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const submitDisabled =
    reasonRequired && (selectedReason === null || selectedReason.length === 0);

  return (
    <section
      ref={modalRef}
      role="dialog"
      aria-label="Logout reason"
      aria-modal="true"
      tabIndex={-1}
      className={dialogStyles["modal"]}
      data-testid="logout-reason-modal"
    >
      <h2>Logout</h2>
      <p>Select a reason before logging out from the operator platform.</p>

      {reasonRequired ? (
        <RejectReasonSelector
          reasons={reasons}
          selectedReason={selectedReason}
          required
          disabled={false}
          onSelect={onSelectReason}
        />
      ) : (
        <label>
          Reason (optional)
          <input
            type="text"
            data-testid="logout-reason-input"
            aria-label="Logout reason"
            value={selectedReason ?? ""}
            onChange={(event) => {
              onSelectReason(event.currentTarget.value);
            }}
          />
        </label>
      )}

      <div className={dialogStyles["actions"]}>
        <button
          type="button"
          data-testid="control-logout-submit"
          aria-label="Confirm logout"
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          Logout
        </button>
        <button
          type="button"
          data-testid="control-logout-cancel"
          aria-label="Cancel logout"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
