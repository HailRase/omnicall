/**
 * - Purpose: confirm discarding unsaved External Applications edits.
 * - Inputs: open state and confirm/cancel callbacks.
 * - Outputs: accessible AlertDialog intents without Domain access.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
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
} from "../../ui/index.js";

export type ExternalApplicationsDiscardDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsDiscardDialog({
  open,
  onOpenChange,
  onConfirm,
}: ExternalApplicationsDiscardDialogProps): JSX.Element {
  const { t } = useI18n();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("settings.integrations.externalApplications.editor.discardTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("settings.integrations.externalApplications.editor.discardDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              {t("settings.integrations.externalApplications.actions.cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              data-testid="external-applications-discard-changes"
              onClick={onConfirm}
            >
              {t("settings.integrations.externalApplications.editor.discard")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
