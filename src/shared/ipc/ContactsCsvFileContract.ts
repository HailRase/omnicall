export type ContactsCsvOpenImportDialogResponse = Readonly<
  | { ok: true; cancelled: true }
  | { ok: true; cancelled: false; contents: string }
  | { ok: false; reason: string }
>;

export type ContactsCsvSaveExportDialogPayload = Readonly<{
  contents: string;
  suggestedFileName: string;
}>;

export type ContactsCsvSaveExportDialogResponse = Readonly<
  | { ok: true; cancelled: true }
  | { ok: true; cancelled: false }
  | { ok: false; reason: string }
>;

const MAX_CSV_EXPORT_BYTES = 2 * 1024 * 1024;

/**
 * - Purpose: validate contacts CSV save-export IPC payloads at preload boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed export payload or null when invalid.
 */
export function parseContactsCsvSaveExportDialogPayload(
  value: unknown,
): ContactsCsvSaveExportDialogPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const contents = candidate["contents"];
  const suggestedFileName = candidate["suggestedFileName"];

  if (typeof contents !== "string" || contents.length === 0) {
    return null;
  }

  if (Buffer.byteLength(contents, "utf8") > MAX_CSV_EXPORT_BYTES) {
    return null;
  }

  if (typeof suggestedFileName !== "string" || suggestedFileName.trim().length === 0) {
    return null;
  }

  const trimmedFileName = suggestedFileName.trim();
  if (!/^[a-zA-Z0-9._-]+\.csv$/u.test(trimmedFileName)) {
    return null;
  }

  return {
    contents,
    suggestedFileName: trimmedFileName,
  };
}

/**
 * - Purpose: validate contacts CSV open-import IPC responses at preload boundary.
 * - Inputs: unknown IPC response.
 * - Outputs: typed import dialog response or null when invalid.
 */
export function parseContactsCsvOpenImportDialogResponse(
  value: unknown,
): ContactsCsvOpenImportDialogResponse | null {
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
 * - Purpose: validate contacts CSV save-export IPC responses at preload boundary.
 * - Inputs: unknown IPC response.
 * - Outputs: typed save dialog response or null when invalid.
 */
export function parseContactsCsvSaveExportDialogResponse(
  value: unknown,
): ContactsCsvSaveExportDialogResponse | null {
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
    return { ok: true, cancelled: false };
  }

  return null;
}
