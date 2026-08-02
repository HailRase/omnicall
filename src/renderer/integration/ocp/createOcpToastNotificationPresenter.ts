/**
 * - Purpose: map OCP notification wire to Softphone Notification Center toast descriptors.
 * - Inputs: OcpNotificationPayload (presentation uses body + type only).
 * - Outputs: NotificationDescriptor for notify, or null when body empty.
 */

import type { OcpNotificationPayload } from "@application/index.js";
import type {
  NotificationDescriptor,
  NotificationLevel,
} from "../../hooks/useNotifications.js";

/**
 * - Purpose: map OCP type to toast level (success/error only; else info).
 * - Inputs: OcpNotificationPayload.type.
 * - Outputs: NotificationLevel for Capture/Sonner.
 */
function mapOcpNotificationLevel(
  type: OcpNotificationPayload["type"],
): NotificationLevel {
  switch (type) {
    case "error":
      return "error";
    case "success":
      return "success";
    default:
      // warning | notify | help | preloader | progress → info (prefs decide visibility)
      return "info";
  }
}

/**
 * - Purpose: convert OCP notification entity into UI Kit toast descriptor.
 * - Inputs: payload from OcpNotificationPresenter.present.
 * - Outputs: descriptor or null when trimmed body is empty.
 *
 * Presentation ignores OCP id/uuid/time/blocked/deleted/sticky/position for lifecycle;
 * only body + type drive text/level. Placement/duration/stacking come from F-034 prefs.
 */
export function mapOcpNotificationToToastDescriptor(
  payload: OcpNotificationPayload,
): NotificationDescriptor | null {
  const body = payload.body.trim();
  if (body.length === 0) {
    return null;
  }

  const stableId = payload.id.trim();
  const descriptor: NotificationDescriptor = {
    ...(stableId.length > 0 ? { id: `ocp-notification-${stableId}` } : {}),
    level: mapOcpNotificationLevel(payload.type),
    messageText: body,
    module: "ocp",
    functionId: "ocp.notification",
    interruptClass: "remote",
  };
  return descriptor;
}
