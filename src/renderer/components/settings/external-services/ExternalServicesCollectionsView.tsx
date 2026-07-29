import { useEffect, useState, type JSX } from "react";
import type { ExternalServicesCollectionSummaryVm } from "@application/index.js";
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
import { Skeleton } from "../../ui/skeleton/index.js";
import { ExternalServicesCollectionRow } from "./ExternalServicesCollectionRow.js";
import {
  ExternalServicesJournal,
  type ExternalServicesJournalProps,
} from "./ExternalServicesJournal.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesNameDialogMode = "create" | "rename";

export type ExternalServicesCollectionsViewProps = Readonly<{
  collections: ReadonlyArray<ExternalServicesCollectionSummaryVm>;
  loadState: "loading" | "ready" | "error" | "unavailable";
  busy: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
  journal: ExternalServicesJournalProps;
  nameDialog: Readonly<{
    open: boolean;
    mode: ExternalServicesNameDialogMode;
    value: string;
    errorMessage: string | null;
  }>;
  deleteDialog: Readonly<{
    open: boolean;
    collectionName: string;
  }>;
  onRetry: () => void;
  onCreate: () => void;
  onImport: () => void;
  onOpenCollection: (collectionId: string) => void;
  onToggleCollection: (collectionId: string, enabled: boolean) => void;
  onRenameCollection: (collectionId: string) => void;
  onDuplicateCollection: (collectionId: string) => void;
  onExportCollection: (collectionId: string) => void;
  onEditVariables: (collectionId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onNameDialogOpenChange: (open: boolean) => void;
  onNameDialogValueChange: (value: string) => void;
  onNameDialogSubmit: () => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDeleteDialogConfirm: () => void;
}>;

/**
 * - Purpose: present External Services collections list and management dialogs.
 * - Inputs: collection summaries, load/error/busy state, and intent callbacks.
 * - Outputs: accessible collections UI without Domain, IPC, or HTTP access.
 * @uiMeta f=F-031
 */
export function ExternalServicesCollectionsView({
  collections,
  loadState,
  busy,
  errorMessage,
  statusMessage,
  journal,
  nameDialog,
  deleteDialog,
  onRetry,
  onCreate,
  onImport,
  onOpenCollection,
  onToggleCollection,
  onRenameCollection,
  onDuplicateCollection,
  onExportCollection,
  onEditVariables,
  onDeleteCollection,
  onNameDialogOpenChange,
  onNameDialogValueChange,
  onNameDialogSubmit,
  onDeleteDialogOpenChange,
  onDeleteDialogConfirm,
}: ExternalServicesCollectionsViewProps): JSX.Element {
  const { t } = useI18n();
  const controlsDisabled = busy || loadState === "loading" || loadState === "unavailable";

  return (
    <div className={styles.panel} data-testid="external-services-collections">
      <header className={styles.header}>
        <p className={styles.description}>
          {t("settings.integrations.externalServices.description")}
        </p>
        <p className={styles.credentialsNote}>
          {t("settings.integrations.externalServices.importExport.credentialsNote")}
        </p>
        <div className={styles.headerActions}>
          <Button
            type="button"
            data-testid="external-services-create-collection"
            disabled={controlsDisabled}
            onClick={onCreate}
          >
            {t("settings.integrations.externalServices.actions.create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="external-services-import-collection"
            disabled={controlsDisabled}
            onClick={onImport}
          >
            {t("settings.integrations.externalServices.actions.import")}
          </Button>
        </div>
      </header>

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

      {statusMessage !== null ? (
        <p className={styles.statusMessage} role="status">
          {statusMessage}
        </p>
      ) : null}

      {loadState === "loading" ? (
        <div className={styles.loadingStack} aria-busy="true">
          <Skeleton shape="rectangle" height={56} />
          <Skeleton shape="rectangle" height={56} />
        </div>
      ) : null}

      {loadState === "ready" && collections.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {t("settings.integrations.externalServices.collections.emptyTitle")}
          </p>
          <p className={styles.emptyDescription}>
            {t("settings.integrations.externalServices.collections.emptyDescription")}
          </p>
          <div className={styles.emptyActions}>
            <Button type="button" disabled={controlsDisabled} onClick={onCreate}>
              {t("settings.integrations.externalServices.actions.create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={controlsDisabled}
              onClick={onImport}
            >
              {t("settings.integrations.externalServices.actions.import")}
            </Button>
          </div>
        </div>
      ) : null}

      {loadState === "ready" && collections.length > 0 ? (
        <ul className={styles.list}>
          {collections.map((collection) => (
            <ExternalServicesCollectionRow
              key={collection.id}
              collection={collection}
              disabled={controlsDisabled}
              onToggle={(enabled) => {
                onToggleCollection(collection.id, enabled);
              }}
              onOpen={() => {
                onOpenCollection(collection.id);
              }}
              onRename={() => {
                onRenameCollection(collection.id);
              }}
              onDuplicate={() => {
                onDuplicateCollection(collection.id);
              }}
              onExport={() => {
                onExportCollection(collection.id);
              }}
              onEditVariables={() => {
                onEditVariables(collection.id);
              }}
              onDelete={() => {
                onDeleteCollection(collection.id);
              }}
            />
          ))}
        </ul>
      ) : null}

      <ExternalServicesJournal {...journal} />

      <NameDialog
        open={nameDialog.open}
        mode={nameDialog.mode}
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
    </div>
  );
}

type NameDialogProps = Readonly<{
  open: boolean;
  mode: ExternalServicesNameDialogMode;
  value: string;
  errorMessage: string | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}>;

function NameDialog({
  open,
  mode,
  value,
  errorMessage,
  busy,
  onOpenChange,
  onValueChange,
  onSubmit,
}: NameDialogProps): JSX.Element {
  const { t } = useI18n();
  const [draft, setDraft] = useState(value);

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
          <DialogTitle>
            {t(
              mode === "create"
                ? "settings.integrations.externalServices.collections.createTitle"
                : "settings.integrations.externalServices.collections.renameTitle",
            )}
          </DialogTitle>
        </DialogHeader>
        <FormField
          label={t("settings.integrations.externalServices.collections.nameLabel")}
          error={errorMessage}
        >
          <Input
            value={draft}
            disabled={busy}
            placeholder={t(
              "settings.integrations.externalServices.collections.namePlaceholder",
            )}
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              onOpenChange(false);
            }}
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
