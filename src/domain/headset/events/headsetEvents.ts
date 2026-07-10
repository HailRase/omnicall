import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { HeadsetDeviceId } from "../HeadsetDeviceId.js";

export type HeadsetFaultReason =
  | "connect_failed"
  | "unsupported"
  | "usb_disconnected"
  | "device_error"
  | "led_blocked";

export type HeadsetConnected = ReturnType<typeof createHeadsetConnected>;
export type HeadsetDisconnected = ReturnType<typeof createHeadsetDisconnected>;
export type HeadsetFaultOccurred = ReturnType<typeof createHeadsetFaultOccurred>;
export type HeadsetAnswerPressed = ReturnType<typeof createHeadsetAnswerPressed>;
export type HeadsetHangupPressed = ReturnType<typeof createHeadsetHangupPressed>;
export type HeadsetHoldPressed = ReturnType<typeof createHeadsetHoldPressed>;
export type HeadsetMutePressed = ReturnType<typeof createHeadsetMutePressed>;
export type HeadsetLedSyncRequested = ReturnType<typeof createHeadsetLedSyncRequested>;

/**
 * - Purpose: headset domain events for connection, faults, and hardware intents.
 * - Inputs: correlation id and event-specific payload fields.
 * - Outputs: immutable domain events for projections and UI notifications.
 */
export function createHeadsetConnected(
  correlationId: CorrelationId,
  deviceId: HeadsetDeviceId,
  productName: string,
) {
  return createDomainEvent("HeadsetConnected", correlationId, {
    deviceId,
    productName,
  });
}

export function createHeadsetDisconnected(correlationId: CorrelationId, deviceId: HeadsetDeviceId | null) {
  return createDomainEvent("HeadsetDisconnected", correlationId, {
    deviceId,
  });
}

export function createHeadsetFaultOccurred(
  correlationId: CorrelationId,
  reason: HeadsetFaultReason,
) {
  return createDomainEvent("HeadsetFaultOccurred", correlationId, {
    reason,
  });
}

export function createHeadsetAnswerPressed(correlationId: CorrelationId, callId: string) {
  return createDomainEvent("HeadsetAnswerPressed", correlationId, { callId });
}

export function createHeadsetHangupPressed(correlationId: CorrelationId, callId: string) {
  return createDomainEvent("HeadsetHangupPressed", correlationId, { callId });
}

export function createHeadsetHoldPressed(correlationId: CorrelationId, callId: string) {
  return createDomainEvent("HeadsetHoldPressed", correlationId, { callId });
}

export function createHeadsetMutePressed(correlationId: CorrelationId, callId: string) {
  return createDomainEvent("HeadsetMutePressed", correlationId, { callId });
}

export function createHeadsetLedSyncRequested(
  correlationId: CorrelationId,
  commandType: string,
) {
  return createDomainEvent("HeadsetLedSyncRequested", correlationId, {
    commandType,
  });
}
