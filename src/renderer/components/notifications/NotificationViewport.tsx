import clsx from "clsx";
import type { JSX } from "react";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import { useI18n } from "../../i18n/index.js";
import { NotificationToast } from "./NotificationToast.js";
import styles from "./NotificationViewport.module.css";

export type NotificationViewportProps = Readonly<{
  placement: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  items: ReadonlyArray<NotificationItem>;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}>;

/**
 * - Purpose: render global notification region with configurable placement.
 * - Inputs: queue items, placement, and toast lifecycle handlers.
 * - Outputs: fixed viewport that hosts zero or more notification toasts.
 */
export function NotificationViewport({
  placement,
  items,
  onDismiss,
  onPause,
  onResume,
}: NotificationViewportProps): JSX.Element | null {
  const { t } = useI18n();
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={clsx(
        styles.viewport,
        placement === "top-right" && styles.topRight,
        placement === "top-left" && styles.topLeft,
        placement === "bottom-right" && styles.bottomRight,
        placement === "bottom-left" && styles.bottomLeft,
      )}
      data-testid="notification-viewport"
      aria-live="polite"
      aria-label={t("notifications.viewport.ariaLabel")}
    >
      {items.map((item) => (
        <NotificationToast
          key={item.id}
          item={item}
          onDismiss={onDismiss}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </section>
  );
}
