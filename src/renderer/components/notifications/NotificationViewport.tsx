import type { JSX } from "react";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import { useI18n } from "../../i18n/index.js";
import { Toaster } from "../ui/sonner/index.js";
import type { ToastPlacement } from "../ui/types.js";
import type { NotificationStacking } from "@application/index.js";
import {
  NOTIFICATION_TOASTER_ID,
  useNotificationSonnerSync,
} from "./useNotificationSonnerSync.js";
import { resolveNotificationToasterOffset } from "./resolveNotificationToasterOffset.js";
import styles from "./NotificationViewport.module.css";

export type NotificationViewportProps = Readonly<{
  placement: ToastPlacement;
  stacking: NotificationStacking;
  durationMs: number;
  maxVisible: number;
  items: ReadonlyArray<NotificationItem>;
  onDismiss: (id: string) => void;
}>;

/**
 * - Purpose: host product notification queue through Sonner theme bridge.
 * - Inputs: queue items, placement, default duration, and dismiss handler.
 * - Outputs: Sonner viewport with synced ephemeral notification toasts.
 */
export function NotificationViewport({
  placement,
  stacking,
  durationMs,
  maxVisible,
  items,
  onDismiss,
}: NotificationViewportProps): JSX.Element {
  const { t, language } = useI18n();
  const chromeSafeOffset = resolveNotificationToasterOffset(placement);

  useNotificationSonnerSync({
    items,
    language,
    onDismiss,
  });

  return (
    <div className={styles.viewport} data-testid="notification-viewport">
      <Toaster
        id={NOTIFICATION_TOASTER_ID}
        position={placement}
        duration={durationMs > 0 ? durationMs : Number.POSITIVE_INFINITY}
        visibleToasts={stacking === "single" ? 1 : maxVisible}
        expand={false}
        gap={14}
        offset={chromeSafeOffset}
        mobileOffset={chromeSafeOffset}
        closeButton
        containerAriaLabel={t("notifications.viewport.ariaLabel")}
        toastOptions={{
          closeButtonAriaLabel: t("icons.overlay.close"),
        }}
      />
    </div>
  );
}
