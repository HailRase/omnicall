/**
 * - Purpose: apply immutable request-level External Services mutations.
 * - Inputs: validated settings, request identifiers, replacements, and UUID source.
 * - Outputs: validated next settings or structured mutation failure.
 */

import {
  MAX_EXTERNAL_SERVICE_NAME_LENGTH,
  parseExternalServicesSettings,
  type ExternalServiceCollection,
  type ExternalServiceKeyValue,
  type ExternalServiceKeyValueId,
  type ExternalServiceRequest,
  type ExternalServiceRequestId,
  type ExternalServicesSettings,
} from "@domain/index.js";
import type { UuidGenerator } from "@ports/index.js";

export type ExternalServicesRequestMutationError =
  | "collection_not_found"
  | "request_not_found"
  | "name_required"
  | "name_too_long"
  | "invalid_request";

export type ExternalServicesRequestMutationResult =
  | Readonly<{ ok: true; settings: ExternalServicesSettings }>
  | Readonly<{ ok: false; error: ExternalServicesRequestMutationError }>;

export function createExternalServiceRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  uuidGenerator: UuidGenerator,
): ExternalServicesRequestMutationResult {
  const collectionIndex = findCollectionIndex(settings, collectionId);
  if (collectionIndex < 0) {
    return { ok: false, error: "collection_not_found" };
  }

  const request: ExternalServiceRequest = {
    id: uuidGenerator.generate() as ExternalServiceRequestId,
    name: "New request",
    enabled: true,
    method: "GET",
    url: "https://example.com",
    query: [],
    headers: [],
    body: { mode: "none", value: "" },
    triggers: [],
  };
  return validateSettings(replaceRequest(settings, collectionIndex, [...settings.collections[collectionIndex]!.requests, request]));
}

export function renameExternalServiceRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  requestId: string,
  name: string,
): ExternalServicesRequestMutationResult {
  const normalized = normalizeName(name);
  if (!normalized.ok) {
    return normalized;
  }

  return updateRequest(settings, collectionId, requestId, (request) => ({
    ...request,
    name: normalized.name,
  }));
}

export function toggleExternalServiceRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  requestId: string,
  enabled: boolean,
): ExternalServicesRequestMutationResult {
  return updateRequest(settings, collectionId, requestId, (request) => ({
    ...request,
    enabled,
  }));
}

export function deleteExternalServiceRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  requestId: string,
): ExternalServicesRequestMutationResult {
  const located = findRequest(settings, collectionId, requestId);
  if (!located.ok) {
    return located;
  }

  const requests = located.collection.requests.filter((_, index) => index !== located.requestIndex);
  return validateSettings(replaceRequest(settings, located.collectionIndex, requests));
}

export function duplicateExternalServiceRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  requestId: string,
  uuidGenerator: UuidGenerator,
): ExternalServicesRequestMutationResult {
  const located = findRequest(settings, collectionId, requestId);
  if (!located.ok) {
    return located;
  }

  const source = located.collection.requests[located.requestIndex]!;
  const duplicated: ExternalServiceRequest = {
    ...source,
    id: uuidGenerator.generate() as ExternalServiceRequestId,
    query: regenerateKeyValueIds(source.query, uuidGenerator),
    headers: regenerateKeyValueIds(source.headers, uuidGenerator),
    body: { ...source.body },
    triggers: [...source.triggers],
  };
  return validateSettings(
    replaceRequest(settings, located.collectionIndex, [
      ...located.collection.requests,
      duplicated,
    ]),
  );
}

export function replaceExternalServiceRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  requestId: string,
  request: unknown,
): ExternalServicesRequestMutationResult {
  const located = findRequest(settings, collectionId, requestId);
  if (!located.ok) {
    return located;
  }

  const normalized = normalizeRequestReplacement(request);
  return validateSettings(
    replaceRequest(
      settings,
      located.collectionIndex,
      located.collection.requests.map((entry, index) =>
        index === located.requestIndex ? normalized : entry,
      ),
    ),
  );
}

function normalizeRequestReplacement(request: unknown): unknown {
  if (!isPlainObject(request)) {
    return request;
  }

  const bodyValue = request["body"];
  const body = isPlainObject(bodyValue) ? bodyValue : { mode: "none", value: "" };
  const mode = body["mode"];
  const normalizedBody =
    mode === "none"
      ? { mode: "none", value: "" }
      : {
          mode,
          value: typeof body["value"] === "string" ? body["value"] : "",
        };

  return {
    ...request,
    body: normalizedBody,
    query: normalizeKeyValueRows(request["query"]),
    headers: normalizeKeyValueRows(request["headers"]),
  };
}

function normalizeKeyValueRows(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((row: unknown): unknown => {
    if (!isPlainObject(row)) {
      return row;
    }
    const key = typeof row["key"] === "string" ? row["key"].trim() : "";
    if (key.length === 0) {
      return { ...row, key: "", enabled: false };
    }
    return { ...row, key };
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function updateRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  requestId: string,
  update: (request: ExternalServiceRequest) => ExternalServiceRequest,
): ExternalServicesRequestMutationResult {
  const located = findRequest(settings, collectionId, requestId);
  if (!located.ok) {
    return located;
  }

  return validateSettings(
    replaceRequest(
      settings,
      located.collectionIndex,
      located.collection.requests.map((request, index) =>
        index === located.requestIndex ? update(request) : request,
      ),
    ),
  );
}

function findRequest(
  settings: ExternalServicesSettings,
  collectionId: string,
  requestId: string,
):
  | Readonly<{
      ok: true;
      collection: ExternalServiceCollection;
      collectionIndex: number;
      requestIndex: number;
    }>
  | Readonly<{ ok: false; error: "collection_not_found" | "request_not_found" }> {
  const collectionIndex = findCollectionIndex(settings, collectionId);
  if (collectionIndex < 0) {
    return { ok: false, error: "collection_not_found" };
  }

  const collection = settings.collections[collectionIndex]!;
  const requestIndex = collection.requests.findIndex((request) => request.id === requestId);
  return requestIndex < 0
    ? { ok: false, error: "request_not_found" }
    : { ok: true, collection, collectionIndex, requestIndex };
}

function findCollectionIndex(settings: ExternalServicesSettings, collectionId: string): number {
  return settings.collections.findIndex((collection) => collection.id === collectionId);
}

function replaceRequest(
  settings: ExternalServicesSettings,
  collectionIndex: number,
  requests: ReadonlyArray<unknown>,
): unknown {
  return {
    collections: settings.collections.map((collection, index) =>
      index === collectionIndex ? { ...collection, requests } : collection,
    ),
  };
}

function regenerateKeyValueIds(
  rows: ReadonlyArray<ExternalServiceKeyValue>,
  uuidGenerator: UuidGenerator,
): ReadonlyArray<ExternalServiceKeyValue> {
  return rows.map((row) => ({
    ...row,
    id: uuidGenerator.generate() as ExternalServiceKeyValueId,
  }));
}

function validateSettings(value: unknown): ExternalServicesRequestMutationResult {
  const parsed = parseExternalServicesSettings(value);
  return parsed.ok
    ? { ok: true, settings: parsed.value }
    : { ok: false, error: "invalid_request" };
}

function normalizeName(
  name: string,
):
  | Readonly<{ ok: true; name: string }>
  | Readonly<{ ok: false; error: "name_required" | "name_too_long" }> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "name_required" };
  }
  return trimmed.length > MAX_EXTERNAL_SERVICE_NAME_LENGTH
    ? { ok: false, error: "name_too_long" }
    : { ok: true, name: trimmed };
}
