import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
import dialogStyles from "../shell/DialogPanel.module.css";
import styles from "./LogoutActiveSessionConfirmationModal.module.css";

export type LogoutActiveSessionConfirmationModalProps = Readonly<{
  open: boolean;
  delayedJobsWaiting?: boolean | undefined;
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
  delayedJobsWaiting = false,
  onConfirm,
  onCancel,
}: LogoutActiveSessionConfirmationModalProps): JSX.Element | null {
  const { t } = useI18n();
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
      aria-label={t("session.logout.confirmDialogAria")}
      aria-modal="true"
      tabIndex={-1}
      className={dialogStyles.modal}
      data-testid="logout-active-session-modal"
      onKeyDown={handleKeyDown}
    >
      <h2 className={styles.title}>
        <span className={styles.titleIcon}>
          <AppIcon id="session.end" decorative />
        </span>
        {t("session.logout.title")}
      </h2>
      <p>{t("session.logout.confirmMessage")}</p>
      {delayedJobsWaiting ? (
        <p data-testid="logout-delayed-jobs-warning">
          {t("session.logout.delayedJobsWarning")}
        </p>
      ) : null}

      <div className={dialogStyles.actions}>
        <IconControlButton
          iconId="session.end"
          ariaLabel={t("session.logout.confirmAria")}
          testId="control-logout-confirm"
          className={styles.iconButton}
          onClick={onConfirm}
        />
        <IconControlButton
          iconId="overlay.close"
          ariaLabel={t("session.logout.cancelAria")}
          tooltipLabel={t("common.cancel")}
          testId="control-logout-cancel"
          className={styles.iconButton}
          onClick={onCancel}
        />
      </div>
    </section>
  );
}
