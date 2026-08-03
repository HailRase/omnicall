/**
 * - Purpose: keep External Application windows at least partially on-screen.
 * - Inputs: requested x/y/width/height and a display workArea rectangle.
 * - Outputs: adjusted integer bounds (size capped to workArea when needed).
 */

export type ExternalApplicationWindowBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type DisplayWorkArea = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

/** Minimum overlap (px) so the window is not fully off the work area. */
const MIN_VISIBLE_PX = 64;

export function clampExternalApplicationWindowBounds(
  requested: ExternalApplicationWindowBounds,
  workArea: DisplayWorkArea,
): ExternalApplicationWindowBounds {
  const width = Math.min(Math.max(requested.width, 1), Math.max(workArea.width, 1));
  const height = Math.min(Math.max(requested.height, 1), Math.max(workArea.height, 1));
  let x = requested.x;
  let y = requested.y;

  if (x + width <= workArea.x) {
    x = workArea.x + MIN_VISIBLE_PX - width;
  } else if (x >= workArea.x + workArea.width) {
    x = workArea.x + workArea.width - MIN_VISIBLE_PX;
  }

  if (y + height <= workArea.y) {
    y = workArea.y + MIN_VISIBLE_PX - height;
  } else if (y >= workArea.y + workArea.height) {
    y = workArea.y + workArea.height - MIN_VISIBLE_PX;
  }

  return { x, y, width, height };
}
