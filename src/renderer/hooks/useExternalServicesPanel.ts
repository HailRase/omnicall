/**
 * - Purpose: compose External Services shell and actions for Settings wiring.
 * - Inputs: facade, section activity, and active UserSettings refresh callback.
 * - Outputs: presentational props for collections view and variables dialog.
 */

import { useCallback, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  ExternalServicesCollectionSummaryVm,
  ExternalServicesCollectionVariableVm,
  UserSettings,
} from "@application/index.js";
import { useI18n, translateCurrent, type TranslationKey } from "../i18n/index.js";
import { useExternalServicesActions } from "./useExternalServicesActions.js";
import { useExternalServicesJournal } from "./useExternalServicesJournal.js";
import { useExternalServicesShell } from "./useExternalServicesShell.js";
import type { ExternalServicesNameDialogMode } from "../components/settings/external-services/ExternalServicesCollectionsView.js";
import type { ExternalServicesCollectionsViewProps } from "../components/settings/external-services/ExternalServicesCollectionsView.js";
import type { ExternalServicesVariablesDialogProps } from "../components/settings/external-services/ExternalServicesVariablesDialog.js";
import type { ExternalServicesRequestDraft, ExternalServicesRequestEditorProps } from "../components/settings/external-services/ExternalServicesRequestEditor.js";
import type { ExternalServicesRequestsViewProps } from "../components/settings/external-services/ExternalServicesRequestsView.js";
import { useExternalServicesRequestActions } from "./useExternalServicesRequestActions.js";

type UseExternalServicesPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  sectionActive: boolean;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
}>;

export type UseExternalServicesPanelResult = Readonly<{
  collectionsView: ExternalServicesCollectionsViewProps;
  requestsView: ExternalServicesRequestsViewProps | null;
  requestEditor: ExternalServicesRequestEditorProps | null;
  variablesDialog: ExternalServicesVariablesDialogProps | null;
}>;

type NameDialogState = Readonly<{
  open: boolean;
  mode: ExternalServicesNameDialogMode;
  collectionId: string | null;
  value: string;
  errorKey: TranslationKey | null;
}>;

type DeleteDialogState = Readonly<{
  open: boolean;
  collectionId: string | null;
  collectionName: string;
}>;

type Screen =
  | Readonly<{ kind: "collections" }>
  | Readonly<{ kind: "requests"; collectionId: string }>
  | Readonly<{ kind: "request_detail"; collectionId: string; requestId: string }>;

/**
 * - Purpose: orchestrate External Services collections UI for SoftphoneReadyShell.
 * - Inputs: facade and settings refresh callback.
 * - Outputs: presentational collections/variables props only.
 */
