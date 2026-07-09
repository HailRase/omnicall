import type { DomainEvent } from "@domain/index.js";
import type { HeadsetConnectionState } from "@domain/index.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

export type HeadsetConnectionProjection = Readonly<{
  isSupported: boolean;
  isEnabled: boolean;
  connectionState: HeadsetConnectionState;
  deviceLabel: string | null;
  autoReconnect: boolean;
}>;

export function initialHeadsetConnectionProjection(): HeadsetConnectionProjection {
  return {
    isSupported: true,
    isEnabled: false,
    connectionState: "disconnected",
    deviceLabel: null,
    autoReconnect: true,
  };
}

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
      };
    case "HeadsetDisconnected":
      return {
        ...projection,
        connectionState: "disconnected",
        deviceLabel: null,
      };
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
  };
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
