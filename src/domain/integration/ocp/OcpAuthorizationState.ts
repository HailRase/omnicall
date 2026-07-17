/**
 * - Purpose: OCP authorization response lifecycle only (ADR-AF-002).
 * - Inputs: auth command outcome, timeout, classified proxy errors.
 * - Outputs: typed union independent of WebSocket transport state.
 */

export type OcpAuthorizationRejectedReason =
  | "SESSION_EXIST"
  | "INVALID_TOKEN"
  | "HTTP_AUTH_FAILED"
  | "LOGIN_REQUIRED"
  | "API_KEY_REQUIRED";

export type OcpAuthorizationState =
  | Readonly<{ phase: "idle" }>
  | Readonly<{ phase: "pending" }>
  | Readonly<{ phase: "authorized" }>
  | Readonly<{ phase: "timeout" }>
  | Readonly<{
      phase: "rejected";
      reason: OcpAuthorizationRejectedReason;
    }>;

export function idleOcpAuthorizationState(): OcpAuthorizationState {
  return { phase: "idle" };
}

export function pendingOcpAuthorizationState(): OcpAuthorizationState {
  return { phase: "pending" };
}

export function authorizedOcpAuthorizationState(): OcpAuthorizationState {
  return { phase: "authorized" };
}

export function timeoutOcpAuthorizationState(): OcpAuthorizationState {
  return { phase: "timeout" };
}

export function rejectedOcpAuthorizationState(
  reason: OcpAuthorizationRejectedReason,
): OcpAuthorizationState {
  return { phase: "rejected", reason };
}

export function isOcpAuthorizationAuthorized(
  state: OcpAuthorizationState,
): boolean {
  return state.phase === "authorized";
}
