export type AnchoredMenuPosition = Readonly<{
  top: number;
  left: number;
}>;

type RectLike = Readonly<{
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}>;

const MENU_GAP_PX = 4;
const VIEWPORT_PADDING_PX = 8;

/**
 * - Purpose: compute fixed menu coordinates with viewport flip/clamp.
 * - Inputs: anchor rect, menu rect, optional viewport size.
 * - Outputs: top/left pixel coordinates for auto-oriented placement.
 */
export function computeAnchoredMenuPosition(
  anchorRect: RectLike,
  menuRect: RectLike,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
): AnchoredMenuPosition {
  let top = anchorRect.bottom + MENU_GAP_PX;
  let left = anchorRect.left;

  if (top + menuRect.height > viewportHeight - VIEWPORT_PADDING_PX) {
    top = anchorRect.top - menuRect.height - MENU_GAP_PX;
  }

  if (left + menuRect.width > viewportWidth - VIEWPORT_PADDING_PX) {
    left = anchorRect.right - menuRect.width;
  }

  const maxLeft = viewportWidth - menuRect.width - VIEWPORT_PADDING_PX;
  const maxTop = viewportHeight - menuRect.height - VIEWPORT_PADDING_PX;

  return {
    top: Math.max(VIEWPORT_PADDING_PX, Math.min(top, maxTop)),
    left: Math.max(VIEWPORT_PADDING_PX, Math.min(left, maxLeft)),
  };
}
