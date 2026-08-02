/**
 * - Purpose: orchestrate External Applications drafts and history for Settings.
 * - Inputs: facade, section visibility, settings refresh callback.
 * - Outputs: panel props and persistence intents.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildExternalServicesManualRunFacts } from "@application/integration/buildExternalServicesManualRunFacts.js";
import { readExternalServicesProductStateFromStore } from "@application/integration/readExternalServicesProductStateFromStore.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  ExternalApplicationsJournalEntryVm,
  UserSettings,
} from "@application/index.js";
import type {
  ExternalApplicationsPanelProps,
  ExternalApplicationsSidebarSelection,
} from "../components/settings/external-applications/ExternalApplicationsPanel.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { NotificationDescriptor } from "./useNotifications.js";

type ExternalApplicationsSettings = UserSettings["externalApplications"];
type ExternalApplication = ExternalApplicationsSettings["applications"][number];
type ExternalApplicationId = ExternalApplication["id"];
type ExternalApplicationsFacade = Pick<
  AccountBootstrapFacade,
  | "getUserSettingsForAccount"
  | "saveExternalApplicationsSettings"
  | "openExternalApplicationNow"
  | "queryExternalApplicationsJournal"
>;

type UseExternalApplicationsPanelInput = Readonly<{
  facade: ExternalApplicationsFacade | null;
  sectionActive: boolean;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

function createApplication(): ExternalApplication {
  return {
    id: crypto.randomUUID() as ExternalApplicationId,
    name: "App",
    enabled: true,
    urlTemplate: "https://example.com/{{call_id}}",
    openMode: "electron_window",
    window: { width: 1100, height: 800 },
    variables: [],
    triggers: [],
    conditions: {
      callDirection: "any",
      queueNames: [],
    },
    windowBehavior: {
      raiseOnOpen: true,
      alwaysOnTopDuringCall: false,
      onCallEnded: "leave",
    },
  };
}

function duplicateApplication(source: ExternalApplication): ExternalApplication {
  return {
    ...source,
    id: crypto.randomUUID() as ExternalApplicationId,
    name: `${source.name} copy`,
    variables: source.variables.map((variable) => ({ ...variable })),
    triggers: source.triggers.map((trigger) => ({ ...trigger })),
    window: { ...source.window },
    conditions: { ...source.conditions },
    windowBehavior: { ...source.windowBehavior },
  };
}

/**
 * - Purpose: load and persist active-profile External Applications settings.
 * - Inputs: facade availability and selected Settings section.
 * - Outputs: presentational panel state without Electron access in components.
 */
