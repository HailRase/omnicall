/**
 * - Purpose: shared numeric limits and adaptive preview scale bounds.
 * - Inputs: none (compile-time constants).
 * - Outputs: clamp ranges, preview scale bounds, keyboard nudge, desktop chrome.
 */

/** Default / roomiest preview divisor (real ÷ scale = preview px). */
export const GEOMETRY_PREVIEW_SCALE_MIN = 4;
/** Tightest preview divisor when the stage is narrow. */
export const GEOMETRY_PREVIEW_SCALE_MAX = 8;
/** Fallback before the stage has been measured. */
export const GEOMETRY_PREVIEW_SCALE_DEFAULT = GEOMETRY_PREVIEW_SCALE_MIN;

/** Desktop left+right border (1px each) not included in content-box width math. */
export const GEOMETRY_PREVIEW_DESKTOP_CHROME_PX = 2;

export const KEYBOARD_NUDGE_PX = 10;

export const MIN_WINDOW_WIDTH = 320;
export const MAX_WINDOW_WIDTH = 3840;
export const MIN_WINDOW_HEIGHT = 240;
export const MAX_WINDOW_HEIGHT = 2160;
export const MIN_WINDOW_X = -10000;
export const MAX_WINDOW_X = 10000;
export const MIN_WINDOW_Y = -10000;
export const MAX_WINDOW_Y = 10000;

export const RESIZE_HANDLES = [
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
] as const;

export type ResizeHandle = (typeof RESIZE_HANDLES)[number];
