import { useCallback, useEffect, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { MultiCallSettings } from "@application/index.js";
import {
  createDefaultUserSettings,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
  type UserSettings,
} from "@application/index.js";

type UseSettingsActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  currentSettings: MultiCallSettings;
  applyMultiCallSettings: (settings: MultiCallSettings) => void;
}>;

type UseSettingsActionsResult = Readonly<{
  userSettings: UserSettings;
  onMultiSessionsToggle: (enabled: boolean) => void;
  onSipAutoReregisterToggle: (enabled: boolean) => void;
  onSipReregisterIntervalChange: (intervalSec: number) => void;
  settingsUpdateError: string | null;
}>;

function resolveSettingsUpdateError(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось сохранить настройки";
}

/**
 * - Purpose: bind settings overlay toggles to facade user settings (LF-032, LF-076, F-014).
 * - Inputs: facade, current multi-call settings, store projection applier.
 * - Outputs: settings callbacks and observable save errors.
 */
export function useSettingsActions(
  input: UseSettingsActionsInput,
): UseSettingsActionsResult {
  const { facade, currentSettings, applyMultiCallSettings } = input;
  const [settingsUpdateError, setSettingsUpdateError] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(createDefaultUserSettings());

  useEffect(() => {
    if (facade === null) {
      return;
    }

    void facade.getUserSettingsForAccount().then((result) => {
      if (result.ok) {
        setUserSettings(result.value);
      }
    });
  }, [facade]);

  const persistUserSettings = useCallback(
    (next: UserSettings): void => {
      if (facade === null) {
        return;
      }

      void facade
        .saveUserSettings(next)
        .then((result) => {
          if (!result.ok) {
            setSettingsUpdateError(result.error.message);
            return;
          }

          setSettingsUpdateError(null);
          setUserSettings(result.value);
          applyMultiCallSettings({
            multiSessionsEnabled: result.value.multiSessionsEnabled,
            autoUnholdOnTransferFailure: result.value.autoUnholdOnTransferFailure,
          });
        })
        .catch((error: unknown) => {
          setSettingsUpdateError(resolveSettingsUpdateError(error));
        });
    },
    [applyMultiCallSettings, facade],
  );

  const onMultiSessionsToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        multiSessionsEnabled: enabled,
        autoUnholdOnTransferFailure:
          currentSettings.autoUnholdOnTransferFailure !== false,
      });
    },
    [currentSettings.autoUnholdOnTransferFailure, persistUserSettings, userSettings],
  );

  const onSipAutoReregisterToggle = useCallback(
    (enabled: boolean): void => {
      persistUserSettings({
        ...userSettings,
        sipAutoReregisterEnabled: enabled,
      });
    },
    [persistUserSettings, userSettings],
  );

  const onSipReregisterIntervalChange = useCallback(
    (intervalSec: number): void => {
      const normalized = Math.max(MIN_SIP_REREGISTER_INTERVAL_SEC, intervalSec);
      persistUserSettings({
        ...userSettings,
        sipReregisterIntervalSec: normalized,
      });
    },
    [persistUserSettings, userSettings],
  );

  return {
    userSettings,
    onMultiSessionsToggle,
    onSipAutoReregisterToggle,
    onSipReregisterIntervalChange,
    settingsUpdateError,
  };
}
