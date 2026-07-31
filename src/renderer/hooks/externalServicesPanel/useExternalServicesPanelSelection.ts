/**
 * - Purpose: own External Services sidebar selection and request draft state.
 * - Inputs: settings collections and request create action.
 * - Outputs: selection/draft APIs and dirty-guarded navigation helpers.
 */

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { ExternalServicesSettings } from "@application/index.js";
import type { TranslationKey } from "../../i18n/index.js";
import type {
  ExternalServicesRequestDraft,
  ExternalServicesRequestEditorProps,
} from "../../components/settings/external-services/ExternalServicesRequestEditor.js";
import type { ExternalServicesSidebarSelection } from "../../components/settings/external-services/ExternalServicesSidebar.js";
import type { UseExternalServicesRequestActionsResult } from "../useExternalServicesRequestActions.js";

export type UseExternalServicesPanelSelectionResult = Readonly<{
  selection: ExternalServicesSidebarSelection;
  pendingSelection: ExternalServicesSidebarSelection | null;
  discardOpen: boolean;
  draft: ExternalServicesRequestDraft | null;
  savedDraft: ExternalServicesRequestDraft | null;
  runResult: ExternalServicesRequestEditorProps["runResult"];
  runState: ExternalServicesRequestEditorProps["runState"];
  requestErrorKey: TranslationKey | null;
  isDirty: boolean;
  setDraft: Dispatch<SetStateAction<ExternalServicesRequestDraft | null>>;
  setSavedDraft: Dispatch<SetStateAction<ExternalServicesRequestDraft | null>>;
  setRunResult: Dispatch<SetStateAction<ExternalServicesRequestEditorProps["runResult"]>>;
  setRunState: Dispatch<SetStateAction<ExternalServicesRequestEditorProps["runState"]>>;
  setRequestErrorKey: Dispatch<SetStateAction<TranslationKey | null>>;
  setPendingSelection: Dispatch<SetStateAction<ExternalServicesSidebarSelection | null>>;
  setDiscardOpen: Dispatch<SetStateAction<boolean>>;
  clearEditor: () => void;
  applySelection: (next: ExternalServicesSidebarSelection) => void;
  requestSelectionChange: (next: ExternalServicesSidebarSelection) => void;
  createRequestInCollection: (collectionId: string) => Promise<void>;
}>;

export function useExternalServicesPanelSelection(input: Readonly<{
  collections: ExternalServicesSettings["collections"];
  requestActions: Pick<UseExternalServicesRequestActionsResult, "create">;
}>): UseExternalServicesPanelSelectionResult {
  const { collections, requestActions } = input;
  const [selection, setSelection] = useState<ExternalServicesSidebarSelection>({ kind: "none" });
  const [pendingSelection, setPendingSelection] =
    useState<ExternalServicesSidebarSelection | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [draft, setDraft] = useState<ExternalServicesRequestDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<ExternalServicesRequestDraft | null>(null);
  const [runResult, setRunResult] =
    useState<ExternalServicesRequestEditorProps["runResult"]>(null);
  const [runState, setRunState] =
    useState<ExternalServicesRequestEditorProps["runState"]>("idle");
  const [requestErrorKey, setRequestErrorKey] = useState<TranslationKey | null>(null);

  const isDirty =
    savedDraft !== null && draft !== null && JSON.stringify(draft) !== JSON.stringify(savedDraft);

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
        const collection = collections.find((item) => item.id === next.collectionId);
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
    [clearEditor, collections],
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

  return {
    selection,
    pendingSelection,
    discardOpen,
    draft,
    savedDraft,
    runResult,
    runState,
    requestErrorKey,
    isDirty,
    setDraft,
    setSavedDraft,
    setRunResult,
    setRunState,
    setRequestErrorKey,
    setPendingSelection,
    setDiscardOpen,
    clearEditor,
    applySelection,
    requestSelectionChange,
    createRequestInCollection,
  };
}
