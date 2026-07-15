/**
 * - Purpose: serializable OCP session/connection projection for Application + UI.
 * - Inputs: OcpGateway connection states, Error entities, orchestrator auth feedback.
 * - Outputs: auth/domain snapshot selectors.
 */

import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import type { OcpErrorCode } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

/** Non-blocking auth feedback for toasts (SESSION_EXIST / timeout / HTTP failures). */
export type OcpAuthFeedbackReason =
  | "SESSION_EXIST"
  | "INVALID_TOKEN"
  | "AUTH_TIMEOUT"
  | "HTTP_AUTH_FAILED"
  | "LOGIN_REQUIRED"
  | "API_KEY_REQUIRED";

export type OcpAuthFeedback = Readonly<{
  reason: OcpAuthFeedbackReason;
  nonce: number;
}>;

export type OcpSessionProjection = Readonly<{
  connectionState: OcpConnectionState;
  isAuthenticated: boolean;
  domain: string | null;
  authFeedback: OcpAuthFeedback | null;
  reconnectAttempt: number;
}>;

export function initialOcpSessionProjection(): OcpSessionProjection {
  return {
    connectionState: "disconnected",
    isAuthenticated: false,
    domain: null,
    authFeedback: null,
    reconnectAttempt: 0,
  };
}

export function reduceOcpSessionFromConnectionState(
  projection: OcpSessionProjection,
  connectionState: OcpConnectionState,
): OcpSessionProjection {
  const reconnectAttempt =
    connectionState === "reconnecting"
      ? projection.reconnectAttempt + 1
      : connectionState === "authenticated" ||
          connectionState === "connected" ||
          connectionState === "disconnected"
        ? 0
        : projection.reconnectAttempt;

  return {
    ...projection,
    connectionState,
    isAuthenticated: connectionState === "authenticated",
    reconnectAttempt,
    authFeedback:
      connectionState === "authenticated" ? null : projection.authFeedback,
  };
}

export function reduceOcpSessionFromMessage(
  projection: OcpSessionProjection,
  message: OcpIncomingMessage,
): OcpSessionProjection {
  if (message.entity === "creds") {
    return {
      ...projection,
      domain: message.data.domain,
    };
  }

  if (message.entity === "Error") {
    return applyProxyError(projection, message.data.code);
  }

  if (message.entity === "terminate") {
    return {
      ...projection,
      connectionState: "sessionClosed",
      isAuthenticated: false,
    };
  }

  return projection;
}

export function applyOcpSessionDomain(
  projection: OcpSessionProjection,
  domain: string,
): OcpSessionProjection {
  return {
    ...projection,
    domain,
  };
}

/**
 * - Purpose: set non-blocking auth feedback for toast UI (nonce from hub).
 */
export function applyOcpAuthFeedback(
  projection: OcpSessionProjection,
  reason: OcpAuthFeedbackReason,
  nonce: number,
): OcpSessionProjection {
  return {
    ...projection,
    authFeedback: { reason, nonce },
    isAuthenticated: false,
  };
}

export function clearOcpAuthFeedback(
  projection: OcpSessionProjection,
): OcpSessionProjection {
  return {
    ...projection,
    authFeedback: null,
  };
}

export function selectIsOcpConnected(projection: OcpSessionProjection): boolean {
  return (
    projection.connectionState === "connected" ||
    projection.connectionState === "authenticated"
  );
}

export function selectOcpAuthFeedback(
  projection: OcpSessionProjection,
): OcpAuthFeedback | null {
  return projection.authFeedback;
}

export function selectOcpDomain(projection: OcpSessionProjection): string | null {
  return projection.domain;
}

function applyProxyError(
  projection: OcpSessionProjection,
  code: OcpErrorCode,
): OcpSessionProjection {
  if (code === "SESSION_EXIST") {
    return applyOcpAuthFeedback(projection, "SESSION_EXIST", Date.now());
  }
  if (code === "INVALID_TOKEN") {
    return applyOcpAuthFeedback(projection, "INVALID_TOKEN", Date.now());
  }
  return projection;
}
