/**
 * - Purpose: versioned single-collection portable JSON for External Services.
 * - Inputs: validated collections and unknown import payloads.
 * - Outputs: document builders, serializers, fail-closed parsers, ID regeneration.
 */

import {
  isExternalServiceUuid,
  type ExternalServiceCollectionId,
  type ExternalServiceKeyValueId,
  type ExternalServiceRequestId,
} from "./ExternalServiceIds.js";
import {
  MAX_EXTERNAL_SERVICE_NAME_LENGTH,
  type ExternalServiceCollection,
} from "./ExternalServicesSettings.js";
import { parseExternalServicesSettings } from "./parseExternalServicesSettings.js";

export const EXTERNAL_SERVICE_COLLECTION_FORMAT_ID =
  "omnicall.external-service-collection" as const;

export const EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION = 1 as const;

/** Safety cap for collection transfer files (UTF-8 bytes). */
export const EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES = 2 * 1024 * 1024;

export type ExternalServiceCollectionFormatId =
  typeof EXTERNAL_SERVICE_COLLECTION_FORMAT_ID;

export type ExternalServiceCollectionFormatVersion =
  typeof EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION;

export type ExternalServiceCollectionDocumentV1 = Readonly<{
  format: ExternalServiceCollectionFormatId;
  formatVersion: ExternalServiceCollectionFormatVersion;
  exportedAt: string;
  collection: ExternalServiceCollection;
}>;

export type ExternalServiceCollectionParseErrorCode =
  | "payload_not_object"
  | "unsupported_format"
  | "unsupported_format_version"
  | "invalid_exported_at"
  | "collection_validation_failed"
  | "file_too_large"
  | "json_invalid";

export type ExternalServiceCollectionParseResult =
  | Readonly<{ ok: true; value: ExternalServiceCollectionDocumentV1 }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: ExternalServiceCollectionParseErrorCode;
        message: string;
      }>;
    }>;

export type ExternalServiceUuidSource = Readonly<{
  generate(): string;
}>;

/**
 * - Purpose: build a v1 single-collection export document.
 * - Inputs: validated collection and optional export timestamp.
 * - Outputs: typed document ready for JSON serialization (IDs preserved).
 */
export function buildExternalServiceCollectionDocument(input: Readonly<{
  collection: ExternalServiceCollection;
  exportedAt?: string;
}>): ExternalServiceCollectionDocumentV1 {
  return {
    format: EXTERNAL_SERVICE_COLLECTION_FORMAT_ID,
    formatVersion: EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    collection: input.collection,
  };
}

/**
 * - Purpose: serialize a collection document to portable UTF-8 JSON text.
 * - Inputs: typed v1 document.
 * - Outputs: pretty JSON with trailing newline.
 */
export function serializeExternalServiceCollectionDocument(
  document: ExternalServiceCollectionDocumentV1,
): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

/**
 * - Purpose: parse unknown JSON text into a collection export document.
 * - Inputs: UTF-8 file contents bounded by the transfer size cap.
 * - Outputs: validated document or fail-closed parse error.
 */
export function parseExternalServiceCollectionJson(
  json: string,
): ExternalServiceCollectionParseResult {
  if (utf8ByteLength(json) > EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES) {
    return fail("file_too_large", "external_service_collection_file_too_large");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return fail("json_invalid", "external_service_collection_json_invalid");
  }
  return parseExternalServiceCollectionDocument(parsed);
}

/**
 * - Purpose: validate an unknown payload as a collection export document.
 * - Inputs: decoded JSON value.
 * - Outputs: typed document or fail-closed parse error.
 */
export function parseExternalServiceCollectionDocument(
  raw: unknown,
): ExternalServiceCollectionParseResult {
  if (typeof raw !== "object" || raw === null) {
    return fail("payload_not_object", "external_service_collection_payload_not_object");
  }

  const record = raw as Record<string, unknown>;
  if (record["format"] !== EXTERNAL_SERVICE_COLLECTION_FORMAT_ID) {
    return fail("unsupported_format", "external_service_collection_unsupported_format");
  }

  if (record["formatVersion"] !== EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION) {
    return fail(
      "unsupported_format_version",
      `external_service_collection_unsupported_format_version:${String(record["formatVersion"])}`,
    );
  }

  const exportedAt = record["exportedAt"];
  if (typeof exportedAt !== "string" || exportedAt.trim().length === 0) {
    return fail("invalid_exported_at", "external_service_collection_exported_at_invalid");
  }

  const wrapped = parseExternalServicesSettings({
    collections: [record["collection"]],
  });
  if (!wrapped.ok || wrapped.value.collections.length !== 1) {
    return fail(
      "collection_validation_failed",
      "external_service_collection_validation_failed",
    );
  }

  const collection = wrapped.value.collections[0];
  if (collection === undefined) {
    return fail(
      "collection_validation_failed",
      "external_service_collection_validation_failed",
    );
  }

  return {
    ok: true,
    value: {
      format: EXTERNAL_SERVICE_COLLECTION_FORMAT_ID,
      formatVersion: EXTERNAL_SERVICE_COLLECTION_FORMAT_VERSION,
      exportedAt: exportedAt.trim(),
      collection,
    },
  };
}

