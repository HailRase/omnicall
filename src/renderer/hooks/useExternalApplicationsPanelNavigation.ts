/**
 * - Purpose: dirty-guarded navigation for External Applications Settings.
 * - Inputs: dirty flag and state setters for selection/settings.
 * - Outputs: request/apply navigation and discard-confirm helpers.
 */

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { ExternalApplicationsSidebarSelection } from "../components/settings/external-applications/ExternalApplicationsPanel.js";
import {
  createExternalApplication,
  duplicateExternalApplication,
  type ExternalApplicationId,
  type ExternalApplicationsSettings,
} from "./externalApplicationsDraftUtils.js";

export type ExternalApplicationsPendingNavigation =
  | ExternalApplicationsSidebarSelection
  | Readonly<{ kind: "create" }>
  | Readonly<{ kind: "duplicate"; id: ExternalApplicationId }>
  | Readonly<{ kind: "rename"; id: ExternalApplicationId }>;

export type UseExternalApplicationsPanelNavigationResult = Readonly<{
  discardOpen: boolean;
  pendingNavigation: ExternalApplicationsPendingNavigation | null;
  setDiscardOpen: Dispatch<SetStateAction<boolean>>;
  requestNavigation: (next: ExternalApplicationsPendingNavigation) => void;
  applyNavigation: (next: ExternalApplicationsPendingNavigation) => void;
  confirmDiscard: (restored: ExternalApplicationsSettings) => void;
  cancelDiscard: () => void;
}>;

export function useExternalApplicationsPanelNavigation(input: Readonly<{
  isDirty: boolean;
  setSettings: Dispatch<SetStateAction<ExternalApplicationsSettings>>;
  setSelection: Dispatch<SetStateAction<ExternalApplicationsSidebarSelection | null>>;
  setForceNameEditKey: Dispatch<SetStateAction<number>>;
}>): UseExternalApplicationsPanelNavigationResult {
  const { isDirty, setSettings, setSelection, setForceNameEditKey } = input;
  const [pendingNavigation, setPendingNavigation] =
    useState<ExternalApplicationsPendingNavigation | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const applyNavigation = useCallback(
    (next: ExternalApplicationsPendingNavigation): void => {
      if (next.kind === "create") {
        const application = createExternalApplication();
        setSettings((current) => ({
          applications: [...current.applications, application],
        }));
        setSelection({ kind: "application", id: application.id });
        setForceNameEditKey((current) => current + 1);
        return;
      }
      if (next.kind === "duplicate") {
        setSettings((current) => {
          const source = current.applications.find(
            (application) => application.id === next.id,
          );
          if (source === undefined) return current;
          const duplicate = duplicateExternalApplication(source);
          setSelection({ kind: "application", id: duplicate.id });
          return { applications: [...current.applications, duplicate] };
        });
        return;
      }
      if (next.kind === "rename") {
        setSelection({ kind: "application", id: next.id });
        setForceNameEditKey((current) => current + 1);
        return;
      }
      setSelection(next);
    },
    [setForceNameEditKey, setSelection, setSettings],
  );

  const requestNavigation = useCallback(
    (next: ExternalApplicationsPendingNavigation): void => {
      if (isDirty) {
        setPendingNavigation(next);
        setDiscardOpen(true);
        return;
      }
      applyNavigation(next);
    },
    [applyNavigation, isDirty],
  );

  const confirmDiscard = useCallback(
    (restored: ExternalApplicationsSettings): void => {
      const pending = pendingNavigation;
      setPendingNavigation(null);
      setDiscardOpen(false);
      if (pending === null) {
        setSettings(restored);
        return;
      }
      if (pending.kind === "create") {
        const application = createExternalApplication();
        setSettings({
          applications: [...restored.applications, application],
        });
        setSelection({ kind: "application", id: application.id });
        setForceNameEditKey((current) => current + 1);
        return;
      }
      if (pending.kind === "duplicate") {
        const source = restored.applications.find(
          (application) => application.id === pending.id,
        );
        if (source === undefined) {
          setSettings(restored);
          return;
        }
        const duplicate = duplicateExternalApplication(source);
        setSettings({
          applications: [...restored.applications, duplicate],
        });
        setSelection({ kind: "application", id: duplicate.id });
        return;
      }
      setSettings(restored);
      if (pending.kind === "rename") {
        setSelection({ kind: "application", id: pending.id });
        setForceNameEditKey((current) => current + 1);
        return;
      }
      setSelection(pending);
    },
    [pendingNavigation, setForceNameEditKey, setSelection, setSettings],
  );

  const cancelDiscard = useCallback((): void => {
    setPendingNavigation(null);
    setDiscardOpen(false);
  }, []);

  return {
    discardOpen,
    pendingNavigation,
    setDiscardOpen,
    requestNavigation,
    applyNavigation,
    confirmDiscard,
    cancelDiscard,
  };
}
