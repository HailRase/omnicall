import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  createExternalServiceRequest,
  deleteExternalServiceRequest,
  duplicateExternalServiceRequest,
  renameExternalServiceRequest,
  replaceExternalServiceRequest,
  toggleExternalServiceRequest,
  type ExternalServicesSettings,
  type UserSettings,
} from "@application/index.js";
import type { ExternalServicesRequestDraft } from "../components/settings/external-services/ExternalServicesRequestEditor.js";
import type { TranslationKey } from "../i18n/messages.js";

type Input = Readonly<{
  facade: AccountBootstrapFacade | null;
  settings: ExternalServicesSettings;
  settingsRevision: number;
  onSaved: (settings: UserSettings, revision: number) => void;
}>;

const uuidGenerator = { generate: (): string => globalThis.crypto.randomUUID() };

export type UseExternalServicesRequestActionsResult = Readonly<{
  busy: boolean;
  create: (collectionId: string) => Promise<ExternalServicesRequestActionResult>;
  rename: (
    collectionId: string,
    requestId: string,
    name: string,
  ) => Promise<ExternalServicesRequestActionResult>;
  toggle: (
    collectionId: string,
    requestId: string,
    enabled: boolean,
  ) => Promise<ExternalServicesRequestActionResult>;
  duplicate: (
    collectionId: string,
    requestId: string,
  ) => Promise<ExternalServicesRequestActionResult>;
  delete: (
    collectionId: string,
    requestId: string,
  ) => Promise<ExternalServicesRequestActionResult>;
  replace: (
    collectionId: string,
    draft: ExternalServicesRequestDraft,
  ) => Promise<ExternalServicesRequestActionResult>;
}>;

export type ExternalServicesRequestActionResult = Readonly<
  | {
      kind: "success";
      settingsRevision: number;
      requestId?: string;
      request?: ExternalServicesRequestDraft;
    }
  | { kind: "error"; messageKey: TranslationKey }
>;

type SettingsRequest = ExternalServicesSettings["collections"][number]["requests"][number];

function toRequestDraft(request: SettingsRequest): ExternalServicesRequestDraft {
  return {
    id: request.id,
    name: request.name,
    enabled: request.enabled,
    method: request.method,
    url: request.url,
    query: request.query.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      enabled: row.enabled,
    })),
    headers: request.headers.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      enabled: row.enabled,
    })),
    body: { mode: request.body.mode, value: request.body.value },
    triggers: [...request.triggers],
  };
}

/**
 * - Purpose: bind request mutations to Application functions and facade persistence.
 * - Inputs: settings snapshot, revision, facade and snapshot callback.
 * - Outputs: async request mutation intents with a shared busy state.
 */
export function useExternalServicesRequestActions(
  input: Input,
): UseExternalServicesRequestActionsResult {
  const { facade, settings, settingsRevision, onSaved } = input;
  const [busy, setBusy] = useState(false);
  const settingsRef = useRef(settings);
  const revisionRef = useRef(settingsRevision);
  const busyRef = useRef(busy);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    revisionRef.current = settingsRevision;
  }, [settingsRevision]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const persist = useCallback(
    async (next: ExternalServicesSettings): Promise<ExternalServicesRequestActionResult> => {
      if (facade === null) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.disabled.unavailable",
        };
      }
      setBusy(true);
      busyRef.current = true;
      try {
        const result = await facade.saveExternalServicesSettings(
          next,
          revisionRef.current,
        );
        if (!result.ok) {
          return {
            kind: "error",
            messageKey: "settings.integrations.externalServices.saveError",
          };
        }
        revisionRef.current = result.value.settingsRevision;
        settingsRef.current = result.value.settings.externalServices;
        onSaved(result.value.settings, result.value.settingsRevision);
        return { kind: "success", settingsRevision: result.value.settingsRevision };
      } finally {
        setBusy(false);
        busyRef.current = false;
      }
    },
    [facade, onSaved],
  );

  const mutate = useCallback(
    async (
      fn: (
        current: ExternalServicesSettings,
      ) => { ok: true; settings: ExternalServicesSettings } | { ok: false },
    ): Promise<ExternalServicesRequestActionResult> => {
      if (busyRef.current) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.disabled.busy",
        };
      }
      const result = fn(settingsRef.current);
      return result.ok
        ? persist(result.settings)
        : {
            kind: "error",
            messageKey: "settings.integrations.externalServices.saveError",
          };
    },
    [persist],
  );

  return {
    busy,
    create: async (collectionId) => {
      if (busyRef.current) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.disabled.busy",
        };
      }
      const created = createExternalServiceRequest(
        settingsRef.current,
        collectionId,
        uuidGenerator,
      );
      if (!created.ok) {
        return {
          kind: "error",
          messageKey: "settings.integrations.externalServices.saveError",
        };
      }
      const createdRequest = created.settings.collections
        .find((entry) => entry.id === collectionId)
        ?.requests.at(-1);
      const result = await persist(created.settings);
      if (result.kind !== "success" || createdRequest === undefined) {
        return result;
      }
      return {
        kind: "success",
        settingsRevision: result.settingsRevision,
        requestId: createdRequest.id,
        request: toRequestDraft(createdRequest),
      };
    },
    rename: (collectionId, requestId, name) =>
      mutate((current) =>
        renameExternalServiceRequest(current, collectionId, requestId, name),
      ),
    toggle: (collectionId, requestId, enabled) =>
      mutate((current) =>
        toggleExternalServiceRequest(current, collectionId, requestId, enabled),
      ),
    duplicate: (collectionId, requestId) =>
      mutate((current) =>
        duplicateExternalServiceRequest(current, collectionId, requestId, uuidGenerator),
      ),
    delete: (collectionId, requestId) =>
      mutate((current) =>
        deleteExternalServiceRequest(current, collectionId, requestId),
      ),
    replace: (collectionId, draft) =>
      mutate((current) =>
        replaceExternalServiceRequest(current, collectionId, draft.id, {
          ...draft,
          body:
            draft.body.mode === "none"
              ? { mode: "none", value: "" }
              : draft.body,
        }),
      ),
  };
}
