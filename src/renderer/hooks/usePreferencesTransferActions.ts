import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { UserSettings } from "@application/index.js";
import type { NotificationDescriptor } from "./useNotifications.js";

export type PreferencesTransferActionResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "exported"; savedFileName: string }
  | { kind: "imported" }
  | { kind: "error"; messageKey: string }
>;

type UsePreferencesTransferActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  currentVersion: string;
  onSettingsImported: (settings: UserSettings) => void;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

type UsePreferencesTransferActionsResult = Readonly<{
  exportPreferences: () => Promise<PreferencesTransferActionResult>;
  importPreferences: () => Promise<PreferencesTransferActionResult>;
  isTransferBusy: boolean;
}>;

/**
 * - Purpose: bind Settings General transfer buttons to facade export/import.
 * - Inputs: facade, app version, apply-imported callback, optional notify.
 * - Outputs: export/import actions with busy flag; outcomes via notifications.
 */
export function usePreferencesTransferActions(
  input: UsePreferencesTransferActionsInput,
): UsePreferencesTransferActionsResult {
  const { facade, currentVersion, onSettingsImported, notify } = input;
  const [isTransferBusy, setIsTransferBusy] = useState(false);

  const exportPreferences = useCallback(async (): Promise<PreferencesTransferActionResult> => {
    if (facade === null) {
      notify?.({
        level: "error",
        messageKey: "settings.general.preferences.transfer.unavailable",
        module: "settings",
        functionId: "preferences.export",
        interruptClass: "actionable",
      });
      return { kind: "error", messageKey: "settings.general.preferences.transfer.unavailable" };
    }

    setIsTransferBusy(true);
    try {
      const result = await facade.exportOperatorPreferences({ appVersion: currentVersion });
      if (!result.ok) {
        notify?.({
          level: "error",
          messageKey: "settings.general.preferences.transfer.exportFailed",
          module: "settings",
          functionId: "preferences.export",
          interruptClass: "actionable",
        });
        return { kind: "error", messageKey: "settings.general.preferences.transfer.exportFailed" };
      }
      if (result.value.kind === "cancelled") {
        return { kind: "cancelled" };
      }
      notify?.({
        level: "success",
        messageKey: "settings.general.preferences.transfer.exportSucceeded",
        messageParams: { fileName: result.value.savedFileName },
        module: "settings",
        functionId: "preferences.export",
        interruptClass: "informational",
      });
      return { kind: "exported", savedFileName: result.value.savedFileName };
    } finally {
      setIsTransferBusy(false);
    }
  }, [currentVersion, facade, notify]);

  const importPreferences = useCallback(async (): Promise<PreferencesTransferActionResult> => {
    if (facade === null) {
      notify?.({
        level: "error",
        messageKey: "settings.general.preferences.transfer.unavailable",
        module: "settings",
        functionId: "preferences.import",
        interruptClass: "actionable",
      });
      return { kind: "error", messageKey: "settings.general.preferences.transfer.unavailable" };
    }

    setIsTransferBusy(true);
    try {
      const result = await facade.importOperatorPreferences();
      if (!result.ok) {
        notify?.({
          level: "error",
          messageKey: "settings.general.preferences.transfer.importFailed",
          module: "settings",
          functionId: "preferences.import",
          interruptClass: "actionable",
        });
        return { kind: "error", messageKey: "settings.general.preferences.transfer.importFailed" };
      }
      if (result.value.kind === "cancelled") {
        return { kind: "cancelled" };
      }

      onSettingsImported(result.value.settings);

      notify?.({
        level: "success",
        messageKey: "settings.general.preferences.transfer.importSucceeded",
        module: "settings",
        functionId: "preferences.import",
        interruptClass: "informational",
      });
      return { kind: "imported" };
    } finally {
      setIsTransferBusy(false);
    }
  }, [facade, notify, onSettingsImported]);

  return {
    exportPreferences,
    importPreferences,
    isTransferBusy,
  };
}
