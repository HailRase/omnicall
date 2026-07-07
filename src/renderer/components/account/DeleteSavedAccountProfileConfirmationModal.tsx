import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "../ui/index.js";

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
          <AlertDialogTitle>{t("account.profile.delete.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("account.profile.delete.confirmMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              variant="ghost"
              aria-label={t("account.profile.delete.cancelAria")}
              data-testid="delete-saved-account-profile-cancel"
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              aria-label={t("account.profile.delete.confirmAria")}
              data-testid="delete-saved-account-profile-confirm"
              onClick={onConfirm}
            >
              {t("account.profile.delete")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
