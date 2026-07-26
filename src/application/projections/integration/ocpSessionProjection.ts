/**
 * - Purpose: serializable OCP session projection with dual Server/Auth FSM (ADR-AF-002).
 * - Inputs: OcpGateway transport states, Error entities, orchestrator auth feedback.
 * - Outputs: dual FSM snapshot + temporary legacy connectionState bridge.
 */

import type { OcpAuthorizationState } from "@domain/integration/ocp/OcpAuthorizationState.js";
import {
  idleOcpAuthorizationState,
} from "@domain/integration/ocp/OcpAuthorizationState.js";
import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import {
  deriveIsOcpAuthenticated,
  deriveLegacyOcpConnectionState,
  initialOcpDualFsmSnapshot,
  reduceOcpDualFsm,
  selectPrimaryOcpRecoveryAction,
  type OcpDualFsmSnapshot,
  type OcpRecoveryAction,
} from "@domain/integration/ocp/ocpDualFsm.js";
import type { OcpErrorCode } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  initialAuthorizationProgressProjection,
  type AuthorizationProgressProjection,
} from "../settings/authorizationProgressProjection.js";

/** Non-blocking auth feedback for toasts (SESSION_EXIST / timeout / HTTP failures). */
export type OcpAuthFeedbackReason =
  | "SESSION_EXIST"
  | "INVALID_TOKEN"
  | "AUTH_TIMEOUT"
  | "HTTP_AUTH_FAILED"
  | "LOGIN_REQUIRED"
  | "API_KEY_REQUIRED"
  | "SIP_REGISTRATION_FAILED"
  | "SIP_IDENTITY_MISMATCH"
  | "CREDENTIALS_TIMEOUT";

export type OcpAuthFeedback = Readonly<{
  reason: OcpAuthFeedbackReason;
  nonce: number;
}>;

export type OcpSessionProjection = Readonly<{
  /** Transport-only server state (ADR-AF-002). */
  serverState: OcpServerState;
  /** Authorization-only state (ADR-AF-002). */
  authorizationState: OcpAuthorizationState;
  /** Opaque attempt id; late events from superseded attempts are ignored. */
  activeAttemptId: CorrelationId | null;
  /**
   * Legacy mixed union — derived from dual FSM for temporary consumers.
   * Prefer serverState + authorizationState for new code (ADR-AF-002).
   */
  connectionState: OcpConnectionState;
  isAuthenticated: boolean;
  /**
   * OCP proxy hostname (HTTP `/proxy/authenticate` + WS).
   * Never the SIP PBX domain from `entity:creds` — those hosts are independent.
   */
  domain: string | null;
  /**
   * Login used for OCP HTTP `/proxy/authenticate` (wire `user_login` on call sync).
   * Cleared on `resetToIdle`; preserved across transport flaps like `domain`.
   */
  authenticatedLogin: string | null;
  authFeedback: OcpAuthFeedback | null;
  reconnectAttempt: number;
  /** Unified OCP→SIP authorization progress for Account / Integrations UI. */
  authorizationProgress: AuthorizationProgressProjection;
  /** Preferred recovery action key for UI/Facade (null when none). */
  primaryRecoveryAction: OcpRecoveryAction | null;
}>;

function toDualSnapshot(projection: OcpSessionProjection): OcpDualFsmSnapshot {
  return {
    serverState: projection.serverState,
    authorizationState: projection.authorizationState,
    terminalSessionClosed: projection.connectionState === "sessionClosed",
  };
}

function withDerivedFields(
  base: Omit<
    OcpSessionProjection,
    "connectionState" | "isAuthenticated" | "primaryRecoveryAction"
  > &
    Readonly<{ terminalSessionClosed?: boolean }>,
): OcpSessionProjection {
  const snapshot: OcpDualFsmSnapshot = {
    serverState: base.serverState,
    authorizationState: base.authorizationState,
    terminalSessionClosed: base.terminalSessionClosed === true,
  };
  return {
    serverState: base.serverState,
    authorizationState: base.authorizationState,
    activeAttemptId: base.activeAttemptId,
    connectionState: deriveLegacyOcpConnectionState(snapshot),
    isAuthenticated: deriveIsOcpAuthenticated(snapshot),
    domain: base.domain,
    authenticatedLogin: base.authenticatedLogin,
    authFeedback: base.authFeedback,
    reconnectAttempt: base.reconnectAttempt,
    authorizationProgress: base.authorizationProgress,
    primaryRecoveryAction: selectPrimaryOcpRecoveryAction(snapshot),
  };
}

