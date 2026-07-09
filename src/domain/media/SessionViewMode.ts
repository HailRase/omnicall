/**
 * - Purpose: session layout mode for video/call UI surfaces.
 * - Inputs: view mode string at Domain/Application boundaries.
 * - Outputs: typed SessionViewMode or parse failure.
 */

export const SESSION_VIEW_MODES = ["compact", "expanded", "fullscreen"] as const;

export type SessionViewMode = (typeof SESSION_VIEW_MODES)[number];

export const DEFAULT_SESSION_VIEW_MODE: SessionViewMode = "compact";

export function isSessionViewMode(value: unknown): value is SessionViewMode {
  return (
    typeof value === "string" &&
    (SESSION_VIEW_MODES as ReadonlyArray<string>).includes(value)
  );
}

export function parseSessionViewMode(value: unknown): SessionViewMode | null {
  return isSessionViewMode(value) ? value : null;
}
