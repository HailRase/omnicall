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

export type ContactDeleteConfirmationModalProps = Readonly<{
  open: boolean;
  contactName: string | null;
  isDeleting: boolean;
  onCloseAutoFocus?: (event: Event) => void;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: confirm deletion of a local contact (F-025).
 * - Inputs: modal visibility, contact label, and confirm/cancel callbacks.
 * - Outputs: accessible blocking alert dialog; delete outcomes use notifications.
 */
export function ContactDeleteConfirmationModal({
  open,
  contactName,
  isDeleting,
  onCloseAutoFocus,
  onConfirm,
  onCancel,
}: ContactDeleteConfirmationModalProps): JSX.Element {
  const { t } = useI18n();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-testid="contacts-delete-modal"
        aria-label={t("contacts.delete.confirmDialogAria")}
        onEscapeKeyDown={() => {
          onCancel();
        }}
        {...(onCloseAutoFocus !== undefined ? { onCloseAutoFocus } : {})}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("contacts.delete.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("contacts.delete.confirmMessage", {
              name: contactName ?? t("contacts.delete.unnamed"),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              variant="ghost"
              aria-label={t("contacts.delete.cancelAria")}
              data-testid="contacts-delete-cancel"
              disabled={isDeleting}
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              aria-label={t("contacts.delete.confirmAria")}
              data-testid="contacts-delete-confirm"
              disabled={isDeleting}
              onClick={onConfirm}
            >
              {t("contacts.delete")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
