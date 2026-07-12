/**
 * - Purpose: classify local outbound video source for a call.
 * - Inputs: source string at Domain/Application boundaries.
 * - Outputs: typed LocalVideoSource or parse failure.
 */

export const LOCAL_VIDEO_SOURCES = ["none", "camera", "screen"] as const;

export type LocalVideoSource = (typeof LOCAL_VIDEO_SOURCES)[number];

export const DEFAULT_LOCAL_VIDEO_SOURCE: LocalVideoSource = "none";

export function isLocalVideoSource(value: unknown): value is LocalVideoSource {
  return (
    typeof value === "string" &&
    (LOCAL_VIDEO_SOURCES as ReadonlyArray<string>).includes(value)
  );
}

export function parseLocalVideoSource(value: unknown): LocalVideoSource | null {
  return isLocalVideoSource(value) ? value : null;
}
