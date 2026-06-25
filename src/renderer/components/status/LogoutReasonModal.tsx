import { useEffect, useRef, type JSX } from "react";
import { RejectReasonSelector } from "../call/RejectReasonSelector.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
import dialogStyles from "../shell/DialogPanel.module.css";
import styles from "./LogoutReasonModal.module.css";

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
      aria-label="Причина выхода"
      aria-modal="true"
      tabIndex={-1}
      className={dialogStyles["modal"]}
      data-testid="logout-reason-modal"
    >
      <h2 className={styles["title"]}>
        <span className={styles["titleIcon"]}>
          <AppIcon id="operator.logout" decorative />
        </span>
        Выход
      </h2>
      <p>Выберите причину перед выходом с платформы оператора.</p>

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
          Причина (необязательно)
          <input
            type="text"
            data-testid="logout-reason-input"
            aria-label="Причина выхода"
            value={selectedReason ?? ""}
            onChange={(event) => {
              onSelectReason(event.currentTarget.value);
            }}
          />
        </label>
      )}

      <div className={dialogStyles["actions"]}>
        <IconControlButton
          iconId="operator.logout"
          ariaLabel="Подтвердить выход"
          testId="control-logout-submit"
          className={styles["iconButton"]}
          disabled={submitDisabled}
          onClick={onSubmit}
        />
        <IconControlButton
          iconId="overlay.close"
          ariaLabel="Отменить выход"
          tooltipLabel="Отмена"
          testId="control-logout-cancel"
          className={styles["iconButton"]}
          onClick={onClose}
        />
      </div>
    </section>
  );
}
