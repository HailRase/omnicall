/**
 * - Purpose: build External Services sidebar and main workspace view props.
 * - Inputs: shell, actions, selection/draft state, journal, and queue rows.
 * - Outputs: presentational sidebar/welcome/requests/editor prop bags.
 */

import { useCallback, useMemo } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { ExternalServicesCollectionSummaryVm } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import type { ExternalServicesQueueProps } from "../../components/settings/external-services/ExternalServicesQueue.js";
import type { ExternalServicesRequestEditorProps } from "../../components/settings/external-services/ExternalServicesRequestEditor.js";
import type { ExternalServicesRequestsViewProps } from "../../components/settings/external-services/ExternalServicesRequestsView.js";
import type { ExternalServicesSidebarProps } from "../../components/settings/external-services/ExternalServicesSidebar.js";
import type { ExternalServicesWelcomeProps } from "../../components/settings/external-services/ExternalServicesWelcome.js";
import type { UseExternalServicesActionsResult } from "../useExternalServicesActions.js";
import type { UseExternalServicesJournalResult } from "../useExternalServicesJournal.js";
import type { UseExternalServicesRequestActionsResult } from "../useExternalServicesRequestActions.js";
import type { UseExternalServicesShellResult } from "../useExternalServicesShell.js";
import { buildExternalServicesRequestEditorProps } from "./buildExternalServicesRequestEditorProps.js";
import { buildExternalServicesSidebarProps } from "./buildExternalServicesSidebarProps.js";
import type { NotificationDescriptor } from "../useNotifications.js";
import type { UseExternalServicesPanelDialogsResult } from "./useExternalServicesPanelDialogs.js";
import type { UseExternalServicesPanelSelectionResult } from "./useExternalServicesPanelSelection.js";

export type UseExternalServicesPanelWorkspaceResult = Readonly<{
  sidebar: ExternalServicesSidebarProps;
  welcome: ExternalServicesWelcomeProps | null;
  requestsView: ExternalServicesRequestsViewProps | null;
  requestEditor: ExternalServicesRequestEditorProps | null;
}>;

export function useExternalServicesPanelWorkspace(input: Readonly<{
  facade: AccountBootstrapFacade | null;
  shell: Pick<UseExternalServicesShellResult, "panel" | "settings" | "profileKey">;
  actions: Pick<
    UseExternalServicesActionsResult,
    | "busy"
    | "importCollection"
    | "duplicateCollection"
    | "exportCollection"
    | "renameCollection"
  >;
  requestActions: UseExternalServicesRequestActionsResult;
  journal: UseExternalServicesJournalResult;
  selectionApi: UseExternalServicesPanelSelectionResult;
  dialogsApi: Pick<
    UseExternalServicesPanelDialogsResult,
    | "openCreateCollectionDialog"
    | "openRenameCollectionDialog"
    | "openRenameRequestDialog"
    | "openDeleteCollectionDialog"
    | "openVariablesDialog"
  >;
  waitingQueueItems: ExternalServicesQueueProps["items"];
  bumpQueueRefresh: () => void;
  notify?: (descriptor: NotificationDescriptor) => void;
}>): UseExternalServicesPanelWorkspaceResult {
  const {
    facade,
    shell,
    actions,
    requestActions,
    journal,
    selectionApi,
    dialogsApi,
    waitingQueueItems,
    bumpQueueRefresh,
    notify,
  } = input;
  const { t } = useI18n();
  const {
    selection,
    draft,
    runResult,
    runState,
    requestErrorKey,
    setDraft,
    setSavedDraft,
    setRunResult,
    setRunState,
    setRequestErrorKey,
    applySelection,
    requestSelectionChange,
    createRequestInCollection,
  } = selectionApi;

  const findCollectionSummary = useCallback(
    (collectionId: string): ExternalServicesCollectionSummaryVm | undefined =>
      shell.panel.collections.find((entry) => entry.id === collectionId),
    [shell.panel.collections],
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

  const selectedCollection =
    selection.kind === "none"
      ? null
      : shell.settings.collections.find((item) => item.id === selection.collectionId) ?? null;

  const sidebar = useMemo(
    (): ExternalServicesSidebarProps =>
      buildExternalServicesSidebarProps({
        collections: shell.settings.collections,
        selection,
        busy: actions.busy || requestActions.busy,
        loadState: shell.panel.loadState,
        findCollectionSummary,
        actions,
        requestActions,
        dialogsApi,
        requestSelectionChange,
        createRequestInCollection,
        applySelection,
        setDraft,
        setSavedDraft,
        setRequestErrorKey,
        ...(notify !== undefined ? { notify } : {}),
      }),
    [
      actions,
      applySelection,
      createRequestInCollection,
      dialogsApi,
      findCollectionSummary,
      notify,
      requestActions,
      requestSelectionChange,
      selection,
      setDraft,
      setRequestErrorKey,
      setSavedDraft,
      shell.panel.loadState,
      shell.settings.collections,
    ],
  );

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
        if (summary !== undefined) dialogsApi.openVariablesDialog(summary);
      },
      onRename: (name) => {
        void actions.renameCollection(selectedCollection.id, name);
      },
    };
  }, [
    actions,
    createRequestInCollection,
    dialogsApi,
    findCollectionSummary,
    journalProps,
    requestActions.busy,
    selectedCollection,
    selection.kind,
  ]);

  const requestEditor = useMemo((): ExternalServicesRequestEditorProps | null => {
    if (
      selection.kind !== "request" ||
      selectedCollection === null ||
      draft === null ||
      facade === null
    ) {
      return null;
    }
    return buildExternalServicesRequestEditorProps({
      facade,
      profileKey: shell.profileKey,
      selectedCollection,
      draft,
      busy: requestActions.busy,
      errorMessage: requestErrorKey === null ? null : t(requestErrorKey),
      runState,
      runResult,
      journalProps,
      waitingQueueItems,
      bumpQueueRefresh,
      requestActions,
      setDraft,
      setSavedDraft,
      setRunResult,
      setRunState,
      setRequestErrorKey,
      applySelection,
      refreshJournal: () => {
        void journal.refresh();
      },
      ...(notify !== undefined ? { notify } : {}),
    });
  }, [
    applySelection,
    bumpQueueRefresh,
    draft,
    facade,
    journal,
    journalProps,
    notify,
    requestActions,
    requestErrorKey,
    runResult,
    runState,
    selectedCollection,
    selection.kind,
    setDraft,
    setRequestErrorKey,
    setRunResult,
    setRunState,
    setSavedDraft,
    shell.profileKey,
    t,
    waitingQueueItems,
  ]);

  return { sidebar, welcome, requestsView, requestEditor };
}
