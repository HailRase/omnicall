/**
 * - Purpose: assemble External Services sidebar presentational props.
 * - Inputs: collections, selection, action callbacks, and dialog openers.
 * - Outputs: ExternalServicesSidebarProps bag.
 */

import type {
  ExternalServicesCollectionSummaryVm,
  ExternalServicesSettings,
} from "@application/index.js";
import type { ExternalServicesSidebarProps } from "../../components/settings/external-services/ExternalServicesSidebar.js";
import type { UseExternalServicesActionsResult } from "../useExternalServicesActions.js";
import type { UseExternalServicesRequestActionsResult } from "../useExternalServicesRequestActions.js";
import type { UseExternalServicesShellResult } from "../useExternalServicesShell.js";
import type { NotificationDescriptor } from "../useNotifications.js";
import type { UseExternalServicesPanelDialogsResult } from "./useExternalServicesPanelDialogs.js";
import { presentExternalServicesOutcomeError } from "./presentExternalServicesOutcomeError.js";
import type { UseExternalServicesPanelSelectionResult } from "./useExternalServicesPanelSelection.js";

export function buildExternalServicesSidebarProps(input: Readonly<{
  collections: ExternalServicesSettings["collections"];
  selection: UseExternalServicesPanelSelectionResult["selection"];
  busy: boolean;
  loadState: UseExternalServicesShellResult["panel"]["loadState"];
  findCollectionSummary: (
    collectionId: string,
  ) => ExternalServicesCollectionSummaryVm | undefined;
  actions: Pick<
    UseExternalServicesActionsResult,
    "importCollection" | "duplicateCollection" | "exportCollection"
  >;
  requestActions: UseExternalServicesRequestActionsResult;
  dialogsApi: Pick<
    UseExternalServicesPanelDialogsResult,
    | "openCreateCollectionDialog"
    | "openRenameCollectionDialog"
    | "openRenameRequestDialog"
    | "openDeleteCollectionDialog"
    | "openVariablesDialog"
  >;
  requestSelectionChange: UseExternalServicesPanelSelectionResult["requestSelectionChange"];
  createRequestInCollection: UseExternalServicesPanelSelectionResult["createRequestInCollection"];
  applySelection: UseExternalServicesPanelSelectionResult["applySelection"];
  setDraft: UseExternalServicesPanelSelectionResult["setDraft"];
  setSavedDraft: UseExternalServicesPanelSelectionResult["setSavedDraft"];
  setRequestErrorKey: UseExternalServicesPanelSelectionResult["setRequestErrorKey"];
  notify?: (descriptor: NotificationDescriptor) => void;
}>): ExternalServicesSidebarProps {
  const {
    collections,
    selection,
    busy,
    loadState,
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
    notify,
  } = input;
  return {
    collections: collections.map((collection) => ({
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
    busy,
    loadState,
    onCreateCollection: dialogsApi.openCreateCollectionDialog,
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
      dialogsApi.openRenameCollectionDialog(collectionId, collection.name);
    },
    onDuplicateCollection: (collectionId) => {
      void actions.duplicateCollection(collectionId);
    },
    onExportCollection: (collectionId) => {
      void actions.exportCollection(collectionId);
    },
    onEditVariables: (collectionId) => {
      const collection = findCollectionSummary(collectionId);
      if (collection !== undefined) dialogsApi.openVariablesDialog(collection);
    },
    onDeleteCollection: (collectionId) => {
      const collection = findCollectionSummary(collectionId);
      if (collection === undefined) return;
      dialogsApi.openDeleteCollectionDialog(collectionId, collection.name);
    },
    onToggleRequest: (collectionId, requestId, enabled) => {
      void requestActions.toggle(collectionId, requestId, enabled).then((result) => {
        if (result.kind === "error") {
          presentExternalServicesOutcomeError({
            messageKey: result.messageKey,
            ...(notify !== undefined ? { notify } : {}),
            setInlineErrorKey: setRequestErrorKey,
            functionId: "external_services.request.toggle",
          });
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
      const request = collections
        .find((item) => item.id === collectionId)
        ?.requests.find((item) => item.id === requestId);
      if (request === undefined) return;
      dialogsApi.openRenameRequestDialog(collectionId, requestId, request.name);
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
}