export function initialOcpSessionProjection(): OcpSessionProjection {
  const dual = initialOcpDualFsmSnapshot();
  return withDerivedFields({
    serverState: dual.serverState,
    authorizationState: dual.authorizationState,
    activeAttemptId: null,
    domain: null,
    authenticatedLogin: null,
    authFeedback: null,
    reconnectAttempt: 0,
    authorizationProgress: initialAuthorizationProgressProjection(),
    terminalSessionClosed: false,
  });
}

/**
 * Map gateway transport state into dual FSM + legacy bridge.
 */
export function reduceOcpSessionFromServerState(
  projection: OcpSessionProjection,
  serverState: OcpServerState,
): OcpSessionProjection {
  const transition =
    serverState === "connecting"
      ? ({ type: "connect_requested" } as const)
      : serverState === "reconnecting"
        ? ({ type: "reconnect_requested" } as const)
        : serverState === "connected"
          ? ({ type: "transport_connected" } as const)
          : serverState === "failed"
            ? ({ type: "transport_failed" } as const)
            : ({ type: "transport_disconnected" } as const);

  const next = reduceOcpDualFsm(toDualSnapshot(projection), {
    kind: "server",
    transition,
  });

  const reconnectAttempt =
    serverState === "reconnecting"
      ? projection.reconnectAttempt + 1
      : serverState === "connected" || serverState === "disconnected"
        ? 0
        : projection.reconnectAttempt;

  return withDerivedFields({
    serverState: next.serverState,
    authorizationState: next.authorizationState,
    activeAttemptId: projection.activeAttemptId,
    domain: projection.domain,
    authenticatedLogin: projection.authenticatedLogin,
    authFeedback:
      next.authorizationState.phase === "authorized"
        ? null
        : projection.authFeedback,
    reconnectAttempt,
    authorizationProgress: projection.authorizationProgress,
    terminalSessionClosed: next.terminalSessionClosed,
  });
}

/**
 * Compatibility reducer for legacy connectionState union.
 * Prefer reduceOcpSessionFromServerState; authenticated/sessionClosed map to auth/terminal.
 */
export function reduceOcpSessionFromConnectionState(
  projection: OcpSessionProjection,
  connectionState: OcpConnectionState,
): OcpSessionProjection {
  if (connectionState === "authenticated") {
    return reduceOcpSessionFromAuthorization(projection, {
      type: "auth_succeeded",
    });
  }
  if (connectionState === "sessionClosed") {
    return reduceOcpSessionFromTerminate(projection);
  }
  return reduceOcpSessionFromServerState(projection, connectionState);
}

export function reduceOcpSessionFromAuthorization(
  projection: OcpSessionProjection,
  transition:
    | Readonly<{ type: "auth_requested" }>
    | Readonly<{ type: "auth_succeeded" }>
    | Readonly<{ type: "auth_timeout" }>
    | Readonly<{
        type: "auth_rejected";
        reason: import("@domain/integration/ocp/OcpAuthorizationState.js").OcpAuthorizationRejectedReason;
      }>
    | Readonly<{ type: "auth_cleared" }>,
): OcpSessionProjection {
  const next = reduceOcpDualFsm(toDualSnapshot(projection), {
    kind: "authorization",
    transition,
  });
  return withDerivedFields({
    serverState: next.serverState,
    authorizationState: next.authorizationState,
    activeAttemptId: projection.activeAttemptId,
    domain: projection.domain,
    authenticatedLogin: projection.authenticatedLogin,
    authFeedback:
      next.authorizationState.phase === "authorized"
        ? null
        : projection.authFeedback,
    reconnectAttempt: projection.reconnectAttempt,
    authorizationProgress: projection.authorizationProgress,
    terminalSessionClosed: next.terminalSessionClosed,
  });
}

