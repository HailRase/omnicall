import type { JSX } from "react";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import { useI18n } from "../../i18n/index.js";
import { ToastProvider, ToastViewport as UiToastViewport } from "../ui/toast/index.js";
import type { ToastPlacement } from "../ui/types.js";
import { NotificationToast } from "./NotificationToast.js";

export type NotificationViewportProps = Readonly<{
  placement: ToastPlacement;
  durationMs: number;
  items: ReadonlyArray<NotificationItem>;
  onDismiss: (id: string) => void;
}>;

/**
 * - Purpose: host product notification queue inside UI Kit toast provider and viewport.
 * - Inputs: queue items, placement, default duration, and dismiss handler.
 * - Outputs: fixed toast region with Radix-managed lifecycle and stacking.
 */
export function NotificationViewport({
  placement,
  durationMs,
  items,
  onDismiss,
}: NotificationViewportProps): JSX.Element | null {
  const { t } = useI18n();

  if (items.length === 0) {
    return null;
  }

  return (
    <ToastProvider
      duration={durationMs > 0 ? durationMs : Number.POSITIVE_INFINITY}
      label={t("notifications.viewport.ariaLabel")}
    >
      {items.map((item) => (
        <NotificationToast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
      <UiToastViewport placement={placement} data-testid="notification-viewport" />
    </ToastProvider>
  );
}
