/**
 * - Purpose: typed IPC DTOs for listing display capture sources (F-027).
 * - Inputs: unknown IPC payloads/responses.
 * - Outputs: narrowed display-source list / pending-source commands.
 */

export type DisplayCaptureSourceKind = "screen" | "window";

export type DisplayCaptureSourceDto = Readonly<{
  id: string;
  name: string;
  kind: DisplayCaptureSourceKind;
  thumbnailDataUrl: string | null;
  /** Window app icon preview when thumbnail is unavailable. */
  appIconDataUrl: string | null;
}>;

export type ListDisplaySourcesResponse = Readonly<{
  ok: true;
  sources: ReadonlyArray<DisplayCaptureSourceDto>;
}> | Readonly<{
  ok: false;
  reason: string;
}>;

export type SetPendingDisplaySourcePayload = Readonly<{
  sourceId: string | null;
}>;

export type SetPendingDisplaySourceResponse = Readonly<{
  ok: true;
}> | Readonly<{
  ok: false;
  reason: string;
}>;

/**
 * - Purpose: validate set-pending display source IPC payload.
 * - Inputs: unknown IPC value.
 * - Outputs: typed payload or null when invalid.
 */
export function parseSetPendingDisplaySourcePayload(
  value: unknown,
): SetPendingDisplaySourcePayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const sourceId = (value as { sourceId?: unknown }).sourceId;
  if (sourceId !== null && typeof sourceId !== "string") {
    return null;
  }
  if (typeof sourceId === "string" && sourceId.trim().length === 0) {
    return null;
  }
  return { sourceId: sourceId ?? null };
}

/**
 * - Purpose: validate list-display-sources IPC response.
 * - Inputs: unknown IPC value.
 * - Outputs: typed response or null when invalid.
 */
export function parseListDisplaySourcesResponse(
  value: unknown,
): ListDisplaySourcesResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as { ok?: unknown; sources?: unknown; reason?: unknown };
  if (candidate.ok === false) {
    return {
      ok: false,
      reason: typeof candidate.reason === "string" ? candidate.reason : "unknown",
    };
  }
  if (candidate.ok !== true || !Array.isArray(candidate.sources)) {
    return null;
  }
  const sources: DisplayCaptureSourceDto[] = [];
  for (const item of candidate.sources) {
    const parsed = parseDisplayCaptureSourceDto(item);
    if (parsed === null) {
      return null;
    }
    sources.push(parsed);
  }
  return { ok: true, sources };
}

/**
 * - Purpose: validate set-pending display source IPC response.
 * - Inputs: unknown IPC value.
 * - Outputs: typed response or null when invalid.
 */
export function parseSetPendingDisplaySourceResponse(
  value: unknown,
): SetPendingDisplaySourceResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as { ok?: unknown; reason?: unknown };
  if (candidate.ok === true) {
    return { ok: true };
  }
  if (candidate.ok === false) {
    return {
      ok: false,
      reason: typeof candidate.reason === "string" ? candidate.reason : "unknown",
    };
  }
  return null;
}

function parseDisplayCaptureSourceDto(value: unknown): DisplayCaptureSourceDto | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as {
    id?: unknown;
    name?: unknown;
    kind?: unknown;
    thumbnailDataUrl?: unknown;
    appIconDataUrl?: unknown;
  };
  if (typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
    return null;
  }
  if (typeof candidate.name !== "string") {
    return null;
  }
  if (candidate.kind !== "screen" && candidate.kind !== "window") {
    return null;
  }
  if (
    candidate.thumbnailDataUrl !== null &&
    candidate.thumbnailDataUrl !== undefined &&
    typeof candidate.thumbnailDataUrl !== "string"
  ) {
    return null;
  }
  if (
    candidate.appIconDataUrl !== null &&
    candidate.appIconDataUrl !== undefined &&
    typeof candidate.appIconDataUrl !== "string"
  ) {
    return null;
  }
  return {
    id: candidate.id,
    name: candidate.name,
    kind: candidate.kind,
    thumbnailDataUrl: candidate.thumbnailDataUrl ?? null,
    appIconDataUrl: candidate.appIconDataUrl ?? null,
  };
}
