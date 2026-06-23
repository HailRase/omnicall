import { useCallback, useMemo, useState } from "react";
import type { OcpNotificationProjection } from "@application/index.js";

type UseOcpNotificationsInput = Readonly<{
  isOcpMode: boolean;
  ocpNotificationProjection: OcpNotificationProjection;
}>;

type UseOcpNotificationsResult = Readonly<{
  visibleToasts: OcpNotificationProjection["toasts"];
  dismissToast: (id: string) => void;
}>;

/**
 * - Purpose: bind OCP toast projection to dismissible UI state (LF-059).
 * - Inputs: OCP mode flag and notification projection.
 * - Outputs: visible toasts and UI-only dismiss handler.
 */
export function useOcpNotifications(
  input: UseOcpNotificationsInput,
): UseOcpNotificationsResult {
  const { isOcpMode, ocpNotificationProjection } = input;
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(() => new Set());

  const visibleToasts = useMemo(() => {
    if (!isOcpMode || !ocpNotificationProjection.isOcpSyncAvailable) {
      return [];
    }
    return ocpNotificationProjection.toasts.filter((toast) => !dismissedIds.has(toast.id));
  }, [isOcpMode, ocpNotificationProjection, dismissedIds]);

  const dismissToast = useCallback((id: string): void => {
    setDismissedIds((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  return {
    visibleToasts,
    dismissToast,
  };
}
