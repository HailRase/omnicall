/**
 * Map Application OcpCommandCallType → OCP WebSocket `function_call_type`.
 *
 * OCP wire accepts only `internal` | `external` (legacy proxy_users contract).
 * Application keeps `sdk` for OmniCall audit (ADR-0017 O-OCP-1); adapters must not
 * leak `sdk` onto the OCP socket.
 */

import type { OcpCommandCallType } from "@domain/integration/ocp/protocol/OcpCommand.js";

/** Values OCP `proxy_users` status commands accept on the wire. */
export type OcpWireCallType = "internal" | "external";

/**
 * - `internal` — desktop UI / native softphone actions
 * - `external` — host-page E-12 and public SDK (Facade `callType: "sdk"`)
 */
export function mapOcpCallTypeToWire(
  callType: OcpCommandCallType,
): OcpWireCallType {
  switch (callType) {
    case "internal":
      return "internal";
    case "external":
    case "sdk":
      return "external";
    default: {
      const exhaustive: never = callType;
      return exhaustive;
    }
  }
}
