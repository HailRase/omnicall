export type PreferencesOpenImportDialogResponse = Readonly<
  | { ok: true; cancelled: true }
  | { ok: true; cancelled: false; contents: string }
  | { ok: false; reason: string }
>;

export type PreferencesSaveExportDialogPayload = Readonly<{
  contents: string;
  suggestedFileName: string;
}>;

export type PreferencesSaveExportDialogResponse = Readonly<
  | { ok: true; cancelled: true }
  | { ok: true; cancelled: false; savedFileName: string }
  | { ok: false; reason: string }
>;

const MAX_PREFERENCES_EXPORT_BYTES = 512 * 1024;
const SAFE_PREFERENCES_FILE_NAME_PATTERN = /^[a-zA-Z0-9._-]+\.json$/u;

/**
 * - Purpose: validate preferences save-export IPC payloads at preload/renderer boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed export payload or null when invalid.
 */
export function parsePreferencesSaveExportDialogPayload(
  value: unknown,
): PreferencesSaveExportDialogPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const contents = candidate["contents"];
  const suggestedFileName = candidate["suggestedFileName"];

  if (typeof contents !== "string" || contents.length === 0) {
    return null;
  }

  if (utf8ByteLength(contents) > MAX_PREFERENCES_EXPORT_BYTES) {
    return null;
  }

  if (typeof suggestedFileName !== "string" || suggestedFileName.trim().length === 0) {
    return null;
  }

  const trimmedFileName = suggestedFileName.trim();
  if (!SAFE_PREFERENCES_FILE_NAME_PATTERN.test(trimmedFileName)) {
    return null;
  }

  return {
    contents,
    suggestedFileName: trimmedFileName,
  };
}

/**
 * - Purpose: validate preferences open-import IPC responses at preload boundary.
 * - Inputs: unknown IPC response.
 * - Outputs: typed import dialog response or null when invalid.
 */
export function parsePreferencesOpenImportDialogResponse(
  value: unknown,
): PreferencesOpenImportDialogResponse | null {
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
    return { ok: true, cancelled: false, contents: candidate["contents"] };
  }

  return null;
}

/**
 * - Purpose: validate preferences save-export IPC responses at preload boundary.
 * - Inputs: unknown IPC response.
 * - Outputs: typed save dialog response or null when invalid.
 */
export function parsePreferencesSaveExportDialogResponse(
  value: unknown,
): PreferencesSaveExportDialogResponse | null {
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
      savedFileName: sanitizePreferencesSavedFileName(candidate["savedFileName"]),
    };
  }

  return null;
}

/**
 * - Purpose: normalize user-chosen save names into IPC-safe JSON filenames.
 * - Inputs: unknown basename from the native save dialog.
 * - Outputs: ASCII-safe `*.json` filename always accepted by the contract.
 */
export function sanitizePreferencesSavedFileName(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (SAFE_PREFERENCES_FILE_NAME_PATTERN.test(trimmed)) {
      return trimmed;
    }

    const asciiSafe = trimmed
      .replace(/\.json$/iu, "")
      .replace(/[^a-zA-Z0-9._-]+/gu, "-")
      .replace(/-+/gu, "-")
      .replace(/^[-.]+|[-.]+$/gu, "");
    if (asciiSafe.length > 0) {
      const candidate = `${asciiSafe}.json`;
      if (SAFE_PREFERENCES_FILE_NAME_PATTERN.test(candidate)) {
        return candidate;
      }
    }
  }

  return "omnicall-preferences.json";
}

function utf8ByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).byteLength;
  }
  return Buffer.byteLength(value, "utf8");
}
