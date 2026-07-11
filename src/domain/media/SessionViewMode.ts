/**
 * - Purpose: session layout mode for video/call UI surfaces.
 * - Inputs: view mode string at Domain/Application boundaries.
 * - Outputs: typed SessionViewMode or parse failure.
 */

export const SESSION_VIEW_MODES = ["expanded", "hidden", "fullscreen"] as const;

export type SessionViewMode = (typeof SESSION_VIEW_MODES)[number];

export const DEFAULT_SESSION_VIEW_MODE: SessionViewMode = "expanded";

/** Legacy persisted value migrated to expanded. */
const LEGACY_SESSION_VIEW_MODES = ["compact"] as const;

export function isSessionViewMode(value: unknown): value is SessionViewMode {
  return (
    typeof value === "string" &&
    (SESSION_VIEW_MODES as ReadonlyArray<string>).includes(value)
  );
}

/**
 * - Purpose: parse session view including legacy compact → expanded.
 * - Inputs: unknown settings/event value.
 * - Outputs: SessionViewMode or null when invalid.
 */
export function parseSessionViewMode(value: unknown): SessionViewMode | null {
  if (typeof value !== "string") {
    return null;
  }
  if ((LEGACY_SESSION_VIEW_MODES as ReadonlyArray<string>).includes(value)) {
    return "expanded";
  }
  return isSessionViewMode(value) ? value : null;
}
