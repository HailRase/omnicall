import type { DomainEvent } from "@domain/index.js";
import type { OcpNotificationLevel } from "@domain/operator/events/ocpNotificationEvents.js";

export type OcpToastItem = Readonly<{
  id: string;
  message: string;
  level: OcpNotificationLevel;
  receivedAt: string;
}>;

export type OcpNotificationProjection = Readonly<{
  isOcpSyncAvailable: boolean;
  toasts: ReadonlyArray<OcpToastItem>;
}>;

export const initialOcpNotificationProjection = (): OcpNotificationProjection => ({
  isOcpSyncAvailable: false,
  toasts: [],
});

const MAX_TOASTS = 5;

/**
 * - Purpose: project OCP toast notifications for renderer (LF-059).
 * - Inputs: domain events.
 * - Outputs: bounded toast list when OCP sync is available.
 */
export function reduceOcpNotificationProjection(
  projection: OcpNotificationProjection,
  event: DomainEvent,
): OcpNotificationProjection {
  switch (event.type) {
    case "StartupModeResolved": {
      const resolution = event["resolution"];
      if (
        resolution !== undefined &&
        typeof resolution === "object" &&
        resolution !== null &&
        "action" in resolution &&
        resolution.action === "sip_only_ready"
      ) {
        return initialOcpNotificationProjection();
      }
      return projection;
    }
    case "OcpAuthenticationSucceeded":
      return {
        ...projection,
        isOcpSyncAvailable: true,
      };
    case "OcpAuthenticationFailed":
      return initialOcpNotificationProjection();
    case "OcpNotificationReceived": {
      if (!projection.isOcpSyncAvailable) {
        return projection;
      }
      const notificationId = asOptionalString(event["notificationId"]);
      const message = asOptionalString(event["message"]);
      const level = parseNotificationLevel(event["level"]);
      if (notificationId === null || message === null) {
        return projection;
      }
      const toast: OcpToastItem = {
        id: notificationId,
        message,
        level,
        receivedAt: event.occurredAt,
      };
      const nextToasts = [toast, ...projection.toasts].slice(0, MAX_TOASTS);
      return {
        ...projection,
        toasts: nextToasts,
      };
    }
    default:
      return projection;
  }
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseNotificationLevel(value: unknown): OcpNotificationLevel {
  if (value === "warn" || value === "error") {
    return value;
  }
  return "info";
}
