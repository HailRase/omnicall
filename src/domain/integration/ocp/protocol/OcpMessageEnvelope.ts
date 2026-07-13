/**
 * - Purpose: OCP WebSocket wire-format envelope (adapter boundary only).
 * - Inputs: raw JSON message fields from OCP backend.
 * - Outputs: typed envelope for parseOcpMessage in E-03.
 */

export type OcpMessageEnvelope = Readonly<{
  command: string;
  entity: string;
  payload: unknown;
  type: string;
}>;