/**
 * - Purpose: regenerate all collection/request/row UUIDs for collision-safe import.
 * - Inputs: validated collection and UUID source.
 * - Outputs: immutable collection with new IDs; name/content preserved.
 */
export function regenerateExternalServiceCollectionIds(
  collection: ExternalServiceCollection,
  uuidSource: ExternalServiceUuidSource,
): ExternalServiceCollection {
  return Object.freeze({
    id: requireUuid(uuidSource.generate()) as ExternalServiceCollectionId,
    name: collection.name,
    enabled: collection.enabled,
    variables: Object.freeze(
      collection.variables.map((variable) =>
        Object.freeze({ key: variable.key, value: variable.value }),
      ),
    ),
    requests: Object.freeze(
      collection.requests.map((request) =>
        Object.freeze({
          id: requireUuid(uuidSource.generate()) as ExternalServiceRequestId,
          name: request.name,
          enabled: request.enabled,
          method: request.method,
          url: request.url,
          query: Object.freeze(
            request.query.map((row) =>
              Object.freeze({
                id: requireUuid(uuidSource.generate()) as ExternalServiceKeyValueId,
                key: row.key,
                value: row.value,
                enabled: row.enabled,
              }),
            ),
          ),
          headers: Object.freeze(
            request.headers.map((row) =>
              Object.freeze({
                id: requireUuid(uuidSource.generate()) as ExternalServiceKeyValueId,
                key: row.key,
                value: row.value,
                enabled: row.enabled,
              }),
            ),
          ),
          body: Object.freeze({
            mode: request.body.mode,
            value: request.body.value,
          }),
          triggers: Object.freeze([...request.triggers]),
        }),
      ),
    ),
  });
}

/**
 * - Purpose: pick a deterministic unique display name for an imported collection.
 * - Inputs: desired name and existing active-profile collection names.
 * - Outputs: original name, `(copy)`, or `(copy N)` within max length.
 */
export function resolveImportedExternalServiceCollectionName(
  desiredName: string,
  existingNames: ReadonlySet<string>,
): string {
  if (!existingNames.has(desiredName)) {
    return desiredName;
  }

  const withCopy = fitCollectionName(desiredName, " (copy)");
  if (!existingNames.has(withCopy)) {
    return withCopy;
  }

  for (let index = 2; index < Number.MAX_SAFE_INTEGER; index += 1) {
    const candidate = fitCollectionName(desiredName, ` (copy ${index})`);
    if (!existingNames.has(candidate)) {
      return candidate;
    }
  }

  return fitCollectionName(desiredName, " (copy)");
}

/**
 * - Purpose: build a filesystem-safe suggested export filename.
 * - Inputs: collection display name.
 * - Outputs: `omnicall-external-service-{safe-name}.json`.
 */
export function buildExternalServiceCollectionSuggestedFileName(
  collectionName: string,
): string {
  const safe = collectionName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^[-.]+|[-.]+$/gu, "")
    .slice(0, 64);
  const slug = safe.length > 0 ? safe : "collection";
  return `omnicall-external-service-${slug}.json`;
}

function fitCollectionName(base: string, suffix: string): string {
  const maxBase = MAX_EXTERNAL_SERVICE_NAME_LENGTH - suffix.length;
  if (maxBase <= 0) {
    return suffix.trim().slice(0, MAX_EXTERNAL_SERVICE_NAME_LENGTH);
  }
  if (base.length <= maxBase) {
    return `${base}${suffix}`;
  }
  return `${base.slice(0, maxBase)}${suffix}`;
}

function requireUuid(value: string): string {
  if (!isExternalServiceUuid(value)) {
    throw new Error("external_service_collection_uuid_invalid");
  }
  return value;
}

function utf8ByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).byteLength;
  }
  return value.length;
}

function fail(
  code: ExternalServiceCollectionParseErrorCode,
  message: string,
): ExternalServiceCollectionParseResult {
  return { ok: false, error: { code, message } };
}
