/**
 * - Purpose: bind External Services collection intents to AccountBootstrapFacade.
 * - Inputs: facade, shell settings snapshot, and settings-refresh callbacks.
 * - Outputs: create/rename/toggle/delete/duplicate/import/export/variable actions.
 */

import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  createExternalServiceCollection,
  deleteExternalServiceCollection,
  duplicateExternalServiceCollection,
  renameExternalServiceCollection,
  replaceExternalServiceCollectionVariables,
  toggleExternalServiceCollection,
  type ExternalServiceCollectionId,
  type ExternalServicesCollectionMutationError,
  type ExternalServicesCollectionVariableVm,
  type ExternalServicesSettings,
  type UserSettings,
} from "@application/index.js";
import type { TranslationKey } from "../i18n/messages.js";

export type ExternalServicesActionResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "success" }
  | { kind: "error"; messageKey: TranslationKey }
>;

type UuidGeneratorLike = Readonly<{ generate: () => string }>;

type UseExternalServicesActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  settings: ExternalServicesSettings;
  settingsRevision: number;
  onSettingsSaved: (settings: UserSettings, settingsRevision: number) => void;
  onUserSettingsImported: (settings: UserSettings, settingsRevision: number) => void;
  onStatusMessage: (
    key: TranslationKey | null,
    params?: Readonly<Record<string, string>>,
  ) => void;
  uuidGenerator?: UuidGeneratorLike;
}>;

export type UseExternalServicesActionsResult = Readonly<{
  busy: boolean;
  createCollection: (name: string) => Promise<ExternalServicesActionResult>;
  renameCollection: (
    collectionId: string,
    name: string,
  ) => Promise<ExternalServicesActionResult>;
  toggleCollection: (
    collectionId: string,
    enabled: boolean,
  ) => Promise<ExternalServicesActionResult>;
  deleteCollection: (collectionId: string) => Promise<ExternalServicesActionResult>;
  duplicateCollection: (collectionId: string) => Promise<ExternalServicesActionResult>;
  saveCollectionVariables: (
    collectionId: string,
    variables: ReadonlyArray<ExternalServicesCollectionVariableVm>,
  ) => Promise<ExternalServicesActionResult>;
  importCollection: () => Promise<ExternalServicesActionResult>;
  exportCollection: (collectionId: string) => Promise<ExternalServicesActionResult>;
}>;

const defaultUuidGenerator: UuidGeneratorLike = {
  generate: (): string => globalThis.crypto.randomUUID(),
};

/**
 * - Purpose: execute External Services collection mutations through the facade.
 * - Inputs: current settings revision and shell refresh callbacks.
 * - Outputs: busy flag and typed action handlers with translation keys.
 */
