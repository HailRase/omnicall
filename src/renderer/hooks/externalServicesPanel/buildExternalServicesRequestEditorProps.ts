/**
 * - Purpose: assemble External Services request editor presentational props.
 * - Inputs: facade, selected collection, draft, run state, and action callbacks.
 * - Outputs: ExternalServicesRequestEditorProps bag.
 */

import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  ExternalServicesSettings,
  SettingsAccountKey,
} from "@application/index.js";
import type { ExternalServicesQueueProps } from "../../components/settings/external-services/ExternalServicesQueue.js";
import type { ExternalServicesRequestEditorProps } from "../../components/settings/external-services/ExternalServicesRequestEditor.js";
import type { UseExternalServicesRequestActionsResult } from "../useExternalServicesRequestActions.js";
import type { UseExternalServicesPanelSelectionResult } from "./useExternalServicesPanelSelection.js";

export function buildExternalServicesRequestEditorProps(input: Readonly<{
  facade: AccountBootstrapFacade;
  profileKey: SettingsAccountKey | null;
  selectedCollection: ExternalServicesSettings["collections"][number];
  draft: NonNullable<UseExternalServicesPanelSelectionResult["draft"]>;
  busy: boolean;
  errorMessage: string | null;
  runState: ExternalServicesRequestEditorProps["runState"];
  runResult: ExternalServicesRequestEditorProps["runResult"];
  journalProps: ExternalServicesRequestEditorProps["journal"];
  waitingQueueItems: ExternalServicesQueueProps["items"];
  bumpQueueRefresh: () => void;
  requestActions: UseExternalServicesRequestActionsResult;
  setDraft: UseExternalServicesPanelSelectionResult["setDraft"];
  setSavedDraft: UseExternalServicesPanelSelectionResult["setSavedDraft"];
  setRunResult: UseExternalServicesPanelSelectionResult["setRunResult"];
  setRunState: UseExternalServicesPanelSelectionResult["setRunState"];
  setRequestErrorKey: UseExternalServicesPanelSelectionResult["setRequestErrorKey"];
  applySelection: UseExternalServicesPanelSelectionResult["applySelection"];
  refreshJournal: () => void;
}>): ExternalServicesRequestEditorProps {
  const {
    facade,
    profileKey,
    selectedCollection,
    draft,
    busy,
    errorMessage,
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
    refreshJournal,
  } = input;
  return {
    collectionName: selectedCollection.name,
    collectionVariableKeys: selectedCollection.variables.map((item) => item.key),
    draft,
    busy,
    errorMessage,
    runState,
    runResult,
    journal: journalProps,
    queue: {
      items: waitingQueueItems,
      onCancel: (jobId) => {
        facade.cancelExternalServiceQueuedJob(jobId);
        bumpQueueRefresh();
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
      if (profileKey === null) return;
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
        refreshJournal();
      });
    },
  };
}
