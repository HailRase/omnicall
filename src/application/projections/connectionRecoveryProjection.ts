import type { DomainEvent } from "@domain/index.js";

export type ConnectionState =
  | "connected"
  | "ocp_disconnected"
  | "sip_disconnected"
  | "reconnecting"
  | "reconnect_failed"
  | "manual_retry_available"
  | "server_terminate";

export type ConnectionRecoveryProjection = Readonly<{
  connectionState: ConnectionState;
  reconnectAttempt: number;
  nextRetryAt: string | null;
  lastFailureReason: string | null;
  isOcpMode: boolean;
  ocpReconnectAttempt: number | null;
  sipReconnectAttempt: number | null;
}>;

export const initialConnectionRecoveryProjection = (): ConnectionRecoveryProjection => ({
  connectionState: "connected",
  reconnectAttempt: 0,
  nextRetryAt: null,
  lastFailureReason: null,
  isOcpMode: false,
  ocpReconnectAttempt: null,
  sipReconnectAttempt: null,
});

/**
 * - Purpose: project connection recovery state from WU1 recovery events (F-014).
 * - Inputs: prior projection, domain event.
 * - Outputs: immutable connection recovery read model.
 */
export function reduceConnectionRecoveryProjection(
  projection: ConnectionRecoveryProjection,
  event: DomainEvent,
): ConnectionRecoveryProjection {
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
          ...initialConnectionRecoveryProjection(),
          isOcpMode: false,
        };
      }
      return { ...projection, isOcpMode: true };
    }
    case "OcpAuthenticationSucceeded":
      return { ...projection, isOcpMode: true };
    case "RegistrationSucceeded":
      return applySipConnected(projection);
    case "RegistrationFailed":
      return applySipDisconnected(projection, asOptionalString(event["reason"]) ?? "registration_failed");
    case "OcpDisconnected":
      return applyOcpDisconnected(
        projection,
        asOptionalString(event["message"]) ?? asOptionalString(event["reason"]) ?? "ocp_disconnected",
      );
    case "OcpReconnectScheduled":
      return applyOcpReconnectScheduled(projection, event);
    case "OcpReconnectSucceeded":
      return applyOcpReconnectSucceeded(projection);
    case "OcpReconnectFailed":
      return applyOcpReconnectFailed(projection, event);
    case "SipReconnectScheduled":
      return applySipReconnectScheduled(projection, event);
    case "SipReconnectSucceeded":
      return applySipReconnectSucceeded(projection);
    case "SipReconnectFailed":
      return applySipReconnectFailed(projection, event);
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
  projection: ConnectionRecoveryProjection,
  reason: string,
): ConnectionRecoveryProjection {
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
  projection: ConnectionRecoveryProjection,
  event: DomainEvent,
): ConnectionRecoveryProjection {
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

function applyOcpReconnectSucceeded(
  projection: ConnectionRecoveryProjection,
): ConnectionRecoveryProjection {
  if (!projection.isOcpMode) {
    return projection;
  }
  const sipStillDown = projection.sipReconnectAttempt !== null;
  return {
    ...projection,
    connectionState: sipStillDown ? "sip_disconnected" : "connected",
    reconnectAttempt: 0,
    ocpReconnectAttempt: null,
    nextRetryAt: null,
    lastFailureReason: null,
  };
}

function applyOcpReconnectFailed(
  projection: ConnectionRecoveryProjection,
  event: DomainEvent,
): ConnectionRecoveryProjection {
  if (!projection.isOcpMode) {
    return projection;
  }
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]) ?? projection.reconnectAttempt;
  const reason = asOptionalString(event["reason"]) ?? "ocp_reconnect_failed";
  const isTerminal = event["isTerminal"] === true;
  return {
    ...projection,
    connectionState: isTerminal ? "reconnect_failed" : "ocp_disconnected",
    reconnectAttempt: attemptNumber,
    ocpReconnectAttempt: attemptNumber,
    nextRetryAt: null,
    lastFailureReason: reason,
  };
}

function applySipDisconnected(
  projection: ConnectionRecoveryProjection,
  reason: string,
): ConnectionRecoveryProjection {
  return {
    ...projection,
    connectionState: "sip_disconnected",
    lastFailureReason: reason,
    nextRetryAt: null,
    sipReconnectAttempt: null,
  };
}

function applySipReconnectScheduled(
  projection: ConnectionRecoveryProjection,
  event: DomainEvent,
): ConnectionRecoveryProjection {
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]);
  const delayMs = parseDelayMs(event["delayMs"]);
  if (attemptNumber === null || delayMs === null) {
    return projection;
  }
  return {
    ...projection,
    connectionState: "reconnecting",
    reconnectAttempt: attemptNumber,
    sipReconnectAttempt: attemptNumber,
    nextRetryAt: computeNextRetryAt(event.occurredAt, delayMs),
    lastFailureReason: null,
  };
}

function applySipReconnectSucceeded(
  projection: ConnectionRecoveryProjection,
): ConnectionRecoveryProjection {
  const ocpStillDown =
    projection.isOcpMode &&
    projection.ocpReconnectAttempt !== null &&
    projection.connectionState !== "connected";
  return {
    ...projection,
    connectionState: ocpStillDown ? "ocp_disconnected" : "connected",
    reconnectAttempt: 0,
    sipReconnectAttempt: null,
    nextRetryAt: null,
    lastFailureReason: null,
  };
}

function applySipReconnectFailed(
  projection: ConnectionRecoveryProjection,
  event: DomainEvent,
): ConnectionRecoveryProjection {
  const attemptNumber = parseAttemptNumber(event["attemptNumber"]) ?? projection.reconnectAttempt;
  const reason = asOptionalString(event["reason"]) ?? "sip_reconnect_failed";
  const isTerminal = event["isTerminal"] === true;
  return {
    ...projection,
    connectionState: isTerminal ? "reconnect_failed" : "sip_disconnected",
    reconnectAttempt: attemptNumber,
    sipReconnectAttempt: attemptNumber,
    nextRetryAt: null,
    lastFailureReason: reason,
  };
}

function applySipConnected(
  projection: ConnectionRecoveryProjection,
): ConnectionRecoveryProjection {
  const ocpChannelDown =
    projection.isOcpMode &&
    (projection.connectionState === "ocp_disconnected" ||
      projection.connectionState === "reconnecting" ||
      projection.connectionState === "reconnect_failed");
  if (ocpChannelDown) {
    return {
      ...projection,
      sipReconnectAttempt: null,
    };
  }
  return {
    ...projection,
    connectionState: "connected",
    reconnectAttempt: 0,
    sipReconnectAttempt: null,
    nextRetryAt: null,
    lastFailureReason: null,
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
