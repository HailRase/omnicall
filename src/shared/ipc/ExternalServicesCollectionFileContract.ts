/**
 * - Purpose: validate External Services collection file dialog IPC payloads.
 * - Inputs: unknown open/save dialog request and response values.
 * - Outputs: typed dialog contracts or null when invalid.
 */

/** Safety cap for collection transfer files (UTF-8 bytes). Keep in sync with domain. */
export const EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES = 2 * 1024 * 1024;

export type ExternalServicesCollectionOpenImportDialogResponse = Readonly<
  | { ok: true; cancelled: true }
  | { ok: true; cancelled: false; contents: string }
  | { ok: false; reason: string }
>;

export type ExternalServicesCollectionSaveExportDialogPayload = Readonly<{
  contents: string;
  suggestedFileName: string;
}>;

export type ExternalServicesCollectionSaveExportDialogResponse = Readonly<
  | { ok: true; cancelled: true }
  | { ok: true; cancelled: false; savedFileName: string }
  | { ok: false; reason: string }
>;

const SAFE_COLLECTION_FILE_NAME_PATTERN = /^[a-zA-Z0-9._-]+\.json$/u;

/**
 * - Purpose: validate collection save-export IPC payloads at preload/renderer boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed export payload or null when invalid.
 */
export function parseExternalServicesCollectionSaveExportDialogPayload(
  value: unknown,
): ExternalServicesCollectionSaveExportDialogPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const contents = candidate["contents"];
  const suggestedFileName = candidate["suggestedFileName"];

  if (typeof contents !== "string" || contents.length === 0) {
    return null;
  }

  if (utf8ByteLength(contents) > EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES) {
    return null;
  }

  if (typeof suggestedFileName !== "string" || suggestedFileName.trim().length === 0) {
    return null;
  }

  const trimmedFileName = suggestedFileName.trim();
  if (!SAFE_COLLECTION_FILE_NAME_PATTERN.test(trimmedFileName)) {
    return null;
  }

  return {
    contents,
    suggestedFileName: trimmedFileName,
  };
}

/**
 * - Purpose: validate collection open-import IPC responses at preload boundary.
 * - Inputs: unknown IPC response.
 * - Outputs: typed import dialog response or null when invalid.
 */
export function parseExternalServicesCollectionOpenImportDialogResponse(
  value: unknown,
): ExternalServicesCollectionOpenImportDialogResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate["ok"] !== true) {
    if (candidate["ok"] === false && typeof candidate["reason"] === "string") {
      return { ok: false, reason: candidate["reason"] };
    }
    return null;
  }

  if (candidate["cancelled"] === true) {
    return { ok: true, cancelled: true };
  }

  if (candidate["cancelled"] === false && typeof candidate["contents"] === "string") {
    if (utf8ByteLength(candidate["contents"]) > EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES) {
      return { ok: false, reason: "file_too_large" };
    }
    return { ok: true, cancelled: false, contents: candidate["contents"] };
  }

  return null;
}

/**
 * - Purpose: validate collection save-export IPC responses at preload boundary.
 * - Inputs: unknown IPC response.
 * - Outputs: typed save dialog response or null when invalid.
 */
export function parseExternalServicesCollectionSaveExportDialogResponse(
  value: unknown,
): ExternalServicesCollectionSaveExportDialogResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate["ok"] !== true) {
    if (candidate["ok"] === false && typeof candidate["reason"] === "string") {
      return { ok: false, reason: candidate["reason"] };
    }
    return null;
  }

  if (candidate["cancelled"] === true) {
    return { ok: true, cancelled: true };
  }

  if (candidate["cancelled"] === false) {
    return {
      ok: true,
      cancelled: false,
      savedFileName: sanitizeExternalServicesCollectionSavedFileName(
        candidate["savedFileName"],
      ),
    };
  }

  return null;
}

/**
 * - Purpose: normalize user-chosen save names into IPC-safe JSON filenames.
 * - Inputs: unknown basename from the native save dialog.
 * - Outputs: ASCII-safe `*.json` filename always accepted by the contract.
 */
export function sanitizeExternalServicesCollectionSavedFileName(
  value: unknown,
): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (SAFE_COLLECTION_FILE_NAME_PATTERN.test(trimmed)) {
      return trimmed;
    }

    const asciiSafe = trimmed
      .replace(/\.json$/iu, "")
      .replace(/[^a-zA-Z0-9._-]+/gu, "-")
      .replace(/-+/gu, "-")
      .replace(/^[-.]+|[-.]+$/gu, "");
    if (asciiSafe.length > 0) {
      const candidate = `${asciiSafe}.json`;
      if (SAFE_COLLECTION_FILE_NAME_PATTERN.test(candidate)) {
        return candidate;
      }
    }
  }

  return "omnicall-external-service-collection.json";
}

function utf8ByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).byteLength;
  }
  return Buffer.byteLength(value, "utf8");
}
