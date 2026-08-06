/**
 * - Purpose: own External Services name/delete/discard/variables dialog props.
 * - Inputs: shell status, collection actions, and selection helpers.
 * - Outputs: presentational dialog prop bags.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  ExternalServicesCollectionSummaryVm,
  ExternalServicesCollectionVariableVm,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../i18n/index.js";
import type { ExternalServicesCollectionsDialogsProps } from "../../components/settings/external-services/ExternalServicesCollectionsDialogs.js";
import type { ExternalServicesVariablesDialogProps } from "../../components/settings/external-services/ExternalServicesVariablesDialog.js";
import type { ExternalServicesSidebarSelection } from "../../components/settings/external-services/ExternalServicesSidebar.js";
import type { UseExternalServicesActionsResult } from "../useExternalServicesActions.js";
import type { UseExternalServicesRequestActionsResult } from "../useExternalServicesRequestActions.js";
import type { UseExternalServicesShellResult } from "../useExternalServicesShell.js";
import type { ExternalServicesRequestDraft } from "../../components/settings/external-services/ExternalServicesRequestEditor.js";
import { formatExternalServicesStatusMessage } from "./formatExternalServicesStatusMessage.js";
import {
  CLOSED_NAME_DIALOG,
  type DeleteDialogState,
  type NameDialogState,
} from "./externalServicesPanelDialogState.js";

export type ExternalServicesWorkspaceBannerProps = Readonly<{
  loadErrorMessage: string | null;
  statusMessage: string | null;
  onRetryLoad: () => void;
}>;

export type UseExternalServicesPanelDialogsResult = Readonly<{
  dialogs: ExternalServicesCollectionsDialogsProps;
  banner: ExternalServicesWorkspaceBannerProps;
  variablesDialog: ExternalServicesVariablesDialogProps | null;
  openCreateCollectionDialog: () => void;
  openRenameCollectionDialog: (collectionId: string, name: string) => void;
  openRenameRequestDialog: (
    collectionId: string,
    requestId: string,
    name: string,
  ) => void;
  openDeleteCollectionDialog: (collectionId: string, collectionName: string) => void;
  openVariablesDialog: (collection: ExternalServicesCollectionSummaryVm) => void;
}>;

export function useExternalServicesPanelDialogs(input: Readonly<{
  shell: Pick<
    UseExternalServicesShellResult,
    "errorKey" | "statusMessageKey" | "statusMessageParams" | "refresh"
  >;
  actions: Pick<
    UseExternalServicesActionsResult,
    "busy" | "createCollection" | "renameCollection" | "deleteCollection" | "saveCollectionVariables"
  >;
  requestActions: Pick<UseExternalServicesRequestActionsResult, "rename">;
  selection: ExternalServicesSidebarSelection;
  pendingSelection: ExternalServicesSidebarSelection | null;
  discardOpen: boolean;
  draft: ExternalServicesRequestDraft | null;
  setDiscardOpen: (open: boolean) => void;
  setPendingSelection: (next: ExternalServicesSidebarSelection | null) => void;
  applySelection: (next: ExternalServicesSidebarSelection) => void;
  setDraft: (next: ExternalServicesRequestDraft | null) => void;
  setSavedDraft: (
    next:
      | ExternalServicesRequestDraft
      | null
      | ((previous: ExternalServicesRequestDraft | null) => ExternalServicesRequestDraft | null),
  ) => void;
}>): UseExternalServicesPanelDialogsResult {
  const {
    shell,
    actions,
    requestActions,
    selection,
    pendingSelection,
    discardOpen,
    draft,
    setDiscardOpen,
    setPendingSelection,
    applySelection,
    setDraft,
    setSavedDraft,
  } = input;
  const { t } = useI18n();
  const [nameDialog, setNameDialog] = useState<NameDialogState>(CLOSED_NAME_DIALOG);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    collectionId: null,
    collectionName: "",
  });
  const [variablesCollection, setVariablesCollection] =
    useState<ExternalServicesCollectionSummaryVm | null>(null);

  const handleNameSubmit = useCallback(async (): Promise<void> => {
    const result =
      nameDialog.mode === "create"
        ? await actions.createCollection(nameDialog.value)
        : nameDialog.scope === "request"
          ? nameDialog.collectionId === null || nameDialog.requestId === null
            ? {
                kind: "error" as const,
                messageKey: "settings.integrations.externalServices.saveError",
              }
            : await requestActions.rename(
                nameDialog.collectionId,
                nameDialog.requestId,
                nameDialog.value,
              )
          : nameDialog.collectionId === null
            ? {
                kind: "error" as const,
                messageKey: "settings.integrations.externalServices.saveError",
              }
            : await actions.renameCollection(nameDialog.collectionId, nameDialog.value);

    if (result.kind === "error") {
      setNameDialog((previous) => ({
        ...previous,
        errorKey: result.messageKey as TranslationKey,
      }));
      return;
    }
    if (
      nameDialog.scope === "request" &&
      nameDialog.requestId !== null &&
      draft !== null &&
      draft.id === nameDialog.requestId
    ) {
      const nextName = nameDialog.value.trim();
      setDraft({ ...draft, name: nextName });
      setSavedDraft((previous) =>
        previous === null ? previous : { ...previous, name: nextName },
      );
    }
    setNameDialog(CLOSED_NAME_DIALOG);
  }, [actions, draft, nameDialog, requestActions, setDraft, setSavedDraft]);

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (deleteDialog.collectionId === null) {
      return;
    }
    const collectionId = deleteDialog.collectionId;
    const result = await actions.deleteCollection(collectionId);
    if (result.kind !== "error") {
      setDeleteDialog({ open: false, collectionId: null, collectionName: "" });
      if (
        (selection.kind === "collection" && selection.collectionId === collectionId) ||
        (selection.kind === "request" && selection.collectionId === collectionId)
      ) {
        applySelection({ kind: "none" });
      }
    }
  }, [actions, applySelection, deleteDialog.collectionId, selection]);

  const handleSaveVariables = useCallback(
    async (variables: ReadonlyArray<ExternalServicesCollectionVariableVm>): Promise<void> => {
      if (variablesCollection === null) {
        return;
      }
      const result = await actions.saveCollectionVariables(variablesCollection.id, variables);
      if (result.kind === "success") {
        setVariablesCollection(null);
      }
    },
    [actions, variablesCollection],
  );

  const {
    errorKey: shellErrorKey,
    statusMessageKey: shellStatusMessageKey,
    statusMessageParams: shellStatusMessageParams,
    refresh: refreshShell,
  } = shell;

  const banner = useMemo((): ExternalServicesWorkspaceBannerProps => {
    return {
      loadErrorMessage: shellErrorKey !== null ? t(shellErrorKey) : null,
      statusMessage:
        shellStatusMessageKey !== null
          ? formatExternalServicesStatusMessage(
              shellStatusMessageKey,
              shellStatusMessageParams,
            )
          : null,
      onRetryLoad: () => {
        void refreshShell();
      },
    };
  }, [
    refreshShell,
    shellErrorKey,
    shellStatusMessageKey,
    shellStatusMessageParams,
    t,
  ]);

  const dialogs = useMemo((): ExternalServicesCollectionsDialogsProps => {
    return {
      busy: actions.busy,
      nameDialog: {
        open: nameDialog.open,
        mode: nameDialog.mode,
        scope: nameDialog.scope,
        value: nameDialog.value,
        errorMessage: nameDialog.errorKey !== null ? t(nameDialog.errorKey) : null,
      },
      deleteDialog: {
        open: deleteDialog.open,
        collectionName: deleteDialog.collectionName,
      },
      discardDialogOpen: discardOpen,
      onNameDialogOpenChange: (open) => {
        if (!open) {
          setNameDialog(CLOSED_NAME_DIALOG);
          return;
        }
        setNameDialog((previous) => ({ ...previous, open: true }));
      },
      onNameDialogValueChange: (value) => {
        setNameDialog((previous) => ({ ...previous, value, errorKey: null }));
      },
      onNameDialogSubmit: () => {
        void handleNameSubmit();
      },
      onDeleteDialogOpenChange: (open) => {
        if (!open) setDeleteDialog({ open: false, collectionId: null, collectionName: "" });
      },
      onDeleteDialogConfirm: () => {
        void handleDeleteConfirm();
      },
      onDiscardDialogOpenChange: setDiscardOpen,
      onDiscardConfirm: () => {
        if (pendingSelection !== null) {
          applySelection(pendingSelection);
          setPendingSelection(null);
        }
        setDiscardOpen(false);
      },
    };
  }, [
    actions.busy,
    applySelection,
    deleteDialog,
    discardOpen,
    handleDeleteConfirm,
    handleNameSubmit,
    nameDialog,
    pendingSelection,
    setDiscardOpen,
    setPendingSelection,
    t,
  ]);

  const variablesDialog = useMemo((): ExternalServicesVariablesDialogProps | null => {
    if (variablesCollection === null) return null;
    return {
      open: true,
      collectionName: variablesCollection.name,
      initialVariables: variablesCollection.variables,
      busy: actions.busy,
      onOpenChange: (open) => {
        if (!open) setVariablesCollection(null);
      },
      onSave: (variables) => {
        void handleSaveVariables(variables);
      },
    };
  }, [actions.busy, handleSaveVariables, variablesCollection]);

  return {
    dialogs,
    banner,
    variablesDialog,
    openCreateCollectionDialog: () => {
      setNameDialog({ ...CLOSED_NAME_DIALOG, open: true, mode: "create" });
    },
    openRenameCollectionDialog: (collectionId, name) => {
      setNameDialog({
        open: true,
        mode: "rename",
        scope: "collection",
        collectionId,
        requestId: null,
        value: name,
        errorKey: null,
      });
    },
    openRenameRequestDialog: (collectionId, requestId, name) => {
      setNameDialog({
        open: true,
        mode: "rename",
        scope: "request",
        collectionId,
        requestId,
        value: name,
        errorKey: null,
      });
    },
    openDeleteCollectionDialog: (collectionId, collectionName) => {
      setDeleteDialog({ open: true, collectionId, collectionName });
    },
    openVariablesDialog: (collection) => {
      setVariablesCollection(collection);
    },
  };
}