export function reduceOcpSessionFromTerminate(
  projection: OcpSessionProjection,
): OcpSessionProjection {
  const next = reduceOcpDualFsm(toDualSnapshot(projection), { kind: "terminate" });
  return withDerivedFields({
    serverState: next.serverState,
    authorizationState: next.authorizationState,
    activeAttemptId: null,
    domain: projection.domain,
    authenticatedLogin: projection.authenticatedLogin,
    authFeedback: null,
    reconnectAttempt: 0,
    authorizationProgress: projection.authorizationProgress,
    terminalSessionClosed: true,
  });
}

export function reduceOcpSessionFromMessage(
  projection: OcpSessionProjection,
  message: OcpIncomingMessage,
): OcpSessionProjection {
  // `entity:creds`.domain is SIP identity host — must not overwrite OCP proxy hostname.
  if (message.entity === "creds") {
    return projection;
  }

  if (message.entity === "Error") {
    return applyProxyError(projection, message.data.code);
  }

  if (message.entity === "terminate") {
    return reduceOcpSessionFromTerminate(projection);
  }

  if (message.entity === "users") {
    return reduceOcpSessionFromAuthorization(projection, {
      type: "auth_succeeded",
    });
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

export function applyOcpSessionAuthenticatedLogin(
  projection: OcpSessionProjection,
  authenticatedLogin: string,
): OcpSessionProjection {
  return {
    ...projection,
    authenticatedLogin,
  };
}

export function applyOcpActiveAttemptId(
  projection: OcpSessionProjection,
  attemptId: CorrelationId | null,
): OcpSessionProjection {
  return {
    ...projection,
    activeAttemptId: attemptId,
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
  let next: OcpSessionProjection = projection;

  if (reason === "AUTH_TIMEOUT") {
    next = reduceOcpSessionFromAuthorization(next, { type: "auth_timeout" });
  } else if (reason === "SESSION_EXIST") {
    next = reduceOcpSessionFromAuthorization(next, {
      type: "auth_rejected",
      reason: "SESSION_EXIST",
    });
  } else if (reason === "INVALID_TOKEN") {
    next = reduceOcpSessionFromAuthorization(next, {
      type: "auth_rejected",
      reason: "INVALID_TOKEN",
    });
  } else if (
    reason === "HTTP_AUTH_FAILED" ||
    reason === "LOGIN_REQUIRED" ||
    reason === "API_KEY_REQUIRED"
  ) {
    next = reduceOcpSessionFromAuthorization(next, {
      type: "auth_rejected",
      reason,
    });
  }

  return {
    ...next,
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
    projection.serverState === "connected" ||
    projection.authorizationState.phase === "authorized"
  );
}

export function selectOcpServerState(projection: OcpSessionProjection): OcpServerState {
  return projection.serverState;
}

export function selectOcpAuthorizationState(
  projection: OcpSessionProjection,
): OcpAuthorizationState {
  return projection.authorizationState;
}

export function selectOcpAuthFeedback(
  projection: OcpSessionProjection,
): OcpAuthFeedback | null {
  return projection.authFeedback;
}

export function selectOcpDomain(projection: OcpSessionProjection): string | null {
  return projection.domain;
}

export function selectOcpAuthenticatedLogin(
  projection: OcpSessionProjection,
): string | null {
  return projection.authenticatedLogin;
}

export function selectPrimaryRecoveryAction(
  projection: OcpSessionProjection,
): OcpRecoveryAction | null {
  return projection.primaryRecoveryAction;
}

export function applyAuthorizationProgress(
  projection: OcpSessionProjection,
  authorizationProgress: AuthorizationProgressProjection,
): OcpSessionProjection {
  return {
    ...projection,
    authorizationProgress,
  };
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

export function resetOcpAuthorizationIdle(
  projection: OcpSessionProjection,
): OcpSessionProjection {
  return withDerivedFields({
    serverState: projection.serverState,
    authorizationState: idleOcpAuthorizationState(),
    activeAttemptId: projection.activeAttemptId,
    domain: projection.domain,
    authenticatedLogin: projection.authenticatedLogin,
    authFeedback: projection.authFeedback,
    reconnectAttempt: projection.reconnectAttempt,
    authorizationProgress: projection.authorizationProgress,
    terminalSessionClosed: false,
  });
}
