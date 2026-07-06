import { useEffect, useRef } from "react";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import type { SupportedLanguage } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { toast } from "../ui/sonner/index.js";
import { notificationLevelToSonnerToast } from "./notificationLevelToSonnerToast.js";
import { resolveNotificationMessage } from "./resolveNotificationMessage.js";

export const NOTIFICATION_TOASTER_ID = "product-notifications";

type UseNotificationSonnerSyncInput = Readonly<{
  items: ReadonlyArray<NotificationItem>;
  language: SupportedLanguage;
  onDismiss: (id: string) => void;
}>;

type NotificationToastSnapshot = Readonly<{
  level: NotificationItem["level"];
  message: string;
  duration: number;
  closable: boolean;
  actionId: string | null;
  actionLabel: string | null;
}>;

function buildSnapshot(
  item: NotificationItem,
  message: string,
  duration: number,
  actionLabel: string | null,
): NotificationToastSnapshot {
  return {
    level: item.level,
    message,
    duration,
    closable: item.closable,
    actionId: item.action?.id ?? null,
    actionLabel,
  };
}

function isSameSnapshot(
  left: NotificationToastSnapshot | undefined,
  right: NotificationToastSnapshot,
): boolean {
  if (left === undefined) {
    return false;
  }
  return (
    left.level === right.level &&
    left.message === right.message &&
    left.duration === right.duration &&
    left.closable === right.closable &&
    left.actionId === right.actionId &&
    left.actionLabel === right.actionLabel
  );
}

/**
 * - Purpose: mirror product notification queue items into Sonner toasts.
 * - Inputs: visible queue items, language, and dismiss handler.
 * - Outputs: side effect that enqueues, updates, and dismisses Sonner toasts by id.
 */
export function useNotificationSonnerSync({
  items,
  language,
  onDismiss,
}: UseNotificationSonnerSyncInput): void {
  const { t } = useI18n();
  const trackedSnapshotsRef = useRef(new Map<string, NotificationToastSnapshot>());
  const suppressedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const activeIds = new Set(items.map((item) => item.id));

    for (const trackedId of trackedSnapshotsRef.current.keys()) {
      if (!activeIds.has(trackedId)) {
        toast.dismiss(trackedId);
        trackedSnapshotsRef.current.delete(trackedId);
        suppressedIdsRef.current.delete(trackedId);
      }
    }

    for (const item of items) {
      if (suppressedIdsRef.current.has(item.id)) {
        continue;
      }

      const message = resolveNotificationMessage(item, language);
      const showToast = notificationLevelToSonnerToast(item.level);
      const duration = item.durationMs > 0 ? item.durationMs : Number.POSITIVE_INFINITY;
      const actionLabel = item.action !== null ? t(item.action.labelKey) : null;
      const nextSnapshot = buildSnapshot(item, message, duration, actionLabel);
      const previousSnapshot = trackedSnapshotsRef.current.get(item.id);

      if (isSameSnapshot(previousSnapshot, nextSnapshot)) {
        continue;
      }

      let closeHandled = false;
      const handleClose = (): void => {
        if (closeHandled) {
          return;
        }
        closeHandled = true;
        suppressedIdsRef.current.add(item.id);
        trackedSnapshotsRef.current.delete(item.id);
        item.onClose?.();
        onDismiss(item.id);
      };

      showToast(message, {
        id: item.id,
        toasterId: NOTIFICATION_TOASTER_ID,
        duration,
        closeButton: item.closable,
        ...(item.action !== null
          ? {
              action: {
                label: actionLabel,
                onClick: () => {
                  item.action?.onClick();
                },
              },
            }
          : {}),
        onDismiss: handleClose,
        onAutoClose: handleClose,
        testId: "notification-toast",
      });

      trackedSnapshotsRef.current.set(item.id, nextSnapshot);
    }
  }, [items, language, onDismiss, t]);

  useEffect(() => {
    const trackedSnapshots = trackedSnapshotsRef.current;
    const suppressedIds = suppressedIdsRef.current;
    return () => {
      for (const trackedId of trackedSnapshots.keys()) {
        toast.dismiss(trackedId);
      }
      trackedSnapshots.clear();
      suppressedIds.clear();
    };
  }, []);
}
