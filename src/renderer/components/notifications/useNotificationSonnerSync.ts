import { createElement, useEffect, useRef } from "react";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import type { SupportedLanguage } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { toast } from "../ui/sonner/index.js";
import { AppIcon } from "../icons/AppIcon.js";
import notificationToastStyles from "./NotificationToast.module.css";
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
  const closeHandledIdsRef = useRef(new Set<string>());
  const latestItemsByIdRef = useRef(new Map<string, NotificationItem>());

  useEffect(() => {
    const activeIds = new Set(items.map((item) => item.id));
    latestItemsByIdRef.current = new Map(items.map((item) => [item.id, item]));

    for (const suppressedId of suppressedIdsRef.current) {
      if (!activeIds.has(suppressedId)) {
        suppressedIdsRef.current.delete(suppressedId);
      }
    }

    for (const closeHandledId of closeHandledIdsRef.current) {
      if (!activeIds.has(closeHandledId)) {
        closeHandledIdsRef.current.delete(closeHandledId);
      }
    }

    for (const trackedId of trackedSnapshotsRef.current.keys()) {
      if (!activeIds.has(trackedId)) {
        toast.dismiss(trackedId);
        trackedSnapshotsRef.current.delete(trackedId);
      }
    }

    for (const item of items) {
      if (suppressedIdsRef.current.has(item.id)) {
        continue;
      }

      const message = resolveNotificationMessage(item, language);
      const duration = item.durationMs > 0 ? item.durationMs : Number.POSITIVE_INFINITY;
      const actionLabel = item.action !== null ? t(item.action.labelKey) : null;
      const nextSnapshot = buildSnapshot(item, message, duration, actionLabel);
      const previousSnapshot = trackedSnapshotsRef.current.get(item.id);

      if (isSameSnapshot(previousSnapshot, nextSnapshot)) {
        continue;
      }

      const handleClose = (): void => {
        if (closeHandledIdsRef.current.has(item.id)) {
          return;
        }
        const latestItem = latestItemsByIdRef.current.get(item.id);
        trackedSnapshotsRef.current.delete(item.id);
        if (latestItem === undefined) {
          suppressedIdsRef.current.delete(item.id);
          closeHandledIdsRef.current.delete(item.id);
          return;
        }
        closeHandledIdsRef.current.add(item.id);
        suppressedIdsRef.current.add(item.id);
        latestItem.onClose?.();
        onDismiss(item.id);
      };

      const icon =
        item.level === "success"
          ? createElement(AppIcon, {
              id: "notification.success",
              size: 16,
              preferAnimated: false,
              className: notificationToastStyles.toastIconSuccess,
            })
          : item.level === "error"
            ? createElement(AppIcon, {
                id: "notification.error",
                size: 16,
                preferAnimated: false,
                className: notificationToastStyles.toastIconError,
              })
            : undefined;

      toast(message, {
        id: item.id,
        toasterId: NOTIFICATION_TOASTER_ID,
        duration,
        closeButton: item.closable,
        icon,
        ...(item.action !== null
          ? {
              action: {
                label: actionLabel,
                onClick: () => {
                  latestItemsByIdRef.current.get(item.id)?.action?.onClick();
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
    const closeHandledIds = closeHandledIdsRef.current;
    const latestItemsById = latestItemsByIdRef.current;
    return () => {
      for (const trackedId of trackedSnapshots.keys()) {
        toast.dismiss(trackedId);
      }
      trackedSnapshots.clear();
      suppressedIds.clear();
      closeHandledIds.clear();
      latestItemsById.clear();
    };
  }, []);
}
