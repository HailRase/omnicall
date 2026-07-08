import type { DomainEvent } from "@domain/index.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

export type OcpConnectionState =
  | "connected"
  | "ocp_disconnected"
  | "reconnecting"
  | "manual_retry_available"
  | "server_terminate";

export type OcpConnectionRecoveryProjection = Readonly<{
  connectionState: OcpConnectionState;
  reconnectAttempt: number;
  nextRetryAt: string | null;
  lastFailureReason: string | null;
  isOcpMode: boolean;
  ocpReconnectAttempt: number | null;
}>;

export const initialOcpConnectionRecoveryProjection = (): OcpConnectionRecoveryProjection => ({
  connectionState: "connected",
  reconnectAttempt: 0,
  nextRetryAt: null,
  lastFailureReason: null,
  isOcpMode: false,
  ocpReconnectAttempt: null,
});

/**
 * - Purpose: project OCP WebSocket recovery state for deferred OCP path (ADR-0002).
 * - Inputs: prior projection, domain event.
 * - Outputs: immutable OCP connection recovery read model.
 */
export function reduceOcpConnectionRecoveryProjection(
  projection: OcpConnectionRecoveryProjection,
  event: DomainEvent,
): OcpConnectionRecoveryProjection {
  if (isSessionResetEvent(event)) {
    return {
      ...initialOcpConnectionRecoveryProjection(),
      isOcpMode: projection.isOcpMode,
    };
  }

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
        return {
          ...initialOcpConnectionRecoveryProjection(),
          isOcpMode: false,
        };
      }
      return { ...projection, isOcpMode: true };
    }
    case "OcpAuthenticationSucceeded":
      return { ...projection, isOcpMode: true };
    case "OcpDisconnected":
      return applyOcpDisconnected(
        projection,
        asOptionalString(event["message"]) ??
          asOptionalString(event["reason"]) ??
          "ocp_disconnected",
      );
    case "OcpReconnectScheduled":
      return applyOcpReconnectScheduled(projection, event);
    case "OcpReconnectAttemptStarted":
      return applyOcpReconnectAttemptStarted(projection, event);
    case "OcpReconnectSucceeded":
      return applyOcpReconnectSucceeded(projection);
    case "OcpReconnectFailed":
      return applyOcpReconnectFailed(projection, event);
    case "ManualReconnectRequested":
      return applyManualReconnectRequested(projection, event);
    case "ServerTerminateReceived":
      return {
        ...projection,
        connectionState: "server_terminate",
        nextRetryAt: null,
        lastFailureReason: asOptionalString(event["reason"]) ?? "server_terminate",
      };
    default:
      return projection;
  }
}

function applyOcpDisconnected(
  projection: OcpConnectionRecoveryProjection,
  reason: string,
): OcpConnectionRecoveryProjection {
  if (!projection.isOcpMode) {
    return projection;
  }
  return {
    ...projection,
    connectionState: "ocp_disconnected",
    lastFailureReason: reason,
    nextRetryAt: null,
    ocpReconnectAttempt: null,
  };
}

function applyOcpReconnectScheduled(
  projection: OcpConnectionRecoveryProjection,
  event: DomainEvent,
): OcpConnectionRecoveryProjection {
  if (!projection.isOcpMode) {
    return projection;
  }
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]);
  const delayMs = parseDelayMs(event["delayMs"]);
  if (attemptNumber === null || delayMs === null) {
    return projection;
  }
  return {
    ...projection,
    connectionState: "reconnecting",
    reconnectAttempt: attemptNumber,
    ocpReconnectAttempt: attemptNumber,
    nextRetryAt: computeNextRetryAt(event.occurredAt, delayMs),
    lastFailureReason: null,
  };
}

function applyOcpReconnectAttemptStarted(
  projection: OcpConnectionRecoveryProjection,
  event: DomainEvent,
): OcpConnectionRecoveryProjection {
  if (!projection.isOcpMode) {
    return projection;
  }
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]);
  if (attemptNumber === null) {
    return projection;
  }
  return {
    ...projection,
    connectionState: "reconnecting",
    reconnectAttempt: attemptNumber,
    ocpReconnectAttempt: attemptNumber,
    nextRetryAt: null,
    lastFailureReason: null,
  };
}

function applyOcpReconnectSucceeded(
  projection: OcpConnectionRecoveryProjection,
): OcpConnectionRecoveryProjection {
  if (!projection.isOcpMode) {
    return projection;
  }
  return {
    ...projection,
    connectionState: "connected",
    reconnectAttempt: 0,
    ocpReconnectAttempt: null,
    nextRetryAt: null,
    lastFailureReason: null,
  };
}

function applyOcpReconnectFailed(
  projection: OcpConnectionRecoveryProjection,
  event: DomainEvent,
): OcpConnectionRecoveryProjection {
  if (!projection.isOcpMode) {
    return projection;
  }
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]) ?? projection.reconnectAttempt;
  const reason = asOptionalString(event["reason"]) ?? "ocp_reconnect_failed";
  const isTerminal = event["isTerminal"] === true;
  return {
    ...projection,
    connectionState: isTerminal ? "manual_retry_available" : "reconnecting",
    reconnectAttempt: attemptNumber,
    ocpReconnectAttempt: attemptNumber,
    nextRetryAt: null,
    lastFailureReason: reason,
  };
}

function applyManualReconnectRequested(
  projection: OcpConnectionRecoveryProjection,
  event: DomainEvent,
): OcpConnectionRecoveryProjection {
  const channel = event["channel"];
  if (channel !== "ocp" || !projection.isOcpMode) {
    return projection;
  }
  return {
    ...projection,
    connectionState: "reconnecting",
    reconnectAttempt: 1,
    nextRetryAt: null,
    lastFailureReason: null,
    ocpReconnectAttempt: 1,
  };
}

function computeNextRetryAt(occurredAt: string, delayMs: number): string {
  const baseMs = Date.parse(occurredAt);
  const startMs = Number.isNaN(baseMs) ? Date.now() : baseMs;
  return new Date(startMs + delayMs).toISOString();
}

function parseAttemptNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

function parseDelayMs(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
