import type { DomainEvent, HeadsetConnectionState, HeadsetFaultReason } from "@domain/index.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

export type HeadsetConnectionProjection = Readonly<{
  isSupported: boolean;
  isEnabled: boolean;
  connectionState: HeadsetConnectionState;
  deviceLabel: string | null;
  autoReconnect: boolean;
  lastFaultReason: HeadsetFaultReason | null;
  lastFaultAt: string | null;
}>;

export function initialHeadsetConnectionProjection(): HeadsetConnectionProjection {
  return {
    isSupported: true,
    isEnabled: false,
    connectionState: "disconnected",
    deviceLabel: null,
    autoReconnect: true,
    lastFaultReason: null,
    lastFaultAt: null,
  };
}

/**
 * - Purpose: project headset connection status and operator-facing fault signals.
 * - Inputs: previous projection and domain event.
 * - Outputs: immutable headset connection projection.
 */
export function reduceHeadsetConnectionProjection(
  projection: HeadsetConnectionProjection,
  event: DomainEvent,
): HeadsetConnectionProjection {
  if (isSessionResetEvent(event)) {
    return initialHeadsetConnectionProjection();
  }

  switch (event.type) {
    case "HeadsetConnected":
      return {
        ...projection,
        connectionState: "connected",
        deviceLabel: asOptionalString(event["productName"]),
        lastFaultReason: null,
        lastFaultAt: null,
      };
    case "HeadsetDisconnected":
      return {
        ...projection,
        connectionState: "disconnected",
        deviceLabel: null,
      };
    case "HeadsetFaultOccurred": {
      const reason = asFaultReason(event["reason"]);
      const nextState: HeadsetConnectionState =
        reason === "led_blocked"
          ? projection.connectionState
          : reason === "usb_disconnected"
            ? "disconnected"
            : "error";
      return {
        ...projection,
        connectionState: nextState,
        deviceLabel: reason === "usb_disconnected" ? null : projection.deviceLabel,
        lastFaultReason: reason,
        lastFaultAt: typeof event.occurredAt === "string" ? event.occurredAt : null,
      };
    }
    default:
      return projection;
  }
}

export function applyHeadsetSettingsToProjection(
  _projection: HeadsetConnectionProjection,
  settings: Readonly<{ headsetEnabled: boolean; headsetAutoReconnect: boolean }>,
  isSupported: boolean,
  connectionState: HeadsetConnectionState,
  deviceLabel: string | null,
): HeadsetConnectionProjection {
  return {
    isSupported,
    isEnabled: settings.headsetEnabled,
    autoReconnect: settings.headsetAutoReconnect,
    connectionState,
    deviceLabel,
    lastFaultReason: _projection.lastFaultReason,
    lastFaultAt: _projection.lastFaultAt,
  };
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asFaultReason(value: unknown): HeadsetFaultReason | null {
  if (
    value === "connect_failed" ||
    value === "unsupported" ||
    value === "usb_disconnected" ||
    value === "device_error" ||
    value === "led_blocked"
  ) {
    return value;
  }
  return null;
}
