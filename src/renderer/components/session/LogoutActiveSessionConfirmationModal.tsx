import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import { AppIcon, IconControlButton } from "../icons/index.js";
import dialogStyles from "../shell/DialogPanel.module.css";
import styles from "./LogoutActiveSessionConfirmationModal.module.css";

export type LogoutActiveSessionConfirmationModalProps = Readonly<{
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: confirm SIP session logout when active telephony exists (LF-079).
 * - Inputs: modal visibility and confirm/cancel callbacks.
 * - Outputs: accessible blocking confirmation dialog without business logic.
 */
export function LogoutActiveSessionConfirmationModal({
  open,
  onConfirm,
  onCancel,
}: LogoutActiveSessionConfirmationModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Escape") {
      onCancel();
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
      aria-label="Confirm end session"
      aria-modal="true"
      tabIndex={-1}
      className={dialogStyles["modal"]}
      data-testid="logout-active-session-modal"
      onKeyDown={handleKeyDown}
    >
      <h2 className={styles["title"]}>
        <span className={styles["titleIcon"]}>
          <AppIcon id="session.end" decorative />
        </span>
        End session
      </h2>
      <p>Есть активный звонок. Завершить звонки и выйти?</p>

      <div className={dialogStyles["actions"]}>
        <IconControlButton
          iconId="session.end"
          ariaLabel="Confirm end session"
          testId="control-logout-confirm"
          className={styles["iconButton"]}
          onClick={onConfirm}
        />
        <IconControlButton
          iconId="overlay.close"
          ariaLabel="Cancel end session"
          tooltipLabel="Cancel"
          testId="control-logout-cancel"
          className={styles["iconButton"]}
          onClick={onCancel}
        />
      </div>
    </section>
  );
}
