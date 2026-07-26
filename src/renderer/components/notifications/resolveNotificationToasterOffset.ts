import type { ToastPlacement } from "../ui/types.js";

export type NotificationToasterOffset = Readonly<{
  top: string | number;
  right: string | number;
  bottom: string | number;
  left: string | number;
}>;

const NOTIFICATION_EDGE_OFFSET_PX = 24;
const NOTIFICATION_EDGE_OFFSET_SAFE_START =
  "calc(24px + var(--shell-window-controls-safe-inline-start))";
const NOTIFICATION_EDGE_OFFSET_SAFE_END =
  "calc(24px + var(--shell-window-controls-safe-inline-end))";

/**
 * - Purpose: resolve Sonner viewport insets that clear frameless window chrome.
 * - Inputs: toast placement from user notification settings.
 * - Outputs: offset object for both `offset` and `mobileOffset` (softphone width < 600px).
 *
 * Compact shell is typically 360–420px wide, so Sonner’s `max-width: 600px` mobile
 * layout applies in normal use. `mobileOffset` must mirror chrome-safe values or
 * toasts fall back to 16px and overlap titlebar window controls on every OS.
 */
export function resolveNotificationToasterOffset(
  placement: ToastPlacement,
): NotificationToasterOffset {
  const isTop = placement.startsWith("top");

  return {
    top: isTop ? "var(--incoming-call-banner-top)" : NOTIFICATION_EDGE_OFFSET_PX,
    bottom: NOTIFICATION_EDGE_OFFSET_PX,
    right:
      placement === "top-right"
        ? NOTIFICATION_EDGE_OFFSET_SAFE_END
        : NOTIFICATION_EDGE_OFFSET_PX,
    left:
      placement === "top-left"
        ? NOTIFICATION_EDGE_OFFSET_SAFE_START
        : NOTIFICATION_EDGE_OFFSET_PX,
  };
}