export function useExternalServicesPanel(
  input: UseExternalServicesPanelInput,
): UseExternalServicesPanelResult {
  const { facade, sectionActive, onActiveUserSettingsRefresh } = input;
  const { t } = useI18n();
  const shell = useExternalServicesShell({ facade, sectionActive });
  const actions = useExternalServicesActions({
    facade,
    settings: shell.settings,
    settingsRevision: shell.panel.settingsRevision,
    onSettingsSaved: (settings, settingsRevision) => {
      shell.applyImportedUserSettings(settings, settingsRevision);
      onActiveUserSettingsRefresh(settings);
    },
    onUserSettingsImported: (settings, settingsRevision) => {
      shell.applyImportedUserSettings(settings, settingsRevision);
      onActiveUserSettingsRefresh(settings);
    },
    onStatusMessage: shell.setStatusMessage,
  });
  const requestActions = useExternalServicesRequestActions({
    facade,
    settings: shell.settings,
    settingsRevision: shell.panel.settingsRevision,
    onSaved: (settings, revision) => {
      shell.applyImportedUserSettings(settings, revision);
      onActiveUserSettingsRefresh(settings);
    },
  });
  const [screen, setScreen] = useState<Screen>({ kind: "collections" });
  const journal = useExternalServicesJournal({
    facade,
    active: sectionActive && screen.kind === "collections",
  });

  const [nameDialog, setNameDialog] = useState<NameDialogState>({
    open: false,
    mode: "create",
    collectionId: null,
    value: "",
    errorKey: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    collectionId: null,
    collectionName: "",
  });
  const [variablesCollection, setVariablesCollection] =
    useState<ExternalServicesCollectionSummaryVm | null>(null);
  const [draft, setDraft] = useState<ExternalServicesRequestDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<ExternalServicesRequestDraft | null>(null);
  const [runResult, setRunResult] = useState<ExternalServicesRequestEditorProps["runResult"]>(null);
  const [runState, setRunState] =
    useState<ExternalServicesRequestEditorProps["runState"]>("idle");
  const [requestErrorKey, setRequestErrorKey] = useState<TranslationKey | null>(null);

  const findCollection = useCallback(
    (collectionId: string): ExternalServicesCollectionSummaryVm | undefined =>
      shell.panel.collections.find((entry) => entry.id === collectionId),
    [shell.panel.collections],
  );

  const handleNameSubmit = useCallback(async (): Promise<void> => {
    const result =
      nameDialog.mode === "create"
        ? await actions.createCollection(nameDialog.value)
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
    if (result.kind === "success") {
      setNameDialog({
        open: false,
        mode: "create",
        collectionId: null,
        value: "",
        errorKey: null,
      });
    }
  }, [actions, nameDialog]);

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (deleteDialog.collectionId === null) {
      return;
    }
    const result = await actions.deleteCollection(deleteDialog.collectionId);
    if (result.kind !== "error") {
      setDeleteDialog({ open: false, collectionId: null, collectionName: "" });
    }
  }, [actions, deleteDialog.collectionId]);

  const handleSaveVariables = useCallback(
    async (
      variables: ReadonlyArray<ExternalServicesCollectionVariableVm>,
    ): Promise<void> => {
      if (variablesCollection === null) {
        return;
      }
      const result = await actions.saveCollectionVariables(
        variablesCollection.id,
        variables,
      );
      if (result.kind === "success") {
        setVariablesCollection(null);
      }
    },
    [actions, variablesCollection],
  );

  const collectionsView = useMemo((): ExternalServicesCollectionsViewProps => {
    return {
      collections: shell.panel.collections,
      loadState: shell.panel.loadState,
      busy: actions.busy,
      errorMessage: shell.errorKey !== null ? t(shell.errorKey) : null,
      statusMessage:
        shell.statusMessageKey !== null
          ? formatExternalServicesStatusMessage(
              shell.statusMessageKey,
              shell.statusMessageParams,
            )
          : null,
      journal: {
        panel: journal.panel,
        onRetry: () => {
          void journal.refresh();
        },
      },
      nameDialog: {
        open: nameDialog.open,
        mode: nameDialog.mode,
        value: nameDialog.value,
        errorMessage: nameDialog.errorKey !== null ? t(nameDialog.errorKey) : null,
      },
      deleteDialog: {
        open: deleteDialog.open,
        collectionName: deleteDialog.collectionName,
      },
      onRetry: () => {
        void shell.refresh();
      },
      onCreate: () => {
        setNameDialog({
          open: true,
          mode: "create",
          collectionId: null,
          value: "",
          errorKey: null,
        });
      },
      onImport: () => {
        void actions.importCollection();
      },
      onOpenCollection: (collectionId) => setScreen({ kind: "requests", collectionId }),
      onToggleCollection: (collectionId, enabled) => {
        void actions.toggleCollection(collectionId, enabled);
      },
      onRenameCollection: (collectionId) => {
        const collection = findCollection(collectionId);
        if (collection === undefined) {
          return;
        }
        setNameDialog({
          open: true,
          mode: "rename",
          collectionId,
          value: collection.name,
          errorKey: null,
        });
      },
      onDuplicateCollection: (collectionId) => {
        void actions.duplicateCollection(collectionId);
      },
      onExportCollection: (collectionId) => {
        void actions.exportCollection(collectionId);
      },
      onEditVariables: (collectionId) => {
        const collection = findCollection(collectionId);
        if (collection !== undefined) {
          setVariablesCollection(collection);
        }
      },
      onDeleteCollection: (collectionId) => {
        const collection = findCollection(collectionId);
        if (collection === undefined) {
          return;
        }
        setDeleteDialog({
          open: true,
          collectionId,
          collectionName: collection.name,
        });
      },
      onNameDialogOpenChange: (open) => {
        if (!open) {
          setNameDialog({
            open: false,
            mode: "create",
            collectionId: null,
            value: "",
            errorKey: null,
          });
          return;
        }
        setNameDialog((previous) => ({ ...previous, open: true }));
      },
      onNameDialogValueChange: (value) => {
        setNameDialog((previous) => ({
          ...previous,
          value,
          errorKey: null,
        }));
      },
      onNameDialogSubmit: () => {
        void handleNameSubmit();
      },
      onDeleteDialogOpenChange: (open) => {
        if (!open) {
          setDeleteDialog({ open: false, collectionId: null, collectionName: "" });
        }
      },
      onDeleteDialogConfirm: () => {
        void handleDeleteConfirm();
      },
    };
  }, [
    actions,
    deleteDialog,
    findCollection,
    handleDeleteConfirm,
    handleNameSubmit,
    journal,
    nameDialog,
    shell,
    t,
  ]);

  const variablesDialog = useMemo((): ExternalServicesVariablesDialogProps | null => {
    if (variablesCollection === null) {
      return null;
    }
    return {
      open: true,
      collectionName: variablesCollection.name,
      initialVariables: variablesCollection.variables,
      busy: actions.busy,
      onOpenChange: (open) => {
        if (!open) {
          setVariablesCollection(null);
        }
      },
      onSave: (variables) => {
        void handleSaveVariables(variables);
      },
    };
  }, [actions.busy, handleSaveVariables, variablesCollection]);

  const selectedCollection = screen.kind === "collections" ? null : shell.settings.collections.find((item) => item.id === screen.collectionId);
  const requestsView = useMemo((): ExternalServicesRequestsViewProps | null => {
    if (screen.kind !== "requests" || selectedCollection === undefined || selectedCollection === null) return null;
    return {
      collection: {
        ...selectedCollection,
        enabledRequestCount: selectedCollection.requests.filter((item) => item.enabled).length,
        requestCount: selectedCollection.requests.length,
      },
      requests: selectedCollection.requests,
      busy: requestActions.busy,
      onBack: () => setScreen({ kind: "collections" }),
      onCreate: () => { void requestActions.create(selectedCollection.id); },
      onOpen: (requestId) => {
        const request = selectedCollection.requests.find((item) => item.id === requestId);
        if (request === undefined) return;
        setDraft(request);
        setSavedDraft(request);
        setRunResult(null);
        setRunState("idle");
        setRequestErrorKey(null);
        setScreen({ kind: "request_detail", collectionId: selectedCollection.id, requestId });
      },
      onToggle: (requestId, enabled) => { void requestActions.toggle(selectedCollection.id, requestId, enabled); },
      onRename: (requestId) => {
        const request = selectedCollection.requests.find((item) => item.id === requestId);
        if (request !== undefined) void requestActions.rename(selectedCollection.id, requestId, request.name);
      },
      onDuplicate: (requestId) => { void requestActions.duplicate(selectedCollection.id, requestId); },
      onDelete: (requestId) => { void requestActions.delete(selectedCollection.id, requestId); },
    };
  }, [requestActions, screen.kind, selectedCollection]);
  const requestEditor = useMemo((): ExternalServicesRequestEditorProps | null => {
    if (screen.kind !== "request_detail" || selectedCollection === undefined || selectedCollection === null || draft === null) return null;
    return {
      draft,
      busy: requestActions.busy,
      errorMessage: requestErrorKey === null ? null : t(requestErrorKey),
      isDirty: savedDraft === null || JSON.stringify(draft) !== JSON.stringify(savedDraft),
      runState,
      runResult,
      onChange: setDraft,
      onBack: () => {
        setScreen({ kind: "requests", collectionId: selectedCollection.id });
        setDraft(null);
        setSavedDraft(null);
        setRunResult(null);
        setRequestErrorKey(null);
      },
      onDelete: () => {
        void requestActions.delete(selectedCollection.id, draft.id).then((result) => {
          if (result.kind === "error") {
            setRequestErrorKey(result.messageKey);
            return;
          }
          setScreen({ kind: "requests", collectionId: selectedCollection.id });
          setDraft(null);
          setSavedDraft(null);
        });
      },
      onSave: () => {
        void requestActions.replace(selectedCollection.id, draft).then((result) => {
          if (result.kind === "error") {
            setRequestErrorKey(result.messageKey);
            return;
          }
          setSavedDraft(draft);
          setRequestErrorKey(null);
        });
      },
      onRunNow: () => {
        if (facade === null || shell.profileKey === null) return;
        const profileKey = shell.profileKey;
        const request = selectedCollection.requests.find((item) => item.id === draft.id);
        if (request === undefined) return;
        setRunResult(null);
        setRequestErrorKey(null);
        setRunState("queued");
        void requestActions.replace(selectedCollection.id, draft).then(async (saveResult) => {
          if (saveResult.kind === "error") {
            setRequestErrorKey(saveResult.messageKey);
            setRunState("idle");
            return;
          }
          setSavedDraft(draft);
          setRunState("running");
          const result = await facade.runExternalServiceRequestNow({
            collectionId: selectedCollection.id,
            requestId: request.id,
            expectedSettingsRevision: saveResult.settingsRevision,
            profileKey,
            occurredAt: new Date().toISOString(),
          });
          setRunResult(result);
          setRunState("idle");
        });
      },
    };
  }, [draft, facade, requestActions, requestErrorKey, runResult, runState, savedDraft, screen.kind, selectedCollection, shell.profileKey, t]);

  return { collectionsView, requestsView, requestEditor, variablesDialog };
}

function formatExternalServicesStatusMessage(
  key: TranslationKey,
  params: Readonly<Record<string, string>> | null,
): string {
  if (key === "settings.integrations.externalServices.importExport.importSucceeded") {
    return translateCurrent(key, { name: params?.["name"] ?? "" });
  }
  if (key === "settings.integrations.externalServices.importExport.exportSucceeded") {
    return translateCurrent(key, { fileName: params?.["fileName"] ?? "" });
  }
  return translateCurrent(key);
}
