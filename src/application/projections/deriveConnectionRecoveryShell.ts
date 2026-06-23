import {
  OCP_RECONNECT_POLICY_CONFIG,
  SIP_RECONNECT_POLICY_CONFIG,
} from "@domain/shared/recovery/ReconnectPolicy.js";
import type {
  ConnectionRecoveryProjection,
  ConnectionState,
} from "./connectionRecoveryProjection.js";

export type ConnectionRecoveryShellView = Readonly<{
  showOverlay: boolean;
  isBlocking: boolean;
  showOcpRow: boolean;
  showSipRow: boolean;
  retryDisabledReason: string | null;
  ocpMaxAttempts: number;
  sipMaxAttempts: number;
}>;

/**
 * - Purpose: derive connection overlay shell flags from recovery projection (LF-057).
 * - Inputs: connection recovery projection read model.
 * - Outputs: overlay visibility, channel rows, retry disabled reason.
 */
export function deriveConnectionRecoveryShell(
  projection: ConnectionRecoveryProjection,
): ConnectionRecoveryShellView {
  const { connectionState } = projection;

  return {
    showOverlay: connectionState !== "connected",
    isBlocking: deriveIsBlockingOverlay(projection),
    showOcpRow: deriveShowOcpRow(projection),
    showSipRow: deriveShowSipRow(projection),
    retryDisabledReason: deriveRetryConnectionDisabledReason(connectionState),
    ocpMaxAttempts: OCP_RECONNECT_POLICY_CONFIG.maxAttempts,
    sipMaxAttempts: SIP_RECONNECT_POLICY_CONFIG.maxAttempts,
  };
}

function deriveIsBlockingOverlay(projection: ConnectionRecoveryProjection): boolean {
  const { connectionState, sipReconnectAttempt } = projection;

  if (connectionState === "server_terminate") {
    return true;
  }

  if (connectionState === "sip_disconnected") {
    return true;
  }

  if (connectionState === "reconnect_failed") {
    return sipReconnectAttempt !== null;
  }

  if (connectionState === "reconnecting") {
    return sipReconnectAttempt !== null;
  }

  if (connectionState === "manual_retry_available") {
    return sipReconnectAttempt !== null;
  }

  return false;
}

function deriveShowOcpRow(projection: ConnectionRecoveryProjection): boolean {
  if (!projection.isOcpMode) {
    return false;
  }

  const { connectionState, ocpReconnectAttempt } = projection;
  if (connectionState === "ocp_disconnected") {
    return true;
  }
  if (connectionState === "reconnecting" && ocpReconnectAttempt !== null) {
    return true;
  }
  if (connectionState === "reconnect_failed" && ocpReconnectAttempt !== null) {
    return true;
  }
  if (connectionState === "server_terminate") {
    return true;
  }
  if (connectionState === "manual_retry_available" && ocpReconnectAttempt !== null) {
    return true;
  }

  return false;
}

function deriveShowSipRow(projection: ConnectionRecoveryProjection): boolean {
  const { connectionState, sipReconnectAttempt } = projection;

  if (connectionState === "sip_disconnected" || connectionState === "server_terminate") {
    return true;
  }

  return sipReconnectAttempt !== null;
}

function deriveRetryConnectionDisabledReason(
  connectionState: ConnectionState,
): string | null {
  if (connectionState === "manual_retry_available") {
    return null;
  }

  if (connectionState === "reconnecting") {
    return "Automatic reconnect in progress";
  }

  if (connectionState === "server_terminate") {
    return "Session ended by server";
  }

  return "Manual retry not available yet";
}
