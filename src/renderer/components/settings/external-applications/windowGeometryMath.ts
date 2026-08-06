/**
 * - Purpose: pure clamp, adaptive scale, drag, and resize helpers for geometry preview.
 * - Inputs: real pixel geometry, preview deltas, desktop metrics, preview scale.
 * - Outputs: clamped integers and scaled preview coordinates.
 */

import {
  GEOMETRY_PREVIEW_DESKTOP_CHROME_PX,
  GEOMETRY_PREVIEW_SCALE_DEFAULT,
  GEOMETRY_PREVIEW_SCALE_MAX,
  GEOMETRY_PREVIEW_SCALE_MIN,
  MAX_WINDOW_HEIGHT,
  MAX_WINDOW_WIDTH,
  MAX_WINDOW_X,
  MAX_WINDOW_Y,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_X,
  MIN_WINDOW_Y,
  type ResizeHandle,
} from "./windowGeometryConstants.js";

export type DesktopMetrics = Readonly<{ width: number; height: number }>;

export type WindowGeometryRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type ResolveGeometryPreviewScaleInput = Readonly<{
  stageContentWidth: number;
  desktopWidth: number;
  minScale?: number;
  maxScale?: number;
  desktopChromePx?: number;
}>;

export function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function clampWindowWidth(value: number): number {
  return clampNumber(Math.round(value), MIN_WINDOW_WIDTH, MAX_WINDOW_WIDTH);
}

export function clampWindowHeight(value: number): number {
  return clampNumber(Math.round(value), MIN_WINDOW_HEIGHT, MAX_WINDOW_HEIGHT);
}

export function clampWindowX(value: number): number {
  return clampNumber(Math.round(value), MIN_WINDOW_X, MAX_WINDOW_X);
}

export function clampWindowY(value: number): number {
  return clampNumber(Math.round(value), MIN_WINDOW_Y, MAX_WINDOW_Y);
}

/** Keep the card fully inside the primary work area for preview drag UX. */
export function clampPositionInsideDesktop(
  x: number,
  y: number,
  width: number,
  height: number,
  desktop: DesktopMetrics,
): Readonly<{ x: number; y: number }> {
  const maxX = Math.max(0, desktop.width - width);
  const maxY = Math.max(0, desktop.height - height);
  return {
    x: clampNumber(Math.round(x), 0, maxX),
    y: clampNumber(Math.round(y), 0, maxY),
  };
}

export function clampGeometryInsideDesktop(
  rect: WindowGeometryRect,
  desktop: DesktopMetrics,
): WindowGeometryRect {
  const width = clampWindowWidth(Math.min(rect.width, desktop.width));
  const height = clampWindowHeight(Math.min(rect.height, desktop.height));
  const position = clampPositionInsideDesktop(
    rect.x,
    rect.y,
    width,
    height,
    desktop,
  );
  return { ...position, width, height };
}

/**
 * Resolve preview divisor so the desktop fits the stage width.
 * Larger scale → smaller preview; clamped between min/max for readability.
 */
export function resolveGeometryPreviewScale(
  input: ResolveGeometryPreviewScaleInput,
): number {
  const minScale = input.minScale ?? GEOMETRY_PREVIEW_SCALE_MIN;
  const maxScale = input.maxScale ?? GEOMETRY_PREVIEW_SCALE_MAX;
  if (
    !Number.isFinite(input.stageContentWidth) ||
    input.stageContentWidth <= 0 ||
    !Number.isFinite(input.desktopWidth) ||
    input.desktopWidth <= 0
  ) {
    return GEOMETRY_PREVIEW_SCALE_DEFAULT;
  }
  const reserved = input.desktopChromePx ?? GEOMETRY_PREVIEW_DESKTOP_CHROME_PX;
  const available = Math.max(1, input.stageContentWidth - reserved);
  const required = input.desktopWidth / available;
  return clampNumber(required, minScale, maxScale);
}

/** Layout sizes floor to whole CSS pixels to avoid sub-pixel overflow scrollbars. */
export function realToPreview(realPx: number, scale: number): number {
  const safeScale =
    Number.isFinite(scale) && scale > 0 ? scale : GEOMETRY_PREVIEW_SCALE_DEFAULT;
  return Math.floor(realPx / safeScale);
}

export function previewToReal(previewPx: number, scale: number): number {
  const safeScale =
    Number.isFinite(scale) && scale > 0 ? scale : GEOMETRY_PREVIEW_SCALE_DEFAULT;
  return Math.round(previewPx * safeScale);
}

/** Map pointer delta (preview px) onto a clamped real-pixel origin. */
export function positionFromPreviewDrag(
  originX: number,
  originY: number,
  deltaPreviewX: number,
  deltaPreviewY: number,
  width: number,
  height: number,
  desktop: DesktopMetrics,
  scale: number,
): Readonly<{ x: number; y: number }> {
  return clampPositionInsideDesktop(
    originX + previewToReal(deltaPreviewX, scale),
    originY + previewToReal(deltaPreviewY, scale),
    width,
    height,
    desktop,
  );
}

/** Map resize-handle drag (preview px) onto clamped real geometry. */
export function geometryFromPreviewResize(
  handle: ResizeHandle,
  origin: WindowGeometryRect,
  deltaPreviewX: number,
  deltaPreviewY: number,
  desktop: DesktopMetrics,
  scale: number,
): WindowGeometryRect {
  const dx = previewToReal(deltaPreviewX, scale);
  const dy = previewToReal(deltaPreviewY, scale);
  const right = origin.x + origin.width;
  const bottom = origin.y + origin.height;

  let x = origin.x;
  let y = origin.y;
  let width = origin.width;
  let height = origin.height;

  if (handle === "e" || handle === "ne" || handle === "se") {
    width = origin.width + dx;
  }
  if (handle === "w" || handle === "nw" || handle === "sw") {
    width = origin.width - dx;
  }
  if (handle === "s" || handle === "se" || handle === "sw") {
    height = origin.height + dy;
  }
  if (handle === "n" || handle === "ne" || handle === "nw") {
    height = origin.height - dy;
  }

  width = clampWindowWidth(width);
  height = clampWindowHeight(height);

  if (handle === "w" || handle === "nw" || handle === "sw") {
    x = right - width;
  }
  if (handle === "n" || handle === "ne" || handle === "nw") {
    y = bottom - height;
  }

  return clampGeometryInsideDesktop({ x, y, width, height }, desktop);
}

export function readDesktopMetrics(): DesktopMetrics {
  const width = window.screen.availWidth;
  const height = window.screen.availHeight;
  return {
    width: Number.isFinite(width) && width > 0 ? Math.round(width) : 1920,
    height: Number.isFinite(height) && height > 0 ? Math.round(height) : 1080,
  };
}
