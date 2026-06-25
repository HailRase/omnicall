import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { MultiCallSettings } from "@application/index.js";

type UseSettingsActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  currentSettings: MultiCallSettings;
  applyMultiCallSettings: (settings: MultiCallSettings) => void;
}>;

type UseSettingsActionsResult = Readonly<{
  onMultiSessionsToggle: (enabled: boolean) => void;
  settingsUpdateError: string | null;
}>;

function resolveSettingsUpdateError(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to save settings";
}

/**
 * - Purpose: bind settings overlay toggles to facade config updates (LF-032, LF-076).
 * - Inputs: facade, current multi-call settings, store projection applier.
 * - Outputs: multi-sessions toggle callback and observable save errors.
 */
export function useSettingsActions(
  input: UseSettingsActionsInput,
): UseSettingsActionsResult {
  const { facade, currentSettings, applyMultiCallSettings } = input;
  const [settingsUpdateError, setSettingsUpdateError] = useState<string | null>(null);

  const onMultiSessionsToggle = useCallback(
    (enabled: boolean): void => {
      if (facade === null) {
        return;
      }

      const nextSettings: MultiCallSettings = {
        multiSessionsEnabled: enabled,
        autoUnholdOnTransferFailure:
          currentSettings.autoUnholdOnTransferFailure !== false,
      };

      void facade
        .updateMultiCallSettings(nextSettings)
        .then((savedSettings) => {
          setSettingsUpdateError(null);
          applyMultiCallSettings(savedSettings);
        })
        .catch((error: unknown) => {
          setSettingsUpdateError(resolveSettingsUpdateError(error));
        });
    },
    [applyMultiCallSettings, currentSettings.autoUnholdOnTransferFailure, facade],
  );

  return { onMultiSessionsToggle, settingsUpdateError };
}
