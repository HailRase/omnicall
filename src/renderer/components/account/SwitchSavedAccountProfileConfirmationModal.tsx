import { useEffect, useRef, type JSX, type KeyboardEvent } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
import dialogStyles from "../shell/DialogPanel.module.css";
import styles from "./SwitchSavedAccountProfileConfirmationModal.module.css";

export type SwitchSavedAccountProfileConfirmationModalProps = Readonly<{
  open: boolean;
  fromLogin: string;
  toLogin: string;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: confirm switching registered SIP profile to another saved identity.
 * - Inputs: modal visibility, from/to login labels, confirm/cancel callbacks.
 * - Outputs: accessible blocking confirmation dialog without business logic.
 */
export function SwitchSavedAccountProfileConfirmationModal({
  open,
  fromLogin,
  toLogin,
  onConfirm,
  onCancel,
}: SwitchSavedAccountProfileConfirmationModalProps): JSX.Element | null {
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
      role="alertdialog"
      aria-label={t("account.profile.switch.confirmDialogAria")}
      aria-modal="true"
      tabIndex={-1}
      className={dialogStyles.modal}
      data-testid="switch-saved-account-profile-modal"
      onKeyDown={handleKeyDown}
    >
      <h2 className={styles.title}>
        <span className={styles.titleIcon}>
          <AppIcon id="action.confirm" decorative />
        </span>
        {t("account.profile.switch.confirmTitle")}
      </h2>
      <p>{t("account.profile.switch.confirmMessage", { fromLogin, toLogin })}</p>

      <div className={dialogStyles.actions}>
        <IconControlButton
          iconId="action.confirm"
          ariaLabel={t("account.profile.switch.confirmAria")}
          testId="switch-saved-account-profile-confirm"
          className={styles.iconButton}
          onClick={onConfirm}
        />
        <IconControlButton
          iconId="overlay.close"
          ariaLabel={t("account.profile.switch.cancelAria")}
          tooltipLabel={t("common.cancel")}
          testId="switch-saved-account-profile-cancel"
          className={styles.iconButton}
          onClick={onCancel}
        />
      </div>
    </section>
  );
}
