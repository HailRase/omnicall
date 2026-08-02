/**
 * - Purpose: map OCP notification payloads to Softphone toast descriptors.
 * - Inputs: OcpNotificationPayload from gateway.
 * - Outputs: NotificationDescriptor for useNotifications.notify.
 */

import type { OcpNotificationPayload } from "@application/index.js";
import type {
  NotificationDescriptor,
  NotificationLevel,
} from "../../hooks/useNotifications.js";

function mapOcpNotificationLevel(
  type: OcpNotificationPayload["type"],
): NotificationLevel {
  switch (type) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "success":
      return "success";
    default:
      return "info";
  }
}

/**
 * - Purpose: convert OCP notification entity into UI Kit toast descriptor.
 * - Inputs: payload from OcpNotificationPresenter.present.
 * - Outputs: descriptor or null when payload should be skipped.
 */
export function mapOcpNotificationToToastDescriptor(
  payload: OcpNotificationPayload,
): NotificationDescriptor | null {
  if (payload.deleted || payload.blocked) {
    return null;
  }
  const body = payload.body.trim();
  if (body.length === 0) {
    return null;
  }

  const descriptor: NotificationDescriptor = {
    id: `ocp-notification-${payload.id}`,
    level: mapOcpNotificationLevel(payload.type),
    messageText: body,
    module: "ocp",
    functionId: "ocp.notification",
    interruptClass: "remote",
    ...(payload.sticky === true ? { durationMs: 0 } : {}),
  };
  return descriptor;
}