export function useExternalServicesActions(
  input: UseExternalServicesActionsInput,
): UseExternalServicesActionsResult {
  const {
    facade,
    settings,
    settingsRevision,
    onSettingsSaved,
    onUserSettingsImported,
    onStatusMessage,
    uuidGenerator = defaultUuidGenerator,
  } = input;
  const [busy, setBusy] = useState(false);

  const persistSettings = useCallback(
    async (
      nextSettings: ExternalServicesSettings,
    ): Promise<ExternalServicesActionResult> => {
      if (facade === null) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.disabled.unavailable",
        };
      }
      const result = await facade.saveExternalServicesSettings(
        nextSettings,
        settingsRevision,
      );
      if (!result.ok) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.saveError",
        };
      }
      onSettingsSaved(result.value.settings, result.value.settingsRevision);
      return { kind: "success" };
    },
    [facade, onSettingsSaved, settingsRevision],
  );

  const runMutation = useCallback(
    async (
      mutate: () =>
        | Readonly<{ ok: true; settings: ExternalServicesSettings }>
        | Readonly<{ ok: false; error: ExternalServicesCollectionMutationError }>,
    ): Promise<ExternalServicesActionResult> => {
      if (busy) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.disabled.busy",
        };
      }
      const mutated = mutate();
      if (!mutated.ok) {
        return {
          kind: "error",
          messageKey: mapMutationError(mutated.error),
        };
      }
      setBusy(true);
      onStatusMessage(null);
      try {
        const result = await persistSettings(mutated.settings);
        if (result.kind === "error") {
          onStatusMessage(result.messageKey);
        }
        return result;
      } finally {
        setBusy(false);
      }
    },
    [busy, onStatusMessage, persistSettings],
  );

  const createCollection = useCallback(
    async (name: string): Promise<ExternalServicesActionResult> =>
      runMutation(() => createExternalServiceCollection(settings, name, uuidGenerator)),
    [runMutation, settings, uuidGenerator],
  );

  const renameCollection = useCallback(
    async (collectionId: string, name: string): Promise<ExternalServicesActionResult> =>
      runMutation(() => renameExternalServiceCollection(settings, collectionId, name)),
    [runMutation, settings],
  );

  const toggleCollection = useCallback(
    async (
      collectionId: string,
      enabled: boolean,
    ): Promise<ExternalServicesActionResult> =>
      runMutation(() =>
        toggleExternalServiceCollection(settings, collectionId, enabled),
      ),
    [runMutation, settings],
  );

  const deleteCollection = useCallback(
    async (collectionId: string): Promise<ExternalServicesActionResult> =>
      runMutation(() => deleteExternalServiceCollection(settings, collectionId)),
    [runMutation, settings],
  );

  const duplicateCollection = useCallback(
    async (collectionId: string): Promise<ExternalServicesActionResult> =>
      runMutation(() =>
        duplicateExternalServiceCollection(settings, collectionId, uuidGenerator),
      ),
    [runMutation, settings, uuidGenerator],
  );

  const saveCollectionVariables = useCallback(
    async (
      collectionId: string,
      variables: ReadonlyArray<ExternalServicesCollectionVariableVm>,
    ): Promise<ExternalServicesActionResult> =>
      runMutation(() =>
        replaceExternalServiceCollectionVariables(settings, collectionId, variables),
      ),
    [runMutation, settings],
  );

  const importCollection = useCallback(async (): Promise<ExternalServicesActionResult> => {
    if (facade === null) {
      return {
        kind: "error",
        messageKey: "settings.integrations.externalServices.disabled.unavailable",
      };
    }
    setBusy(true);
    onStatusMessage(null);
    try {
      const result = await facade.importExternalServiceCollection();
      if (!result.ok) {
        onStatusMessage("settings.integrations.externalServices.importExport.importFailed");
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.importExport.importFailed",
        };
      }
      if (result.value.kind === "cancelled") {
        return { kind: "cancelled" };
      }
      onUserSettingsImported(result.value.settings, result.value.settingsRevision);
      onStatusMessage(
        "settings.integrations.externalServices.importExport.importSucceeded",
        { name: result.value.collection.name },
      );
      return { kind: "success" };
    } finally {
      setBusy(false);
    }
  }, [facade, onStatusMessage, onUserSettingsImported]);

  const exportCollection = useCallback(
    async (collectionId: string): Promise<ExternalServicesActionResult> => {
      if (facade === null) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.disabled.unavailable",
        };
      }
      setBusy(true);
      onStatusMessage(null);
      try {
        const result = await facade.exportExternalServiceCollection(
          collectionId as ExternalServiceCollectionId,
        );
        if (!result.ok) {
          onStatusMessage(
            "settings.integrations.externalServices.importExport.exportFailed",
          );
          return {
            kind: "error",
            messageKey: "settings.integrations.externalServices.importExport.exportFailed",
          };
        }
        if (result.value.kind === "cancelled") {
          return { kind: "cancelled" };
        }
        onStatusMessage(
          "settings.integrations.externalServices.importExport.exportSucceeded",
          { fileName: result.value.savedFileName },
        );
        return { kind: "success" };
      } finally {
        setBusy(false);
      }
    },
    [facade, onStatusMessage],
  );

  return {
    busy,
    createCollection,
    renameCollection,
    toggleCollection,
    deleteCollection,
    duplicateCollection,
    saveCollectionVariables,
    importCollection,
    exportCollection,
  };
}

function mapMutationError(
  error: ExternalServicesCollectionMutationError,
): TranslationKey {
  if (error === "name_required") {
    return "settings.integrations.externalServices.validation.nameRequired";
  }
  if (error === "name_too_long") {
    return "settings.integrations.externalServices.validation.nameTooLong";
  }
  if (error === "duplicate_variable_key") {
    return "settings.integrations.externalServices.validation.duplicateVariableKey";
  }
  if (error === "empty_variable_key") {
    return "settings.integrations.externalServices.validation.emptyVariableKey";
  }
  return "settings.integrations.externalServices.saveError";
}
