import {
  OCP_RECONNECT_POLICY_CONFIG,
  SIP_RECONNECT_POLICY_CONFIG,
} from "@domain/shared/recovery/ReconnectPolicy.js";
import type {
  ConnectionRecoveryProjection,
  ConnectionState,
} from "./connectionRecoveryProjection.js";

export type AvatarRecoveryOverlayMode = "countdown" | "reload" | "in_progress" | null;
export type ConnectionRecoveryReasonKey =
  | "connection.recovery.disabled.autoReconnectInProgress"
  | "connection.recovery.disabled.sessionTerminatedByServer"
  | "connection.recovery.disabled.manualRetryUnavailable"
  | "connection.recovery.disabled.waitingAutoRetry"
  | "connection.recovery.disabled.reregisterUnavailable"
  | "connection.recovery.disabled.safeLogoutUnavailable";

export type ConnectionRecoveryShellView = Readonly<{
  showOverlay: boolean;
  isBlocking: boolean;
  showAvatarRecoveryRing: boolean;
  avatarRecoveryRingTone: "failed" | null;
  avatarRecoveryOverlayMode: AvatarRecoveryOverlayMode;
  showOcpRow: boolean;
  showSipRow: boolean;
  retryDisabledReason: ConnectionRecoveryReasonKey | null;
  showReregisterSipControl: boolean;
  reregisterDisabledReason: ConnectionRecoveryReasonKey | null;
  safeLogoutDisabledReason: ConnectionRecoveryReasonKey | null;
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

  const avatarRecoveryRing = isSipRegistrationRecoveryOnAvatar(projection);

  return {
    showOverlay: connectionState !== "connected" && !avatarRecoveryRing,
    isBlocking: deriveIsBlockingOverlay(projection),
    showAvatarRecoveryRing: avatarRecoveryRing,
    avatarRecoveryRingTone: avatarRecoveryRing ? "failed" : null,
    avatarRecoveryOverlayMode: avatarRecoveryRing
      ? deriveAvatarRecoveryOverlayMode(projection)
      : null,
    showOcpRow: deriveShowOcpRow(projection),
    showSipRow: deriveShowSipRow(projection),
    retryDisabledReason: deriveRetryConnectionDisabledReason(projection),
    showReregisterSipControl: deriveShowReregisterSipControl(connectionState),
    reregisterDisabledReason: deriveReregisterSipDisabledReason(projection),
    safeLogoutDisabledReason: deriveSafeLogoutDisabledReason(connectionState),
    ocpMaxAttempts: OCP_RECONNECT_POLICY_CONFIG.maxAttempts,
    sipMaxAttempts: SIP_RECONNECT_POLICY_CONFIG.maxAttempts,
  };
}

function isSipRegistrationRecoveryOnAvatar(
  projection: ConnectionRecoveryProjection,
): boolean {
  if (projection.connectionState === "sip_registration_failed") {
    return true;
  }

  if (
    projection.connectionState === "manual_retry_available" &&
    projection.sipRecoveryMode === "registration"
  ) {
    return true;
  }

  return isSipRegistrationRecoveryInFlight(projection);
}

function deriveAvatarRecoveryOverlayMode(
  projection: ConnectionRecoveryProjection,
): AvatarRecoveryOverlayMode {
  if (
    projection.connectionState === "manual_retry_available" &&
    projection.sipRecoveryMode === "registration"
  ) {
    return "reload";
  }

  if (
    projection.connectionState === "reconnecting" &&
    projection.sipRecoveryMode === "registration" &&
    projection.nextRetryAt !== null
  ) {
    return "countdown";
  }

  if (
    projection.connectionState === "reconnecting" &&
    projection.sipRecoveryMode === "registration"
  ) {
    return "in_progress";
  }

  if (projection.connectionState === "sip_registration_failed") {
    return "in_progress";
  }

  return null;
}

function isSipRegistrationRecoveryInFlight(
  projection: ConnectionRecoveryProjection,
): boolean {
  return (
    projection.connectionState === "reconnecting" &&
    projection.sipRecoveryMode === "registration" &&
    projection.sipReconnectAttempt !== null
  );
}

function deriveIsBlockingOverlay(projection: ConnectionRecoveryProjection): boolean {
  const { connectionState, sipReconnectAttempt } = projection;

  if (isSipRegistrationRecoveryOnAvatar(projection)) {
    return false;
  }

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

  if (
    connectionState === "sip_disconnected" ||
    connectionState === "sip_registration_failed" ||
    connectionState === "server_terminate"
  ) {
    return true;
  }

  return sipReconnectAttempt !== null;
}

function deriveRetryConnectionDisabledReason(
  projection: ConnectionRecoveryProjection,
): ConnectionRecoveryReasonKey | null {
  const { connectionState } = projection;

  if (connectionState === "manual_retry_available") {
    return null;
  }

  if (connectionState === "reconnecting") {
    return "connection.recovery.disabled.autoReconnectInProgress";
  }

  if (connectionState === "server_terminate") {
    return "connection.recovery.disabled.sessionTerminatedByServer";
  }

  if (connectionState === "sip_registration_failed") {
    return projection.sipRecoveryMode === "registration"
      ? "connection.recovery.disabled.autoReconnectInProgress"
      : "connection.recovery.disabled.manualRetryUnavailable";
  }

  return "connection.recovery.disabled.manualRetryUnavailable";
}

function deriveShowReregisterSipControl(connectionState: ConnectionState): boolean {
  return (
    connectionState === "sip_disconnected" ||
    connectionState === "sip_registration_failed" ||
    connectionState === "manual_retry_available" ||
    connectionState === "reconnect_failed"
  );
}

function deriveReregisterSipDisabledReason(
  projection: ConnectionRecoveryProjection,
): ConnectionRecoveryReasonKey | null {
  const { connectionState } = projection;

  if (connectionState === "manual_retry_available") {
    return null;
  }

  if (connectionState === "sip_registration_failed") {
    return null;
  }

  if (connectionState === "reconnecting") {
    return "connection.recovery.disabled.autoReconnectInProgress";
  }

  if (connectionState === "server_terminate") {
    return "connection.recovery.disabled.sessionTerminatedByServer";
  }

  if (connectionState === "sip_disconnected") {
    return "connection.recovery.disabled.waitingAutoRetry";
  }

  return "connection.recovery.disabled.reregisterUnavailable";
}

function deriveSafeLogoutDisabledReason(
  connectionState: ConnectionState,
): ConnectionRecoveryReasonKey | null {
  if (connectionState === "server_terminate") {
    return null;
  }

  return "connection.recovery.disabled.safeLogoutUnavailable";
}
