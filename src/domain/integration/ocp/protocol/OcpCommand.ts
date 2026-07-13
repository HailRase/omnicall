/**
 * - Purpose: application-level OCP gateway commands (kind-discriminated).
 * - Inputs: Use Case intent to change operator state or sync calls.
 * - Outputs: JSON-serializable command union for OcpGateway.sendCommand.
 */

import type { OperatorStatus } from "../OperatorStatus.js";

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
