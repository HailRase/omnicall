/**
 * - Purpose: OCP WebSocket transport lifecycle only (ADR-AF-002).
 * - Inputs: adapter / Application transport transitions.
 * - Outputs: typed union independent of authorization outcome.
 */

export type OcpServerState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export const OCP_SERVER_STATES: ReadonlyArray<OcpServerState> = [
  "disconnected",
  "connecting",
  "connected",
  "reconnecting",
  "failed",
];

export function isOcpServerState(value: string): value is OcpServerState {
  return (OCP_SERVER_STATES as ReadonlyArray<string>).includes(value);
}
