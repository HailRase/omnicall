/**
 * - Purpose: apply collection-level External Services mutations as immutable settings.
 * - Inputs: current settings, collection ids/names/variables, and UUID source.
 * - Outputs: next ExternalServicesSettings or structured validation failure.
 */

import {
  MAX_EXTERNAL_SERVICE_NAME_LENGTH,
  regenerateExternalServiceCollectionIds,
  resolveImportedExternalServiceCollectionName,
  type ExternalServiceCollection,
  type ExternalServiceCollectionId,
  type ExternalServicesSettings,
  type ExternalServiceVariable,
} from "@domain/index.js";
import type { UuidGenerator } from "@ports/index.js";

export type ExternalServicesCollectionMutationError =
  | "collection_not_found"
  | "name_required"
  | "name_too_long";

export type ExternalServicesCollectionMutationResult =
  | Readonly<{ ok: true; settings: ExternalServicesSettings }>
  | Readonly<{ ok: false; error: ExternalServicesCollectionMutationError }>;

export function createExternalServiceCollection(
  settings: ExternalServicesSettings,
  name: string,
  uuidGenerator: UuidGenerator,
): ExternalServicesCollectionMutationResult {
  const normalized = normalizeCollectionName(name);
  if (!normalized.ok) {
    return normalized;
  }

  const existingNames = new Set(settings.collections.map((entry) => entry.name));
  const collection: ExternalServiceCollection = Object.freeze({
    id: uuidGenerator.generate() as ExternalServiceCollectionId,
    name: resolveImportedExternalServiceCollectionName(normalized.name, existingNames),
    enabled: true,
    variables: Object.freeze([]),
    requests: Object.freeze([]),
  });

  return {
    ok: true,
    settings: {
      collections: [...settings.collections, collection],
    },
  };
}

export function renameExternalServiceCollection(
  settings: ExternalServicesSettings,
  collectionId: string,
  name: string,
): ExternalServicesCollectionMutationResult {
  const normalized = normalizeCollectionName(name);
  if (!normalized.ok) {
    return normalized;
  }

  const index = findCollectionIndex(settings, collectionId);
  if (index < 0) {
    return { ok: false, error: "collection_not_found" };
  }

  const existingNames = new Set(
    settings.collections
      .filter((_, entryIndex) => entryIndex !== index)
      .map((entry) => entry.name),
  );
  const nextName = existingNames.has(normalized.name)
    ? resolveImportedExternalServiceCollectionName(normalized.name, existingNames)
    : normalized.name;

  return {
    ok: true,
    settings: replaceCollection(settings, index, {
      ...settings.collections[index]!,
      name: nextName,
    }),
  };
}

export function toggleExternalServiceCollection(
  settings: ExternalServicesSettings,
  collectionId: string,
  enabled: boolean,
): ExternalServicesCollectionMutationResult {
  const index = findCollectionIndex(settings, collectionId);
  if (index < 0) {
    return { ok: false, error: "collection_not_found" };
  }
  return {
    ok: true,
    settings: replaceCollection(settings, index, {
      ...settings.collections[index]!,
      enabled,
    }),
  };
}

export function deleteExternalServiceCollection(
  settings: ExternalServicesSettings,
  collectionId: string,
): ExternalServicesCollectionMutationResult {
  const index = findCollectionIndex(settings, collectionId);
  if (index < 0) {
    return { ok: false, error: "collection_not_found" };
  }
  return {
    ok: true,
    settings: {
      collections: settings.collections.filter((_, entryIndex) => entryIndex !== index),
    },
  };
}

export function duplicateExternalServiceCollection(
  settings: ExternalServicesSettings,
  collectionId: string,
  uuidGenerator: UuidGenerator,
): ExternalServicesCollectionMutationResult {
  const index = findCollectionIndex(settings, collectionId);
  if (index < 0) {
    return { ok: false, error: "collection_not_found" };
  }

  const source = settings.collections[index]!;
  const existingNames = new Set(settings.collections.map((entry) => entry.name));
  const duplicated: ExternalServiceCollection = Object.freeze({
    ...regenerateExternalServiceCollectionIds(source, uuidGenerator),
    name: resolveImportedExternalServiceCollectionName(source.name, existingNames),
  });

  return {
    ok: true,
    settings: {
      collections: [...settings.collections, duplicated],
    },
  };
}

export function replaceExternalServiceCollectionVariables(
  settings: ExternalServicesSettings,
  collectionId: string,
  variables: ReadonlyArray<Readonly<{ key: string; value: string }>>,
): ExternalServicesCollectionMutationResult {
  const index = findCollectionIndex(settings, collectionId);
  if (index < 0) {
    return { ok: false, error: "collection_not_found" };
  }

  const nextVariables: ReadonlyArray<ExternalServiceVariable> = Object.freeze(
    variables
      .map((variable) => ({
        key: variable.key.trim(),
        value: variable.value,
      }))
      .filter((variable) => variable.key.length > 0),
  );

  return {
    ok: true,
    settings: replaceCollection(settings, index, {
      ...settings.collections[index]!,
      variables: nextVariables,
    }),
  };
}

function normalizeCollectionName(
  name: string,
):
  | Readonly<{ ok: true; name: string }>
  | Readonly<{ ok: false; error: ExternalServicesCollectionMutationError }> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "name_required" };
  }
  if (trimmed.length > MAX_EXTERNAL_SERVICE_NAME_LENGTH) {
    return { ok: false, error: "name_too_long" };
  }
  return { ok: true, name: trimmed };
}

function findCollectionIndex(
  settings: ExternalServicesSettings,
  collectionId: string,
): number {
  return settings.collections.findIndex((entry) => entry.id === collectionId);
}

function replaceCollection(
  settings: ExternalServicesSettings,
  index: number,
  next: ExternalServiceCollection,
): ExternalServicesSettings {
  return {
    collections: settings.collections.map((entry, entryIndex) =>
      entryIndex === index ? Object.freeze(next) : entry,
    ),
  };
}
