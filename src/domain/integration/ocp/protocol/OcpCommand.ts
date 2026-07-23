/**
 * - Purpose: application-level OCP gateway commands (kind-discriminated).
 * - Inputs: Use Case intent to change operator state or sync calls.
 * - Outputs: JSON-serializable command union for OcpGateway.sendCommand.
 */

import type { OperatorStatus } from "../OperatorStatus.js";

/**
 * Application / Facade audit source for status mutations.
 * - `internal` — softphone UI
 * - `external` — E-12 host API
 * - `sdk` — public Axatalk SDK (DI-07); **must** map to OCP wire `external`
 *   via `mapOcpCallTypeToWire` — OCP `function_call_type` is only `internal`|`external`
 */
export type OcpCommandCallType = "internal" | "external" | "sdk";

export type OcpCommand =
  | Readonly<{ kind: "auth"; token: string }>
  | Readonly<{
      kind: "change_status_to_ready";
      operatorId: number;
      reasonId: number;
      callType: OcpCommandCallType;
    }>
  | Readonly<{
      kind: "change_status_to_break";
      operatorId: number;
      reasonId: number;
      callType: OcpCommandCallType;
    }>
  | Readonly<{
      kind: "change_status_to_logout";
      operatorId: number;
      reasonId: number;
      callType: OcpCommandCallType;
    }>
  | Readonly<{
      kind: "update_post_call_status";
      operatorId: number;
      reasonId: number;
      reservedStatus: OperatorStatus;
    }>
  | Readonly<{ kind: "get_main_acallid"; callId: string }>
  | Readonly<{ kind: "dlg_stop"; callId: string; acallId?: string }>
  | Readonly<{
      kind: "campaign_accept";
      operatorId: number;
      campaignEventId: string;
    }>
  | Readonly<{
      kind: "campaign_reject";
      operatorId: number;
      campaignEventId: string;
    }>
  | Readonly<{ kind: "logging"; payload: Record<string, unknown> }>;
