/**
 * - Purpose: pure dual-FSM reducers and recovery action guards (ADR-AF-002).
 * - Inputs: server/auth states + classified recovery intents.
 * - Outputs: next states, legacy connectionState bridge, allowed recovery actions.
 */

import type { OcpAuthorizationRejectedReason, OcpAuthorizationState } from "./OcpAuthorizationState.js";
import {
  authorizedOcpAuthorizationState,
  idleOcpAuthorizationState,
  pendingOcpAuthorizationState,
  rejectedOcpAuthorizationState,
  timeoutOcpAuthorizationState,
} from "./OcpAuthorizationState.js";
import type { OcpConnectionState } from "./OcpConnectionState.js";
import type { OcpServerState } from "./OcpServerState.js";

/** Operator-facing recovery intents owned by Application. */
export type OcpRecoveryAction =
  | "retry_server"
  | "retry_authorization"
  | "reconnect";

export type OcpDualFsmSnapshot = Readonly<{
  serverState: OcpServerState;
  authorizationState: OcpAuthorizationState;
  /** Terminal force-close (terminate) — keeps legacy sessionClosed until next connect. */
  terminalSessionClosed: boolean;
}>;

export type OcpServerTransition =
  | Readonly<{ type: "connect_requested" }>
  | Readonly<{ type: "transport_connected" }>
  | Readonly<{ type: "reconnect_requested" }>
  | Readonly<{ type: "transport_failed" }>
  | Readonly<{ type: "transport_disconnected" }>
  | Readonly<{ type: "manual_disconnect" }>;

export type OcpAuthorizationTransition =
  | Readonly<{ type: "auth_requested" }>
  | Readonly<{ type: "auth_succeeded" }>
  | Readonly<{ type: "auth_timeout" }>
  | Readonly<{
      type: "auth_rejected";
      reason: OcpAuthorizationRejectedReason;
    }>
  | Readonly<{ type: "auth_cleared" }>;

export function initialOcpDualFsmSnapshot(): OcpDualFsmSnapshot {
  return {
    serverState: "disconnected",
    authorizationState: idleOcpAuthorizationState(),
    terminalSessionClosed: false,
  };
}

export function reduceOcpServerState(
  current: OcpServerState,
  transition: OcpServerTransition,
): OcpServerState {
  switch (transition.type) {
    case "connect_requested":
      return current === "reconnecting" ? "reconnecting" : "connecting";
    case "reconnect_requested":
      return "reconnecting";
    case "transport_connected":
      return "connected";
    case "transport_failed":
      return "failed";
    case "transport_disconnected":
    case "manual_disconnect":
      return "disconnected";
    default: {
      const _exhaustive: never = transition;
      return _exhaustive;
    }
  }
}

export function reduceOcpAuthorizationState(
  _current: OcpAuthorizationState,
  transition: OcpAuthorizationTransition,
): OcpAuthorizationState {
  void _current;
  switch (transition.type) {
    case "auth_requested":
      return pendingOcpAuthorizationState();
    case "auth_succeeded":
      return authorizedOcpAuthorizationState();
    case "auth_timeout":
      return timeoutOcpAuthorizationState();
    case "auth_rejected":
      return rejectedOcpAuthorizationState(transition.reason);
    case "auth_cleared":
      return idleOcpAuthorizationState();
    default: {
      const _exhaustive: never = transition;
      return _exhaustive;
    }
  }
}

