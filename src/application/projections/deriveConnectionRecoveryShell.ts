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
  showAvatarRecoveryRing: boolean;
  showOcpRow: boolean;
  showSipRow: boolean;
  retryDisabledReason: string | null;
  showReregisterSipControl: boolean;
  reregisterDisabledReason: string | null;
  safeLogoutDisabledReason: string | null;
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

  const avatarRecoveryRing = isSipRegistrationRecoveryInFlight(projection);

  return {
    showOverlay: connectionState !== "connected" && !avatarRecoveryRing,
    isBlocking: deriveIsBlockingOverlay(projection),
    showAvatarRecoveryRing: avatarRecoveryRing,
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

  if (isSipRegistrationRecoveryInFlight(projection)) {
    return false;
  }

  if (connectionState === "server_terminate") {
    return true;
  }

  if (connectionState === "sip_disconnected" || connectionState === "sip_registration_failed") {
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
): string | null {
  const { connectionState } = projection;

  if (connectionState === "manual_retry_available") {
    return null;
  }

  if (connectionState === "reconnecting") {
    return "Автоматическое переподключение выполняется";
  }

  if (connectionState === "server_terminate") {
    return "Сессия завершена сервером";
  }

  if (connectionState === "sip_registration_failed") {
    return projection.sipRecoveryMode === "registration"
      ? "Автоматическая перерегистрация выполняется"
      : "Ручная повторная попытка пока недоступна";
  }

  return "Ручная повторная попытка пока недоступна";
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
): string | null {
  const { connectionState } = projection;

  if (connectionState === "manual_retry_available") {
    return null;
  }

  if (connectionState === "sip_registration_failed") {
    return null;
  }

  if (connectionState === "reconnecting") {
    return "Автоматическое переподключение выполняется";
  }

  if (connectionState === "server_terminate") {
    return "Сессия завершена сервером";
  }

  if (connectionState === "sip_disconnected") {
    return "Ожидание автоматической повторной попытки";
  }

  return "Перерегистрация недоступна";
}

function deriveSafeLogoutDisabledReason(connectionState: ConnectionState): string | null {
  if (connectionState === "server_terminate") {
    return null;
  }

  return "Безопасный выход недоступен";
}
