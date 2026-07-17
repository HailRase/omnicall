/**
 * - Purpose: legacy mixed OCP connection/auth union for temporary consumers.
 * - Inputs: derived from OcpServerState + OcpAuthorizationState (ADR-AF-002).
 * - Outputs: compatibility bridge until every consumer migrates to dual FSM.
 *
 * Prefer `OcpServerState` / `OcpAuthorizationState` + `deriveLegacyOcpConnectionState`.
 */

export type OcpConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "authenticated"
  | "reconnecting"
  | "sessionClosed"
  | "failed";
