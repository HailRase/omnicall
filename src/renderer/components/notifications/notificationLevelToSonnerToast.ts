import type { NotificationLevel } from "../../hooks/useNotifications.js";
import { toast, type ExternalToast } from "../ui/sonner/index.js";

type SonnerToastInvoker = (
  message: string,
  data?: ExternalToast,
) => string | number;

/**
 * - Purpose: map product notification severity to Sonner toast invoker.
 * - Inputs: notification level from the renderer queue descriptor.
 * - Outputs: typed Sonner toast function for the matching visual state.
 */
export function notificationLevelToSonnerToast(level: NotificationLevel): SonnerToastInvoker {
  switch (level) {
    case "success":
      return toast.success;
    case "warning":
      return toast.warning;
    case "error":
      return toast.error;
    case "info":
      return toast.info;
    default: {
      const exhaustive: never = level;
      return exhaustive;
    }
  }
}
