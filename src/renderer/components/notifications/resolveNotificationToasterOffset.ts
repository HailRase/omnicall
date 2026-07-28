import type { ToastPlacement } from "../ui/types.js";

export type NotificationToasterOffset = Readonly<{
  top: string | number;
  right: string | number;
  bottom: string | number;
  left: string | number;
}>;

const NOTIFICATION_EDGE_OFFSET_PX = 24;

/**
 * - Purpose: resolve Sonner viewport insets within the usable shell rectangle.
 * - Inputs: toast placement from user notification settings.
 * - Outputs: offset object for both `offset` and `mobileOffset` (softphone width < 600px).
 *
 * Compact shell is typically 360–420px wide, so Sonner’s `max-width: 600px` mobile
 * layout applies in normal use. Top toasts already begin below the title bar, so
 * horizontal window-control insets are unnecessary and would push a standard-width
 * toast outside the compact viewport. `mobileOffset` mirrors the edge inset so
 * Sonner never falls back to its 16px default.
 */
export function resolveNotificationToasterOffset(
  placement: ToastPlacement,
): NotificationToasterOffset {
  const isTop = placement.startsWith("top");

  return {
    top: isTop ? "var(--incoming-call-banner-top)" : NOTIFICATION_EDGE_OFFSET_PX,
    bottom: NOTIFICATION_EDGE_OFFSET_PX,
    right: NOTIFICATION_EDGE_OFFSET_PX,
    left: NOTIFICATION_EDGE_OFFSET_PX,
  };
}
