import { useEffect, useState, type JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesNameDialogMode = "create" | "rename";
export type ExternalServicesNameDialogScope = "collection" | "request";

export type ExternalServicesCollectionsDialogsProps = Readonly<{
  busy: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
  nameDialog: Readonly<{
    open: boolean;
    mode: ExternalServicesNameDialogMode;
    scope: ExternalServicesNameDialogScope;
    value: string;
    errorMessage: string | null;
  }>;
  deleteDialog: Readonly<{
    open: boolean;
    collectionName: string;
  }>;
  discardDialogOpen: boolean;
  onRetry: () => void;
  onNameDialogOpenChange: (open: boolean) => void;
  onNameDialogValueChange: (value: string) => void;
  onNameDialogSubmit: () => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDeleteDialogConfirm: () => void;
  onDiscardDialogOpenChange: (open: boolean) => void;
  onDiscardConfirm: () => void;
}>;

/**
 * - Purpose: host External Services create/rename/delete/discard dialogs.
 * - Inputs: dialog state, busy/error/status messages, confirm callbacks.
 * - Outputs: accessible dialog intents without Domain access.
 * @uiMeta f=F-031
 */
export function ExternalServicesCollectionsDialogs({
  busy,
  errorMessage,
  statusMessage,
  nameDialog,
  deleteDialog,
  discardDialogOpen,
  onRetry,
  onNameDialogOpenChange,
  onNameDialogValueChange,
  onNameDialogSubmit,
  onDeleteDialogOpenChange,
  onDeleteDialogConfirm,
  onDiscardDialogOpenChange,
  onDiscardConfirm,
}: ExternalServicesCollectionsDialogsProps): JSX.Element {
  const { t } = useI18n();

  return (
    <>
      {errorMessage !== null ? (
        <Alert variant="destructive">
          <AlertTitle>{errorMessage}</AlertTitle>
          <AlertDescription>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("settings.integrations.externalServices.actions.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {statusMessage !== null ? <p role="status">{statusMessage}</p> : null}

      <NameDialog
        open={nameDialog.open}
        mode={nameDialog.mode}
        scope={nameDialog.scope}
        value={nameDialog.value}
        errorMessage={nameDialog.errorMessage}
        busy={busy}
        onOpenChange={onNameDialogOpenChange}
        onValueChange={onNameDialogValueChange}
        onSubmit={onNameDialogSubmit}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={onDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.integrations.externalServices.collections.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.integrations.externalServices.collections.deleteDescription", {
                name: deleteDialog.collectionName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="ghost">
                {t("settings.integrations.externalServices.actions.cancel")}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                loading={busy}
                onClick={onDeleteDialogConfirm}
              >
                {t("settings.integrations.externalServices.actions.delete")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={discardDialogOpen} onOpenChange={onDiscardDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.integrations.externalServices.editor.discardTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.integrations.externalServices.editor.discardDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                {t("settings.integrations.externalServices.actions.cancel")}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                data-testid="external-services-discard-changes"
                onClick={onDiscardConfirm}
              >
                {t("settings.integrations.externalServices.editor.discard")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type NameDialogProps = Readonly<{
  open: boolean;
  mode: ExternalServicesNameDialogMode;
  scope: ExternalServicesNameDialogScope;
  value: string;
  errorMessage: string | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}>;

function resolveNameDialogTitle(
  mode: ExternalServicesNameDialogMode,
  scope: ExternalServicesNameDialogScope,
):
  | "settings.integrations.externalServices.collections.nameLabel"
  | "settings.integrations.externalServices.collections.renameTitle"
  | "settings.integrations.externalServices.requests.renameTitle" {
  if (mode === "create") {
    return "settings.integrations.externalServices.collections.nameLabel";
  }
  if (scope === "request") {
    return "settings.integrations.externalServices.requests.renameTitle";
  }
  return "settings.integrations.externalServices.collections.renameTitle";
}

function NameDialog({
  open,
  mode,
  scope,
  value,
  errorMessage,
  busy,
  onOpenChange,
  onValueChange,
  onSubmit,
}: NameDialogProps): JSX.Element {
  const { t } = useI18n();
  const [draft, setDraft] = useState(value);
  const titleKey = resolveNameDialogTitle(mode, scope);
  const fieldLabel =
    scope === "request"
      ? t("settings.integrations.externalServices.requests.nameLabel")
      : t("settings.integrations.externalServices.collections.nameLabel");

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        closeLabel={t("settings.integrations.externalServices.actions.cancel")}
      >
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
        </DialogHeader>
        <div className={styles.nameDialogBody}>
          <FormField
            label={mode === "create" ? undefined : fieldLabel}
            error={errorMessage}
          >
            <Input
              value={draft}
              disabled={busy}
              aria-label={fieldLabel}
              placeholder={
                scope === "request"
                  ? undefined
                  : t("settings.integrations.externalServices.collections.namePlaceholder")
              }
              onChange={(event) => {
                const next = event.currentTarget.value;
                setDraft(next);
                onValueChange(next);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSubmit();
                }
              }}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("settings.integrations.externalServices.actions.cancel")}
          </Button>
          <Button type="button" loading={busy} onClick={onSubmit}>
            {t("settings.integrations.externalServices.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
