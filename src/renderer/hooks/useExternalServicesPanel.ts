/**
 * - Purpose: compose External Services Postman-like Settings workspace props.
 * - Inputs: facade, section activity, and active UserSettings refresh callback.
 * - Outputs: presentational sidebar, panes, dialogs, and variables dialog props.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { ExternalServicesNameDialogMode } from "../components/settings/external-services/ExternalServicesCollectionsDialogs.js";
import type { ExternalServicesNameDialogScope } from "../components/settings/external-services/ExternalServicesCollectionsDialogs.js";
import type { ExternalServicesCollectionsDialogsProps } from "../components/settings/external-services/ExternalServicesCollectionsDialogs.js";
import type { ExternalServicesVariablesDialogProps } from "../components/settings/external-services/ExternalServicesVariablesDialog.js";
import type {
  ExternalServicesRequestDraft,
  ExternalServicesRequestEditorProps,
} from "../components/settings/external-services/ExternalServicesRequestEditor.js";
import type { ExternalServicesRequestsViewProps } from "../components/settings/external-services/ExternalServicesRequestsView.js";
import type {
  ExternalServicesSidebarProps,
  ExternalServicesSidebarSelection,
} from "../components/settings/external-services/ExternalServicesSidebar.js";
import type { ExternalServicesWelcomeProps } from "../components/settings/external-services/ExternalServicesWelcome.js";
import { useExternalServicesRequestActions } from "./useExternalServicesRequestActions.js";

type UseExternalServicesPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  sectionActive: boolean;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
}>;

export type UseExternalServicesPanelResult = Readonly<{
  sidebar: ExternalServicesSidebarProps;
  welcome: ExternalServicesWelcomeProps | null;
  requestsView: ExternalServicesRequestsViewProps | null;
  requestEditor: ExternalServicesRequestEditorProps | null;
  dialogs: ExternalServicesCollectionsDialogsProps;
  variablesDialog: ExternalServicesVariablesDialogProps | null;
}>;

type NameDialogState = Readonly<{
  open: boolean;
  mode: ExternalServicesNameDialogMode;
  scope: ExternalServicesNameDialogScope;
  collectionId: string | null;
  requestId: string | null;
  value: string;
  errorKey: TranslationKey | null;
}>;

type DeleteDialogState = Readonly<{
  open: boolean;
  collectionId: string | null;
  collectionName: string;
}>;

type PendingSelection = ExternalServicesSidebarSelection;

/**
 * - Purpose: orchestrate External Services workspace UI for SoftphoneReadyShell.
 * - Inputs: facade and settings refresh callback.
 * - Outputs: presentational workspace props only.
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
  const [selection, setSelection] = useState<ExternalServicesSidebarSelection>({ kind: "none" });
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const journal = useExternalServicesJournal({ facade, active: sectionActive });

  const [nameDialog, setNameDialog] = useState<NameDialogState>({
    open: false,
    mode: "create",
    scope: "collection",
    collectionId: null,
    requestId: null,
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
  const [queueRefresh, setQueueRefresh] = useState(0);
  const waitingCountRef = useRef(0);

  useEffect(() => {
    if (!sectionActive || facade === null) return;
    const timer = window.setInterval(() => {
      const waitingCount = facade.getExternalServicesWaitingJobs().length;
      setQueueRefresh((value) => value + 1);
      if (waitingCount < waitingCountRef.current) {
        window.setTimeout(() => {
          void journal.refresh();
        }, 500);
        window.setTimeout(() => {
          void journal.refresh();
        }, 2000);
      }
      waitingCountRef.current = waitingCount;
    }, 1000);
    return () => window.clearInterval(timer);
  }, [facade, journal, sectionActive]);

  const isDirty = savedDraft !== null && draft !== null && JSON.stringify(draft) !== JSON.stringify(savedDraft);

  const findCollectionSummary = useCallback(
    (collectionId: string): ExternalServicesCollectionSummaryVm | undefined =>
      shell.panel.collections.find((entry) => entry.id === collectionId),
    [shell.panel.collections],
  );

  const clearEditor = useCallback((): void => {
    setDraft(null);
    setSavedDraft(null);
    setRunResult(null);
    setRunState("idle");
    setRequestErrorKey(null);
  }, []);

  const applySelection = useCallback(
    (next: ExternalServicesSidebarSelection): void => {
      if (next.kind === "request") {
        const collection = shell.settings.collections.find((item) => item.id === next.collectionId);
        const request = collection?.requests.find((item) => item.id === next.requestId);
        if (collection === undefined || request === undefined) {
          setSelection({ kind: "none" });
          clearEditor();
          return;
        }
        const nextDraft = {
          id: request.id,
          name: request.name,
          enabled: request.enabled,
          method: request.method,
          url: request.url,
          query: request.query.map((row) => ({
            id: row.id,
            key: row.key,
            value: row.value,
            enabled: row.enabled,
          })),
          headers: request.headers.map((row) => ({
            id: row.id,
            key: row.key,
            value: row.value,
            enabled: row.enabled,
          })),
          body: { mode: request.body.mode, value: request.body.value },
          triggers: [...request.triggers],
        };
        setDraft(nextDraft);
        setSavedDraft(nextDraft);
        setRunResult(null);
        setRunState("idle");
        setRequestErrorKey(null);
        setSelection(next);
        return;
      }
      clearEditor();
      setSelection(next);
    },
    [clearEditor, shell.settings.collections],
  );

  const requestSelectionChange = useCallback(
    (next: ExternalServicesSidebarSelection): void => {
      if (isDirty) {
        setPendingSelection(next);
        setDiscardOpen(true);
        return;
      }
      applySelection(next);
    },
    [applySelection, isDirty],
  );

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
    setNameDialog({
      open: false,
      mode: "create",
      scope: "collection",
      collectionId: null,
      requestId: null,
      value: "",
      errorKey: null,
    });
  }, [actions, draft, nameDialog, requestActions]);

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

  const createRequestInCollection = useCallback(
    async (collectionId: string): Promise<void> => {
      if (isDirty) {
        setPendingSelection({ kind: "collection", collectionId });
        setDiscardOpen(true);
        return;
      }
      const result = await requestActions.create(collectionId);
      if (result.kind === "error") {
        setRequestErrorKey(result.messageKey);
        return;
      }
      if (result.request === undefined) {
        clearEditor();
        setSelection({ kind: "collection", collectionId });
        return;
      }
      setDraft(result.request);
      setSavedDraft(result.request);
      setRunResult(null);
      setRunState("idle");
      setRequestErrorKey(null);
      setSelection({ kind: "request", collectionId, requestId: result.request.id });
    },
    [clearEditor, isDirty, requestActions],
  );

  const journalProps = useMemo(
    () => ({
      panel: journal.panel,
      onRetry: () => {
        void journal.refresh();
      },
    }),
    [journal],
  );

  const sidebar = useMemo((): ExternalServicesSidebarProps => {
    return {
      collections: shell.settings.collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        enabled: collection.enabled,
        requests: collection.requests.map((request) => ({
          id: request.id,
          name: request.name,
          method: request.method,
          enabled: request.enabled,
        })),
      })),
      selection,
      busy: actions.busy || requestActions.busy,
      loadState: shell.panel.loadState,
      onCreateCollection: () => {
        setNameDialog({
          open: true,
          mode: "create",
          scope: "collection",
          collectionId: null,
          requestId: null,
          value: "",
          errorKey: null,
        });
      },
      onImportCollection: () => {
        void actions.importCollection();
      },
      onSelectCollection: (collectionId) => {
        requestSelectionChange({ kind: "collection", collectionId });
      },
      onSelectRequest: (collectionId, requestId) => {
        requestSelectionChange({ kind: "request", collectionId, requestId });
      },
      onCreateRequest: (collectionId) => {
        void createRequestInCollection(collectionId);
      },
      onRenameCollection: (collectionId) => {
        const collection = findCollectionSummary(collectionId);
        if (collection === undefined) return;
        setNameDialog({
          open: true,
          mode: "rename",
          scope: "collection",
          collectionId,
          requestId: null,
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
        const collection = findCollectionSummary(collectionId);
        if (collection !== undefined) setVariablesCollection(collection);
      },
      onDeleteCollection: (collectionId) => {
        const collection = findCollectionSummary(collectionId);
        if (collection === undefined) return;
        setDeleteDialog({ open: true, collectionId, collectionName: collection.name });
      },
      onToggleRequest: (collectionId, requestId, enabled) => {
        void requestActions.toggle(collectionId, requestId, enabled).then((result) => {
          if (result.kind === "error") {
            setRequestErrorKey(result.messageKey);
            return;
          }
          setDraft((previous) => {
            if (previous === null || previous.id !== requestId) return previous;
            return { ...previous, enabled };
          });
          setSavedDraft((previous) => {
            if (previous === null || previous.id !== requestId) return previous;
            return { ...previous, enabled };
          });
        });
      },
      onRenameRequest: (collectionId, requestId) => {
        const request = shell.settings.collections
          .find((item) => item.id === collectionId)
          ?.requests.find((item) => item.id === requestId);
        if (request === undefined) return;
        setNameDialog({
          open: true,
          mode: "rename",
          scope: "request",
          collectionId,
          requestId,
          value: request.name,
          errorKey: null,
        });
      },
      onDuplicateRequest: (collectionId, requestId) => {
        void requestActions.duplicate(collectionId, requestId);
      },
      onDeleteRequest: (collectionId, requestId) => {
        void requestActions.delete(collectionId, requestId).then((result) => {
          if (result.kind === "error") return;
          if (selection.kind === "request" && selection.requestId === requestId) {
            applySelection({ kind: "collection", collectionId });
          }
        });
      },
    };
  }, [
    actions,
    applySelection,
    createRequestInCollection,
    findCollectionSummary,
    requestActions,
    requestSelectionChange,
    selection,
    shell.panel.loadState,
    shell.settings.collections,
  ]);

  const dialogs = useMemo((): ExternalServicesCollectionsDialogsProps => {
    return {
      busy: actions.busy,
      errorMessage: shell.errorKey !== null ? t(shell.errorKey) : null,
      statusMessage:
        shell.statusMessageKey !== null
          ? formatExternalServicesStatusMessage(shell.statusMessageKey, shell.statusMessageParams)
          : null,
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
      onRetry: () => {
        void shell.refresh();
      },
      onNameDialogOpenChange: (open) => {
        if (!open) {
          setNameDialog({
            open: false,
            mode: "create",
            scope: "collection",
            collectionId: null,
            requestId: null,
            value: "",
            errorKey: null,
          });
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
    shell,
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

  const selectedCollection =
    selection.kind === "none"
      ? null
      : shell.settings.collections.find((item) => item.id === selection.collectionId) ?? null;

  const welcome = useMemo((): ExternalServicesWelcomeProps | null => {
    if (selection.kind !== "none") return null;
    return { journal: journalProps };
  }, [journalProps, selection.kind]);

  const requestsView = useMemo((): ExternalServicesRequestsViewProps | null => {
    if (selection.kind !== "collection" || selectedCollection === null) return null;
    return {
      collection: {
        ...selectedCollection,
        enabledRequestCount: selectedCollection.requests.filter((item) => item.enabled).length,
        requestCount: selectedCollection.requests.length,
      },
      busy: requestActions.busy || actions.busy,
      journal: journalProps,
      onCreate: () => {
        void createRequestInCollection(selectedCollection.id);
      },
      onEditVariables: () => {
        const summary = findCollectionSummary(selectedCollection.id);
        if (summary !== undefined) setVariablesCollection(summary);
      },
      onRename: (name) => {
        void actions.renameCollection(selectedCollection.id, name);
      },
    };
  }, [
    actions,
    createRequestInCollection,
    findCollectionSummary,
    journalProps,
    requestActions.busy,
    selectedCollection,
    selection.kind,
  ]);

  const waitingQueueItems = useMemo(() => {
    if (facade === null) return [];
    void queueRefresh;
    return facade.getExternalServicesWaitingJobs().map((waiting) => ({
      jobId: waiting.job.jobId,
      collectionName: waiting.job.collectionName,
      requestName: waiting.job.requestName,
      method: waiting.job.request.method,
      eventType: waiting.job.trigger.eventType,
      occurredAt: waiting.job.trigger.occurredAt,
      fireAt: waiting.fireAt,
    }));
  }, [facade, queueRefresh]);

  const requestEditor = useMemo((): ExternalServicesRequestEditorProps | null => {
    if (
      selection.kind !== "request" ||
      selectedCollection === null ||
      draft === null ||
      facade === null
    ) return null;
    return {
      collectionName: selectedCollection.name,
      collectionVariableKeys: selectedCollection.variables.map((item) => item.key),
      draft,
      busy: requestActions.busy,
      errorMessage: requestErrorKey === null ? null : t(requestErrorKey),
      runState,
      runResult,
      journal: journalProps,
      queue: {
        items: waitingQueueItems,
        onCancel: (jobId) => {
          facade.cancelExternalServiceQueuedJob(jobId);
          setQueueRefresh((value) => value + 1);
        },
      },
      onChange: setDraft,
      onCommitName: (name) => {
        setDraft((previous) => (previous === null ? previous : { ...previous, name }));
        void requestActions.rename(selectedCollection.id, draft.id, name).then((result) => {
          if (result.kind === "error") {
            setRequestErrorKey(result.messageKey);
            return;
          }
          setSavedDraft((previous) =>
            previous === null ? previous : { ...previous, name },
          );
          setRequestErrorKey(null);
        });
      },
      onDelete: () => {
        void requestActions.delete(selectedCollection.id, draft.id).then((result) => {
          if (result.kind === "error") {
            setRequestErrorKey(result.messageKey);
            return;
          }
          applySelection({ kind: "collection", collectionId: selectedCollection.id });
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
          const persistedRequest = selectedCollection.requests.find((item) => item.id === draft.id);
          if (persistedRequest === undefined) {
            setRequestErrorKey("settings.integrations.externalServices.saveError");
            setRunState("idle");
            return;
          }
          const result = await facade.runExternalServiceRequestNow({
            collectionId: selectedCollection.id,
            requestId: persistedRequest.id,
            expectedSettingsRevision: saveResult.settingsRevision,
            profileKey,
            occurredAt: new Date().toISOString(),
          });
          setRunResult(result);
          setRunState("idle");
          void journal.refresh();
        });
      },
    };
  }, [
    applySelection,
    draft,
    facade,
    journal,
    journalProps,
    requestActions,
    requestErrorKey,
    runResult,
    runState,
    selectedCollection,
    selection.kind,
    shell.profileKey,
    t,
    waitingQueueItems,
  ]);

  return { sidebar, welcome, requestsView, requestEditor, dialogs, variablesDialog };
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
