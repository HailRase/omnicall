/**
 * - Purpose: present External Services collections panel load/error state.
 * - Inputs: facade query outcome and section activity flag.
 * - Outputs: UI-safe panel VM, status message keys, and refresh callback.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveExternalServicesCollectionsFromSettings,
  deriveExternalServicesCollectionsPanel,
  EXTERNAL_SERVICES_DEFAULTS,
  type ExternalServicesCollectionsPanelVm,
  type ExternalServicesSettings,
  type SettingsAccountKey,
  type UserSettings,
} from "@application/index.js";
import type { TranslationKey } from "../i18n/messages.js";

export type ExternalServicesShellErrorKey =
  | "settings.integrations.externalServices.loadError"
  | "settings.integrations.externalServices.disabled.unavailable";

export type UseExternalServicesShellResult = Readonly<{
  panel: ExternalServicesCollectionsPanelVm;
  settings: ExternalServicesSettings;
  profileKey: SettingsAccountKey | null;
  errorKey: ExternalServicesShellErrorKey | null;
  statusMessageKey: TranslationKey | null;
  statusMessageParams: Readonly<Record<string, string>> | null;
  setStatusMessage: (
    key: TranslationKey | null,
    params?: Readonly<Record<string, string>>,
  ) => void;
  applySettingsSnapshot: (
    settings: ExternalServicesSettings,
    settingsRevision: number,
    matchingEnabled?: boolean,
  ) => void;
  applyImportedUserSettings: (settings: UserSettings, settingsRevision: number) => void;
  refresh: () => Promise<void>;
}>;

type UseExternalServicesShellInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  sectionActive: boolean;
}>;

/**
 * - Purpose: load and project External Services collections for Settings UI.
 * - Inputs: account bootstrap facade and active-section flag.
 * - Outputs: panel VM + settings snapshot for action mutations.
 */
export function useExternalServicesShell(
  input: UseExternalServicesShellInput,
): UseExternalServicesShellResult {
  const { facade, sectionActive } = input;
  const [panel, setPanel] = useState<ExternalServicesCollectionsPanelVm>(() =>
    deriveExternalServicesCollectionsPanel(null, "loading"),
  );
  const [settings, setSettings] = useState<ExternalServicesSettings>(
    EXTERNAL_SERVICES_DEFAULTS,
  );
  const [profileKey, setProfileKey] = useState<SettingsAccountKey | null>(null);
  const [errorKey, setErrorKey] = useState<ExternalServicesShellErrorKey | null>(null);
  const [statusMessageKey, setStatusMessageKey] = useState<TranslationKey | null>(null);
  const [statusMessageParams, setStatusMessageParams] = useState<Readonly<
    Record<string, string>
  > | null>(null);

  const setStatusMessage = useCallback(
    (key: TranslationKey | null, params?: Readonly<Record<string, string>>): void => {
      setStatusMessageKey(key);
      setStatusMessageParams(params ?? null);
    },
    [],
  );

  const applySettingsSnapshot = useCallback(
    (
      nextSettings: ExternalServicesSettings,
      settingsRevision: number,
      matchingEnabled = true,
    ): void => {
      setSettings(nextSettings);
      setPanel(
        deriveExternalServicesCollectionsFromSettings(
          nextSettings,
          settingsRevision,
          matchingEnabled,
        ),
      );
      setErrorKey(null);
    },
    [],
  );

  const applyImportedUserSettings = useCallback(
    (userSettings: UserSettings, settingsRevision: number): void => {
      applySettingsSnapshot(userSettings.externalServices, settingsRevision, true);
    },
    [applySettingsSnapshot],
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (facade === null) {
      setSettings(EXTERNAL_SERVICES_DEFAULTS);
      setProfileKey(null);
      setPanel(deriveExternalServicesCollectionsPanel(null, "unavailable"));
      setErrorKey("settings.integrations.externalServices.disabled.unavailable");
      return;
    }

    setPanel((previous) =>
      previous.loadState === "ready"
        ? previous
        : deriveExternalServicesCollectionsPanel(null, "loading"),
    );
    setErrorKey(null);

    const result = await facade.queryExternalServices({ journalLimit: 0 });
    if (!result.ok) {
      setSettings(EXTERNAL_SERVICES_DEFAULTS);
      setProfileKey(null);
      setPanel(deriveExternalServicesCollectionsPanel(null, "error"));
      setErrorKey("settings.integrations.externalServices.loadError");
      return;
    }

    setSettings(result.value.settings);
    setProfileKey(result.value.profileKey);
    setPanel(deriveExternalServicesCollectionsPanel(result.value, "ready"));
  }, [facade]);

  useEffect(() => {
    if (!sectionActive) {
      return;
    }
    void refresh();
  }, [refresh, sectionActive]);

  return useMemo(
    () => ({
      panel,
      settings,
      profileKey,
      errorKey,
      statusMessageKey,
      statusMessageParams,
      setStatusMessage,
      applySettingsSnapshot,
      applyImportedUserSettings,
      refresh,
    }),
    [
      panel,
      settings,
      profileKey,
      errorKey,
      statusMessageKey,
      statusMessageParams,
      setStatusMessage,
      applySettingsSnapshot,
      applyImportedUserSettings,
      refresh,
    ],
  );
}
