import type { DomainEvent, HeadsetConnectionState, HeadsetFaultReason, HeadsetMuteInputMode } from "@domain/index.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

/**
 * - Purpose: UI-facing headset capability flags from the connected gateway.
 * - Inputs: subset of HeadsetCapabilities after connect.
 * - Outputs: projection field for Settings headset panel.
 */
export type HeadsetCapabilitiesInfo = Readonly<{
  supportsAnswer: boolean;
  supportsReject: boolean;
  supportsHangup: boolean;
  supportsHold: boolean;
  supportsMute: boolean;
  supportsRejectOnHookOn: boolean;
  muteInputMode: HeadsetMuteInputMode;
}>;

export type HeadsetConnectionProjection = Readonly<{
  isSupported: boolean;
  isEnabled: boolean;
  connectionState: HeadsetConnectionState;
  deviceId: string | null;
  deviceLabel: string | null;
  autoReconnect: boolean;
  lastFaultReason: HeadsetFaultReason | null;
  lastFaultAt: string | null;
  capabilities: HeadsetCapabilitiesInfo | null;
}>;

export function initialHeadsetConnectionProjection(): HeadsetConnectionProjection {
  return {
    isSupported: true,
    isEnabled: false,
    connectionState: "disconnected",
    deviceId: null,
    deviceLabel: null,
    autoReconnect: true,
    lastFaultReason: null,
    lastFaultAt: null,
    capabilities: null,
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
        deviceId: asOptionalString(event["deviceId"]),
        deviceLabel: asOptionalString(event["productName"]),
        lastFaultReason: null,
        lastFaultAt: null,
        capabilities: asCapabilitiesInfo(event["capabilities"]),
      };
    case "HeadsetDisconnected":
      return {
        ...projection,
        connectionState: "disconnected",
        deviceId: null,
        deviceLabel: null,
        capabilities: null,
      };
    case "HeadsetFaultOccurred": {
      const reason = asFaultReason(event["reason"]);
      const nextState: HeadsetConnectionState =
        reason === "led_blocked"
          ? projection.connectionState
          : reason === "usb_disconnected"
            ? "disconnected"
            : "error";
      const cleared = reason === "usb_disconnected";
      return {
        ...projection,
        connectionState: nextState,
        deviceId: cleared ? null : projection.deviceId,
        deviceLabel: cleared ? null : projection.deviceLabel,
        capabilities: cleared ? null : projection.capabilities,
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
  deviceId: string | null = null,
): HeadsetConnectionProjection {
  return {
    isSupported,
    isEnabled: settings.headsetEnabled,
    autoReconnect: settings.headsetAutoReconnect,
    connectionState,
    deviceId,
    deviceLabel,
    lastFaultReason: _projection.lastFaultReason,
    lastFaultAt: _projection.lastFaultAt,
    capabilities:
      connectionState === "connected" ? _projection.capabilities : null,
  };
}

/**
 * - Purpose: merge persisted headset user flags into live connection projection.
 * - Inputs: current projection and headset settings fields.
 * - Outputs: projection with isEnabled/autoReconnect aligned to settings.
 */
export function mergeHeadsetUserSettingsIntoProjection(
  projection: HeadsetConnectionProjection,
  settings: Readonly<{ headsetEnabled: boolean; headsetAutoReconnect: boolean }>,
): HeadsetConnectionProjection {
  return {
    ...projection,
    isEnabled: settings.headsetEnabled,
    autoReconnect: settings.headsetAutoReconnect,
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

function asCapabilitiesInfo(value: unknown): HeadsetCapabilitiesInfo | null {
  if (value === null || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const muteInputMode = record["muteInputMode"];
  if (muteInputMode !== "pulse" && muteInputMode !== "latch") {
    return null;
  }
  return {
    supportsAnswer: record["supportsAnswer"] === true,
    supportsReject: record["supportsReject"] === true,
    supportsHangup: record["supportsHangup"] === true,
    supportsHold: record["supportsHold"] === true,
    supportsMute: record["supportsMute"] === true,
    supportsRejectOnHookOn: record["supportsRejectOnHookOn"] === true,
    muteInputMode,
  };
}
