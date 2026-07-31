/**
 * - Purpose: orchestrate External Applications drafts for Settings.
 * - Inputs: facade, section visibility, settings refresh callback.
 * - Outputs: panel props and persistence intents.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { UserSettings } from "@application/index.js";
import type { ExternalApplicationsPanelProps } from "../components/settings/external-applications/ExternalApplicationsPanel.js";

type ExternalApplicationsSettings = UserSettings["externalApplications"];
type ExternalApplication = ExternalApplicationsSettings["applications"][number];
type ExternalApplicationId = ExternalApplication["id"];
type ExternalApplicationsFacade = Pick<
  AccountBootstrapFacade,
  | "getUserSettingsForAccount"
  | "saveExternalApplicationsSettings"
  | "openExternalApplicationNow"
>;

type UseExternalApplicationsPanelInput = Readonly<{
  facade: ExternalApplicationsFacade | null;
  sectionActive: boolean;
  onActiveUserSettingsRefresh: (settings: UserSettings) => void;
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
  const { facade, sectionActive, onActiveUserSettingsRefresh } = input;
  const [settings, setSettings] = useState<ExternalApplicationsSettings>({ applications: [] });
  const [selectedId, setSelectedId] = useState<ExternalApplicationId | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [forceNameEditKey, setForceNameEditKey] = useState(0);

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
      setSelectedId((currentId) =>
        nextSettings.applications.some((application) => application.id === currentId)
          ? currentId
          : (nextSettings.applications[0]?.id ?? null),
      );
      setLoadError(false);
      setSaveError(false);
    });
    return () => {
      cancelled = true;
    };
  }, [facade, sectionActive]);

  const selectedApplication = useMemo(
    () => settings.applications.find((application) => application.id === selectedId) ?? null,
    [selectedId, settings.applications],
  );

  const updateApplication = useCallback((nextApplication: ExternalApplication): void => {
    setSettings((current) => ({
      applications: current.applications.map((application) =>
        application.id === nextApplication.id ? nextApplication : application,
      ),
    }));
    setSaveError(false);
  }, []);

  const handleCreate = useCallback((): void => {
    const application = createApplication();
    setSettings((current) => ({ applications: [...current.applications, application] }));
    setSelectedId(application.id);
    setForceNameEditKey((current) => current + 1);
    setSaveError(false);
  }, []);

  const handleToggle = useCallback((id: ExternalApplicationId, enabled: boolean): void => {
    setSettings((current) => ({
      applications: current.applications.map((application) =>
        application.id === id ? { ...application, enabled } : application,
      ),
    }));
    setSaveError(false);
  }, []);

  const handleRename = useCallback((id: ExternalApplicationId): void => {
    setSelectedId(id);
    setForceNameEditKey((current) => current + 1);
  }, []);

  const handleDuplicate = useCallback((id: ExternalApplicationId): void => {
    setSettings((current) => {
      const source = current.applications.find((application) => application.id === id);
      if (source === undefined) return current;
      const duplicate = duplicateApplication(source);
      setSelectedId(duplicate.id);
      return { applications: [...current.applications, duplicate] };
    });
    setSaveError(false);
  }, []);

  const handleDelete = useCallback((id: ExternalApplicationId): void => {
    setSettings((current) => {
      const applications = current.applications.filter((application) => application.id !== id);
      setSelectedId((currentSelected) =>
        currentSelected !== id ? currentSelected : (applications[0]?.id ?? null),
      );
      return { applications };
    });
    setSaveError(false);
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (facade === null) return;
    setBusy(true);
    setSaveError(false);
    try {
      const result = await facade.saveExternalApplicationsSettings(settings);
      if (!result.ok) {
        setSaveError(true);
        return;
      }
      onActiveUserSettingsRefresh(result.value.settings);
    } finally {
      setBusy(false);
    }
  }, [facade, onActiveUserSettingsRefresh, settings]);

  const handleOpenNow = useCallback(async (): Promise<void> => {
    if (facade === null || selectedId === null) return;
    setBusy(true);
    try {
      await facade.openExternalApplicationNow(selectedId);
    } finally {
      setBusy(false);
    }
  }, [facade, selectedId]);

  return {
    applications: settings.applications,
    selectedApplication,
    busy,
    loadError,
    saveError,
    forceNameEditKey,
    onSelect: setSelectedId,
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
