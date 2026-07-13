/**
 * - Purpose: canonical OCP gateway connection lifecycle states.
 * - Inputs: adapter state transitions.
 * - Outputs: typed union for projections and Use Cases.
 */

export type OcpConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "authenticated"
  | "reconnecting"
  | "sessionClosed"
  | "failed";