export function useExternalApplicationsPanel(
  input: UseExternalApplicationsPanelInput,
): ExternalApplicationsPanelProps {
  const { facade, sectionActive, onActiveUserSettingsRefresh, notify } = input;
  const [settings, setSettings] = useState<ExternalApplicationsSettings>({
    applications: [],
  });
  const [selection, setSelection] = useState<ExternalApplicationsSidebarSelection | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [forceNameEditKey, setForceNameEditKey] = useState(0);
  const [historyEntries, setHistoryEntries] = useState<
    ReadonlyArray<ExternalApplicationsJournalEntryVm>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const loadHistory = useCallback(async (): Promise<void> => {
    if (facade === null) return;
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const result = await facade.queryExternalApplicationsJournal();
      if (!result.ok) {
        setHistoryError(true);
        return;
      }
      setHistoryEntries(result.value);
    } finally {
      setHistoryLoading(false);
    }
  }, [facade]);

  useEffect(() => {
    if (!sectionActive || facade === null) return;
    let cancelled = false;
    void facade.getUserSettingsForAccount().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(true);
        return;
      }
      const nextSettings = result.value.externalApplications;
      setSettings(nextSettings);
      setSelection((current) => {
        if (current?.kind === "history") {
          return current;
        }
        const currentId = current?.kind === "application" ? current.id : null;
        if (
          currentId !== null &&
          nextSettings.applications.some((application) => application.id === currentId)
        ) {
          return { kind: "application", id: currentId };
        }
        const firstId = nextSettings.applications[0]?.id;
        return firstId === undefined ? null : { kind: "application", id: firstId };
      });
      setLoadError(false);
    });
    return () => {
      cancelled = true;
    };
  }, [facade, sectionActive]);

  useEffect(() => {
    if (!sectionActive || selection?.kind !== "history") return;
    void loadHistory();
  }, [loadHistory, sectionActive, selection?.kind]);

  const selectedApplication = useMemo(() => {
    if (selection?.kind !== "application") {
      return null;
    }
    return (
      settings.applications.find((application) => application.id === selection.id) ?? null
    );
  }, [selection, settings.applications]);

  const updateApplication = useCallback((nextApplication: ExternalApplication): void => {
    setSettings((current) => ({
      applications: current.applications.map((application) =>
        application.id === nextApplication.id ? nextApplication : application,
      ),
    }));
  }, []);

  const handleCreate = useCallback((): void => {
    const application = createApplication();
    setSettings((current) => ({
      applications: [...current.applications, application],
    }));
    setSelection({ kind: "application", id: application.id });
    setForceNameEditKey((current) => current + 1);
  }, []);

  const handleToggle = useCallback((id: ExternalApplicationId, enabled: boolean): void => {
    setSettings((current) => ({
      applications: current.applications.map((application) =>
        application.id === id ? { ...application, enabled } : application,
      ),
    }));
  }, []);

  const handleRename = useCallback((id: ExternalApplicationId): void => {
    setSelection({ kind: "application", id });
    setForceNameEditKey((current) => current + 1);
  }, []);

  const handleDuplicate = useCallback((id: ExternalApplicationId): void => {
    setSettings((current) => {
      const source = current.applications.find((application) => application.id === id);
      if (source === undefined) return current;
      const duplicate = duplicateApplication(source);
      setSelection({ kind: "application", id: duplicate.id });
      return { applications: [...current.applications, duplicate] };
    });
  }, []);

  const handleDelete = useCallback((id: ExternalApplicationId): void => {
    setSettings((current) => {
      const applications = current.applications.filter((application) => application.id !== id);
      setSelection((currentSelected) => {
        if (currentSelected?.kind === "history") {
          return currentSelected;
        }
        if (currentSelected?.kind === "application" && currentSelected.id !== id) {
          return currentSelected;
        }
        const firstId = applications[0]?.id;
        return firstId === undefined ? null : { kind: "application", id: firstId };
      });
      return { applications };
    });
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (facade === null) return;
    setBusy(true);
    try {
      const result = await facade.saveExternalApplicationsSettings(settings);
      if (!result.ok) {
        notify?.({
          level: "error",
          messageKey: "settings.integrations.externalApplications.validation.saveFailed",
          module: "externalApplications",
          functionId: "external_applications.save",
          interruptClass: "actionable",
        });
        return;
      }
      onActiveUserSettingsRefresh(result.value.settings);
    } finally {
      setBusy(false);
    }
  }, [facade, notify, onActiveUserSettingsRefresh, settings]);

  const handleOpenNow = useCallback(async (): Promise<void> => {
    if (facade === null || selection?.kind !== "application") return;
    setBusy(true);
    try {
      const manualFacts = buildExternalServicesManualRunFacts(
        readExternalServicesProductStateFromStore(
          useAccountBootstrapStore.getState(),
        ),
      );
      await facade.openExternalApplicationNow(selection.id, manualFacts);
      if (selection.kind === "application") {
        void loadHistory();
      }
    } finally {
      setBusy(false);
    }
  }, [facade, loadHistory, selection]);

  return {
    applications: settings.applications,
    selectedApplication,
    selection,
    historyEntries,
    historyLoading,
    historyError,
    busy,
    loadError,
    forceNameEditKey,
    onSelectApplication: (id) => {
      setSelection({ kind: "application", id });
    },
    onSelectHistory: () => {
      setSelection({ kind: "history" });
    },
    onRetryHistory: () => {
      void loadHistory();
    },
    onCreate: handleCreate,
    onToggle: handleToggle,
    onRename: handleRename,
    onDuplicate: handleDuplicate,
    onDelete: handleDelete,
    onChange: updateApplication,
    onSave: () => {
      void handleSave();
    },
    onOpenNow: () => {
      void handleOpenNow();
    },
  };
}
