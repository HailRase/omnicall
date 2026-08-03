/**
 * - Purpose: apply real-pixel geometry to a preview card element without React.
 * - Inputs: HTMLElement, real window rect, preview scale divisor.
 * - Outputs: inline left/top/width/height in preview pixels.
 */

import { realToPreview, type WindowGeometryRect } from "./windowGeometryMath.js";

export function applyPreviewCardRect(
  element: HTMLElement,
  rect: WindowGeometryRect,
  scale: number,
): void {
  element.style.left = `${realToPreview(rect.x, scale)}px`;
  element.style.top = `${realToPreview(rect.y, scale)}px`;
  element.style.width = `${realToPreview(rect.width, scale)}px`;
  element.style.height = `${realToPreview(rect.height, scale)}px`;
}
