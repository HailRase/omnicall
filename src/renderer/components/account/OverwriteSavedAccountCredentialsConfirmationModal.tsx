import { useState, type JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/index.js";
import styles from "./OverwriteSavedAccountCredentialsConfirmationModal.module.css";

export type OverwriteSavedAccountCredentialsConfirmationModalProps = Readonly<{
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onContinueWithoutOverwrite: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: confirm overwrite vs continue-without-save for existing saved credentials.
 * - Inputs: modal visibility, loading, confirm/continue/cancel callbacks.
 * - Outputs: Cancel plus split ButtonGroup (continue primary, overwrite in menu).
 * @uiMeta f=F-024
 */
export function OverwriteSavedAccountCredentialsConfirmationModal({
  open,
  loading = false,
  onConfirm,
  onContinueWithoutOverwrite,
  onCancel,
}: OverwriteSavedAccountCredentialsConfirmationModalProps): JSX.Element {
  const { t } = useI18n();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        ref={setPortalContainer}
        className={styles.content}
        data-testid="overwrite-saved-account-credentials-modal"
        aria-label={t("account.profile.overwrite.confirmDialogAria")}
        onEscapeKeyDown={() => {
          if (!loading) {
            onCancel();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("account.profile.overwrite.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("account.profile.overwrite.confirmMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={styles.footer}>
          <AlertDialogCancel asChild>
            <Button
              variant="ghost"
              data-testid="overwrite-saved-account-credentials-cancel"
              disabled={loading}
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
          </AlertDialogCancel>
          <ButtonGroup
            className={styles.actions}
            aria-label={t("account.profile.overwrite.actionsGroupAria")}
          >
            <Button
              data-testid="overwrite-saved-account-credentials-continue"
              disabled={loading}
              onClick={onContinueWithoutOverwrite}
            >
              {t("account.profile.overwrite.continueWithoutSaving")}
            </Button>
            {/* modal=false + portal into dialog: avoid AlertDialog inert/z-index trap */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  disabled={loading}
                  aria-label={t("account.profile.overwrite.moreActionsAria")}
                  data-testid="overwrite-saved-account-credentials-more"
                >
                  <AppIcon id="ui.select.chevron" decorative />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                container={portalContainer}
                className={styles.menu}
              >
                <DropdownMenuItem
                  data-testid="overwrite-saved-account-credentials-confirm"
                  disabled={loading}
                  onSelect={() => {
                    onConfirm();
                  }}
                >
                  {t("account.profile.overwrite.confirm")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
