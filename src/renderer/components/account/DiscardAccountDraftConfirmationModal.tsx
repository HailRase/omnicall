import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "../ui/index.js";

type DiscardAccountDraftConfirmationModalProps = Readonly<{
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

export function DiscardAccountDraftConfirmationModal({
  open,
  onConfirm,
  onCancel,
}: DiscardAccountDraftConfirmationModalProps): JSX.Element {
  const { t } = useI18n();
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-testid="discard-account-draft-modal"
        onEscapeKeyDown={onCancel}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("account.draft.discard.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("account.draft.discard.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
          </AlertDialogCancel>
          <Button
            variant="destructive"
            data-testid="discard-account-draft-confirm"
            onClick={onConfirm}
          >
            {t("account.draft.discard.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
