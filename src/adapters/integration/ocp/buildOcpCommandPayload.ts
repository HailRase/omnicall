/**
 * - Purpose: map application-level OcpCommand to OCP WebSocket wire envelope.
 * - Inputs: OcpCommand discriminated union (kind).
 * - Outputs: OcpMessageEnvelope for JSON serialization in OcpWebSocketAdapter.
 */

import type {
  OcpCommand,
  OcpCommandCallType,
} from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpMessageEnvelope } from "@domain/integration/ocp/protocol/OcpMessageEnvelope.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

import { mapOcpCallTypeToWire } from "./mapOcpCallTypeToWire.js";

function buildWireType(command: string, entity: string): string {
  return entity.length > 0 ? `${command}_${entity}` : command;
}

function buildProxyUsersStatusPayload(
  operatorId: number,
  reasonId: number,
  callType: OcpCommandCallType,
): Record<string, unknown> {
  return {
    operator_id: operatorId,
    reason_id: reasonId,
    // OCP rejects unknown values; never forward Application-only "sdk".
    function_call_type: mapOcpCallTypeToWire(callType),
  };
}

export function buildOcpCommandPayload(
  cmd: OcpCommand,
): Result<OcpMessageEnvelope, PlatformError> {
  switch (cmd.kind) {
    case "auth": {
      const entity = "proxy_users";
      return ok({
        command: "auth",
        entity,
        payload: cmd.token,
        type: buildWireType("auth", entity),
      });
    }
    case "change_status_to_ready": {
      const entity = "proxy_users";
      return ok({
        command: cmd.kind,
        entity,
        payload: buildProxyUsersStatusPayload(cmd.operatorId, cmd.reasonId, cmd.callType),
        type: buildWireType(cmd.kind, entity),
      });
    }
    case "change_status_to_break": {
      const entity = "proxy_users";
      return ok({
        command: cmd.kind,
        entity,
        payload: buildProxyUsersStatusPayload(cmd.operatorId, cmd.reasonId, cmd.callType),
        type: buildWireType(cmd.kind, entity),
      });
    }
    case "change_status_to_logout": {
      const entity = "proxy_users";
      return ok({
        command: cmd.kind,
        entity,
        payload: buildProxyUsersStatusPayload(cmd.operatorId, cmd.reasonId, cmd.callType),
        type: buildWireType(cmd.kind, entity),
      });
    }
    case "update_post_call_status": {
      const entity = "proxy_post_call_status";
      const command = "update";
      return ok({
        command,
        entity,
        payload: {
          operator_id: cmd.operatorId,
          reason_id: cmd.reasonId,
          reserved_status: cmd.reservedStatus,
        },
        type: buildWireType(command, entity),
      });
    }
    case "get_main_acallid": {
      const entity = "calls";
      // OCP wire quirk: SIP CallId is sent as `acallid` (no underscore).
      // Inbound MainCallIDInfo uses `acall_id` — do not conflate the two.
      return ok({
        command: cmd.kind,
        entity,
        payload: {
          acallid: cmd.callId,
          user_login: cmd.userLogin,
          caller_id: cmd.callerId,
          called_id: cmd.calledId,
          event: cmd.lifecycleEvent,
        },
        type: buildWireType(cmd.kind, entity),
      });
    }
    case "dlg_stop": {
      const entity = "calls";
      // Same wire quirk as get_main_acallid: SIP CallId → `acallid` (no underscore).
      // Do not send call_id / acall_id — live OCP hosts expect `{ acallid }` only.
      return ok({
        command: cmd.kind,
        entity,
        payload: {
          acallid: cmd.callId,
        },
        type: buildWireType(cmd.kind, entity),
      });
    }
    case "campaign_accept": {
      const entity = "campaign_events";
      const command = "update";
      return ok({
        command,
        entity,
        payload: {
          operator_id: cmd.operatorId,
          id: cmd.campaignEventId,
          is_answered: true,
        },
        type: buildWireType(command, entity),
      });
    }
    case "campaign_reject": {
      const entity = "campaign_events";
      const command = "update";
      return ok({
        command,
        entity,
        payload: {
          operator_id: cmd.operatorId,
          id: cmd.campaignEventId,
          is_answered: false,
        },
        type: buildWireType(command, entity),
      });
    }
    case "logging": {
      return ok({
        command: cmd.kind,
        entity: "",
        payload: cmd.payload,
        type: buildWireType(cmd.kind, ""),
      });
    }
    default: {
      const exhaustive: never = cmd;
      return err(
        createPlatformError(
          "not_implemented",
          `Unsupported OcpCommand kind: ${String(exhaustive)}`,
        ),
      );
    }
  }
}
