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

export type HistoryDeleteConfirmationModalProps = Readonly<{
  open: boolean;
  entryLabel: string | null;
  isDeleting: boolean;
  errorMessage: string | null;
  onCloseAutoFocus?: (event: Event) => void;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: confirm deletion of one call history entry (F-013).
 * - Inputs: modal visibility, entry label, and confirm/cancel callbacks.
 * - Outputs: accessible blocking alert dialog without business logic.
 */
export function HistoryDeleteConfirmationModal({
  open,
  entryLabel,
  isDeleting,
  errorMessage,
  onCloseAutoFocus,
  onConfirm,
  onCancel,
}: HistoryDeleteConfirmationModalProps): JSX.Element {
  const { t } = useI18n();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-testid="history-delete-modal"
        aria-label={t("history.delete.confirmDialogAria")}
        onEscapeKeyDown={() => {
          onCancel();
        }}
        {...(onCloseAutoFocus !== undefined ? { onCloseAutoFocus } : {})}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("history.delete.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("history.delete.confirmMessage", {
              name: entryLabel ?? t("history.delete.unnamed"),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage !== null ? (
          <p role="alert" data-testid="history-delete-error">
            {errorMessage}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              variant="ghost"
              aria-label={t("history.delete.cancelAria")}
              data-testid="history-delete-cancel"
              disabled={isDeleting}
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              aria-label={t("history.delete.confirmAria")}
              data-testid="history-delete-confirm"
              disabled={isDeleting}
              onClick={onConfirm}
            >
              {t("history.delete")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