export function reduceOcpDualFsm(
  snapshot: OcpDualFsmSnapshot,
  input:
    | Readonly<{ kind: "server"; transition: OcpServerTransition }>
    | Readonly<{ kind: "authorization"; transition: OcpAuthorizationTransition }>
    | Readonly<{ kind: "terminate" }>,
): OcpDualFsmSnapshot {
  if (input.kind === "terminate") {
    return {
      serverState: "disconnected",
      authorizationState: idleOcpAuthorizationState(),
      terminalSessionClosed: true,
    };
  }

  if (input.kind === "server") {
    const serverState = reduceOcpServerState(snapshot.serverState, input.transition);
    const clearingTerminal =
      input.transition.type === "connect_requested" ||
      input.transition.type === "reconnect_requested";
    let authorizationState = snapshot.authorizationState;
    if (
      input.transition.type === "manual_disconnect" ||
      input.transition.type === "transport_disconnected" ||
      input.transition.type === "transport_failed"
    ) {
      if (authorizationState.phase === "authorized" || authorizationState.phase === "pending") {
        authorizationState = idleOcpAuthorizationState();
      }
    }
    if (input.transition.type === "connect_requested" || input.transition.type === "reconnect_requested") {
      authorizationState = idleOcpAuthorizationState();
    }
    return {
      serverState,
      authorizationState,
      terminalSessionClosed: clearingTerminal ? false : snapshot.terminalSessionClosed,
    };
  }

  return {
    ...snapshot,
    authorizationState: reduceOcpAuthorizationState(
      snapshot.authorizationState,
      input.transition,
    ),
  };
}

/**
 * Temporary bridge for consumers still reading the mixed connectionState union.
 * Remove after every consumer migrates to serverState + authorizationState.
 */
export function deriveLegacyOcpConnectionState(
  snapshot: OcpDualFsmSnapshot,
): OcpConnectionState {
  if (snapshot.terminalSessionClosed) {
    return "sessionClosed";
  }
  if (snapshot.authorizationState.phase === "authorized") {
    return "authenticated";
  }
  return snapshot.serverState;
}

export function deriveIsOcpAuthenticated(snapshot: OcpDualFsmSnapshot): boolean {
  return snapshot.authorizationState.phase === "authorized";
}

/**
 * Guards recovery intents against the dual FSM (invalid combinations return null).
 */
export function resolveAllowedOcpRecoveryAction(
  snapshot: OcpDualFsmSnapshot,
  intent: OcpRecoveryAction,
): OcpRecoveryAction | null {
  if (snapshot.terminalSessionClosed) {
    return null;
  }

  const { serverState, authorizationState } = snapshot;

  switch (intent) {
    case "retry_server": {
      if (
        serverState === "failed" ||
        serverState === "disconnected" ||
        (authorizationState.phase === "rejected" &&
          authorizationState.reason === "SESSION_EXIST")
      ) {
        return "retry_server";
      }
      return null;
    }
    case "retry_authorization": {
      if (
        serverState === "connected" &&
        (authorizationState.phase === "timeout" ||
          (authorizationState.phase === "rejected" &&
            authorizationState.reason !== "SESSION_EXIST"))
      ) {
        return "retry_authorization";
      }
      return null;
    }
    case "reconnect": {
      if (serverState === "connected" && authorizationState.phase === "authorized") {
        return "reconnect";
      }
      return null;
    }
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

/** Preferred recovery action for UI / Facade when multiple may apply. */
export function selectPrimaryOcpRecoveryAction(
  snapshot: OcpDualFsmSnapshot,
): OcpRecoveryAction | null {
  const sessionExist =
    snapshot.authorizationState.phase === "rejected" &&
    snapshot.authorizationState.reason === "SESSION_EXIST";
  if (sessionExist) {
    return resolveAllowedOcpRecoveryAction(snapshot, "retry_server");
  }
  if (
    snapshot.serverState === "connected" &&
    (snapshot.authorizationState.phase === "timeout" ||
      snapshot.authorizationState.phase === "rejected")
  ) {
    return resolveAllowedOcpRecoveryAction(snapshot, "retry_authorization");
  }
  if (snapshot.serverState === "failed" || snapshot.serverState === "disconnected") {
    if (snapshot.authorizationState.phase === "authorized") {
      return null;
    }
    return resolveAllowedOcpRecoveryAction(snapshot, "retry_server");
  }
  if (
    snapshot.serverState === "connected" &&
    snapshot.authorizationState.phase === "authorized"
  ) {
    return resolveAllowedOcpRecoveryAction(snapshot, "reconnect");
  }
  return null;
}
