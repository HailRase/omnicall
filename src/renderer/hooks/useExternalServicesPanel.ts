/**
 * - Purpose: compose External Services Postman-like Settings workspace props.
 * - Inputs: facade, section activity, and active UserSettings refresh callback.
 * - Outputs: presentational sidebar, panes, dialogs, and variables dialog props.
 */

import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { UserSettings } from "@application/index.js";
import type { ExternalServicesCollectionsDialogsProps } from "../components/settings/external-services/ExternalServicesCollectionsDialogs.js";
import type { ExternalServicesVariablesDialogProps } from "../components/settings/external-services/ExternalServicesVariablesDialog.js";
import type { ExternalServicesRequestEditorProps } from "../components/settings/external-services/ExternalServicesRequestEditor.js";
import type { ExternalServicesRequestsViewProps } from "../components/settings/external-services/ExternalServicesRequestsView.js";
import type { ExternalServicesSidebarProps } from "../components/settings/external-services/ExternalServicesSidebar.js";
import type { ExternalServicesWelcomeProps } from "../components/settings/external-services/ExternalServicesWelcome.js";
import { useExternalServicesPanelDialogs } from "./externalServicesPanel/useExternalServicesPanelDialogs.js";
import { useExternalServicesPanelQueue } from "./externalServicesPanel/useExternalServicesPanelQueue.js";
import { useExternalServicesPanelSelection } from "./externalServicesPanel/useExternalServicesPanelSelection.js";
import { useExternalServicesPanelWorkspace } from "./externalServicesPanel/useExternalServicesPanelWorkspace.js";
import { useExternalServicesActions } from "./useExternalServicesActions.js";
import { useExternalServicesJournal } from "./useExternalServicesJournal.js";
import { useExternalServicesRequestActions } from "./useExternalServicesRequestActions.js";
import { useExternalServicesShell } from "./useExternalServicesShell.js";
import type { NotificationDescriptor } from "./useNotifications.js";

type UseExternalServicesPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  sectionActive: boolean;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

export type UseExternalServicesPanelResult = Readonly<{
  sidebar: ExternalServicesSidebarProps;
  welcome: ExternalServicesWelcomeProps | null;
  requestsView: ExternalServicesRequestsViewProps | null;
  requestEditor: ExternalServicesRequestEditorProps | null;
  loadErrorMessage: string | null;
  statusMessage: string | null;
  onRetryLoad: () => void;
  dialogs: ExternalServicesCollectionsDialogsProps;
  variablesDialog: ExternalServicesVariablesDialogProps | null;
}>;

/**
 * - Purpose: orchestrate External Services workspace UI for SoftphoneReadyShell.
 * - Inputs: facade and settings refresh callback.
 * - Outputs: presentational workspace props only.
 */
export function useExternalServicesPanel(
  input: UseExternalServicesPanelInput,
): UseExternalServicesPanelResult {
  const { facade, sectionActive, onActiveUserSettingsRefresh, notify } = input;
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
  const journal = useExternalServicesJournal({ facade, active: sectionActive });
  const selectionApi = useExternalServicesPanelSelection({
    collections: shell.settings.collections,
    requestActions,
  });
  const queue = useExternalServicesPanelQueue({
    facade,
    sectionActive,
    refreshJournal: journal.refresh,
  });
  const dialogsApi = useExternalServicesPanelDialogs({
    shell,
    actions,
    requestActions,
    selection: selectionApi.selection,
    pendingSelection: selectionApi.pendingSelection,
    discardOpen: selectionApi.discardOpen,
    draft: selectionApi.draft,
    setDiscardOpen: selectionApi.setDiscardOpen,
    setPendingSelection: selectionApi.setPendingSelection,
    applySelection: selectionApi.applySelection,
    setDraft: selectionApi.setDraft,
    setSavedDraft: selectionApi.setSavedDraft,
  });
  const workspace = useExternalServicesPanelWorkspace({
    facade,
    shell,
    actions,
    requestActions,
    journal,
    selectionApi,
    dialogsApi,
    waitingQueueItems: queue.waitingQueueItems,
    bumpQueueRefresh: queue.bumpQueueRefresh,
    ...(notify !== undefined ? { notify } : {}),
  });

  return {
    sidebar: workspace.sidebar,
    welcome: workspace.welcome,
    requestsView: workspace.requestsView,
    requestEditor: workspace.requestEditor,
    loadErrorMessage: dialogsApi.banner.loadErrorMessage,
    statusMessage: dialogsApi.banner.statusMessage,
    onRetryLoad: dialogsApi.banner.onRetryLoad,
    dialogs: dialogsApi.dialogs,
    variablesDialog: dialogsApi.variablesDialog,
  };
}
