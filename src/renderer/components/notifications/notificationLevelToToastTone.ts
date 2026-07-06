import type { NotificationLevel } from "../../hooks/useNotifications.js";
import type { ToastTone } from "../ui/types.js";

/**
 * - Purpose: map product notification severity to UI Kit toast tone.
 * - Inputs: notification level from the renderer queue descriptor.
 * - Outputs: toast tone token for styled toast roots.
 */
export function notificationLevelToToastTone(level: NotificationLevel): ToastTone {
  switch (level) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "destructive";
    case "info":
      return "info";
    default: {
      const exhaustive: never = level;
      return exhaustive;
    }
  }
}
