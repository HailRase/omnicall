import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/index.js";
import styles from "./DeleteSavedAccountProfileConfirmationModal.module.css";

export type DeleteSavedAccountProfileConfirmationModalProps = Readonly<{
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: confirm deletion of a saved SIP account profile (F-024).
 * - Inputs: modal visibility and confirm/cancel callbacks.
 * - Outputs: accessible blocking alert dialog without business logic.
 */
export function DeleteSavedAccountProfileConfirmationModal({
  open,
  onConfirm,
  onCancel,
}: DeleteSavedAccountProfileConfirmationModalProps): JSX.Element {
  const { t } = useI18n();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-testid="delete-saved-account-profile-modal"
        aria-label={t("account.profile.delete.confirmDialogAria")}
        onEscapeKeyDown={() => {
          onCancel();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.title}>
            <span className={styles.titleIcon}>
              <AppIcon id="account.profile.delete" decorative />
            </span>
            {t("account.profile.delete.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("account.profile.delete.confirmMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className={styles.footer}>
          <AlertDialogCancel asChild>
            <IconControlButton
              iconId="overlay.close"
              ariaLabel={t("account.profile.delete.cancelAria")}
              tooltipLabel={t("common.cancel")}
              testId="delete-saved-account-profile-cancel"
              className={styles.iconButton}
              onClick={onCancel}
            />
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <IconControlButton
              iconId="action.confirm"
              ariaLabel={t("account.profile.delete.confirmAria")}
              testId="delete-saved-account-profile-confirm"
              className={styles.iconButton}
              onClick={onConfirm}
            />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
