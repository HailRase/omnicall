import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { UserSettings } from "@application/index.js";
import { translateCurrent } from "../i18n/index.js";

export type PreferencesTransferActionResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "exported"; savedFileName: string }
  | { kind: "imported" }
  | { kind: "error"; message: string }
>;

type UsePreferencesTransferActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  currentVersion: string;
  onSettingsImported: (settings: UserSettings) => void;
}>;

type UsePreferencesTransferActionsResult = Readonly<{
  exportPreferences: () => Promise<PreferencesTransferActionResult>;
  importPreferences: () => Promise<PreferencesTransferActionResult>;
  isTransferBusy: boolean;
  transferStatusMessage: string | null;
}>;

/**
 * - Purpose: bind Settings General transfer buttons to facade export/import.
 * - Inputs: facade, app version, callback to apply imported UserSettings locally.
 * - Outputs: export/import actions with busy flag and status message keys resolved.
 */
export function usePreferencesTransferActions(
  input: UsePreferencesTransferActionsInput,
): UsePreferencesTransferActionsResult {
  const { facade, currentVersion, onSettingsImported } = input;
  const [isTransferBusy, setIsTransferBusy] = useState(false);
  const [transferStatusMessage, setTransferStatusMessage] = useState<string | null>(null);

  const exportPreferences = useCallback(async (): Promise<PreferencesTransferActionResult> => {
    if (facade === null) {
      const message = translateCurrent("settings.general.preferences.transfer.unavailable");
      setTransferStatusMessage(message);
      return { kind: "error", message };
    }

    setIsTransferBusy(true);
    setTransferStatusMessage(null);
    try {
      const result = await facade.exportOperatorPreferences({ appVersion: currentVersion });
      if (!result.ok) {
        const message = translateCurrent("settings.general.preferences.transfer.exportFailed");
        setTransferStatusMessage(message);
        return { kind: "error", message };
      }
      if (result.value.kind === "cancelled") {
        return { kind: "cancelled" };
      }
      const message = translateCurrent("settings.general.preferences.transfer.exportSucceeded", {
        fileName: result.value.savedFileName,
      });
      setTransferStatusMessage(message);
      return { kind: "exported", savedFileName: result.value.savedFileName };
    } finally {
      setIsTransferBusy(false);
    }
  }, [currentVersion, facade]);

  const importPreferences = useCallback(async (): Promise<PreferencesTransferActionResult> => {
    if (facade === null) {
      const message = translateCurrent("settings.general.preferences.transfer.unavailable");
      setTransferStatusMessage(message);
      return { kind: "error", message };
    }

    setIsTransferBusy(true);
    setTransferStatusMessage(null);
    try {
      const result = await facade.importOperatorPreferences();
      if (!result.ok) {
        const message = translateCurrent("settings.general.preferences.transfer.importFailed");
        setTransferStatusMessage(message);
        return { kind: "error", message };
      }
      if (result.value.kind === "cancelled") {
        return { kind: "cancelled" };
      }

      onSettingsImported(result.value.settings);

      const message = translateCurrent("settings.general.preferences.transfer.importSucceeded");
      setTransferStatusMessage(message);
      return { kind: "imported" };
    } finally {
      setIsTransferBusy(false);
    }
  }, [facade, onSettingsImported]);

  return {
    exportPreferences,
    importPreferences,
    isTransferBusy,
    transferStatusMessage,
  };
}
