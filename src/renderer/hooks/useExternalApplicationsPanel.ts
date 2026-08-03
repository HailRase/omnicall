/**
 * - Purpose: orchestrate External Applications drafts and history for Settings.
 * - Inputs: facade, section visibility, settings refresh callback.
 * - Outputs: panel props and persistence intents.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  areExternalApplicationsSettingsEqual,
  patchApplicationEnabled,
  type ExternalApplication,
  type ExternalApplicationId,
  type ExternalApplicationsSettings,
} from "./externalApplicationsDraftUtils.js";
import { useExternalApplicationsPanelNavigation } from "./useExternalApplicationsPanelNavigation.js";
import type { NotificationDescriptor } from "./useNotifications.js";

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

const EMPTY_SETTINGS: ExternalApplicationsSettings = { applications: [] };

/**
 * - Purpose: load and persist active-profile External Applications settings.
 * - Inputs: facade availability and selected Settings section.
 * - Outputs: presentational panel state without Electron access in components.
 */
export function useExternalApplicationsPanel(
  input: UseExternalApplicationsPanelInput,
): ExternalApplicationsPanelProps {
  const { facade, sectionActive, onActiveUserSettingsRefresh, notify } = input;
  const [settings, setSettings] = useState<ExternalApplicationsSettings>(EMPTY_SETTINGS);
  const [savedSettings, setSavedSettings] =
    useState<ExternalApplicationsSettings>(EMPTY_SETTINGS);
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

  const savedSettingsRef = useRef(savedSettings);
  const settingsRef = useRef(settings);

  useEffect(() => {
    savedSettingsRef.current = savedSettings;
  }, [savedSettings]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const isDirty = !areExternalApplicationsSettingsEqual(settings, savedSettings);
  const navigation = useExternalApplicationsPanelNavigation({
    isDirty,
    setSettings,
    setSelection,
    setForceNameEditKey,
  });

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
      setSavedSettings(nextSettings);
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

  const handleToggle = useCallback(
    async (id: ExternalApplicationId, enabled: boolean): Promise<void> => {
      setSettings((current) => patchApplicationEnabled(current, id, enabled));

      const baseline = savedSettingsRef.current;
      const baselineApp = baseline.applications.find((application) => application.id === id);
      if (baselineApp === undefined || baselineApp.enabled === enabled) {
        return;
      }
      if (facade === null) {
        setSettings((current) => patchApplicationEnabled(current, id, baselineApp.enabled));
        return;
      }

      setBusy(true);
      try {
        const toPersist = patchApplicationEnabled(baseline, id, enabled);
        const result = await facade.saveExternalApplicationsSettings(toPersist);
        if (!result.ok) {
          setSettings((current) => patchApplicationEnabled(current, id, baselineApp.enabled));
          notify?.({
            level: "error",
            messageKey: "settings.integrations.externalApplications.validation.saveFailed",
            module: "externalApplications",
            functionId: "external_applications.toggle",
            interruptClass: "actionable",
          });
          return;
        }
        const persisted = result.value.settings.externalApplications;
        setSavedSettings(persisted);
        savedSettingsRef.current = persisted;
        setSettings((current) => patchApplicationEnabled(current, id, enabled));
        onActiveUserSettingsRefresh(result.value.settings);
      } finally {
        setBusy(false);
      }
    },
    [facade, notify, onActiveUserSettingsRefresh],
  );

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
      const draft = settingsRef.current;
      const result = await facade.saveExternalApplicationsSettings(draft);
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
      const persisted = result.value.settings.externalApplications;
      setSettings(persisted);
      setSavedSettings(persisted);
      savedSettingsRef.current = persisted;
      onActiveUserSettingsRefresh(result.value.settings);
    } finally {
      setBusy(false);
    }
  }, [facade, notify, onActiveUserSettingsRefresh]);

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
    isDirty,
    discardDialogOpen: navigation.discardOpen,
    onDiscardDialogOpenChange: (open) => {
      if (open) {
        navigation.setDiscardOpen(true);
        return;
      }
      navigation.cancelDiscard();
    },
    onDiscardConfirm: () => {
      navigation.confirmDiscard(savedSettingsRef.current);
    },
    onSelectApplication: (id) => {
      if (selection?.kind === "application" && selection.id === id) {
        return;
      }
      navigation.requestNavigation({ kind: "application", id });
    },
    onSelectHistory: () => {
      if (selection?.kind === "history") {
        return;
      }
      navigation.requestNavigation({ kind: "history" });
    },
    onRetryHistory: () => {
      void loadHistory();
    },
    onCreate: () => {
      navigation.requestNavigation({ kind: "create" });
    },
    onToggle: (id, enabled) => {
      void handleToggle(id, enabled);
    },
    onRename: (id) => {
      if (selection?.kind === "application" && selection.id === id) {
        setForceNameEditKey((current) => current + 1);
        return;
      }
      navigation.requestNavigation({ kind: "rename", id });
    },
    onDuplicate: (id) => {
      navigation.requestNavigation({ kind: "duplicate", id });
    },
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
