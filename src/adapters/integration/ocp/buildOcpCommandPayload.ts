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
      return ok({
        command: cmd.kind,
        entity,
        payload: { call_id: cmd.callId },
        type: buildWireType(cmd.kind, entity),
      });
    }
    case "dlg_stop": {
      const entity = "calls";
      const payload: Record<string, unknown> = { call_id: cmd.callId };
      if (cmd.acallId !== undefined) {
        payload["acall_id"] = cmd.acallId;
      }
      return ok({
        command: cmd.kind,
        entity,
        payload,
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
