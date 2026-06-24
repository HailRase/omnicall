import {
  createBreakReason,
  createOperatorSessionId,
  isAgentStatus,
  type AgentStatus,
  type BreakReason,
  type OcpAuthResult,
  type OperatorSession,
  type OcpAuthFailureReason,
} from "@domain/index.js";
import type { CallId } from "@domain/telephony/CallId.js";
import type { MainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import type { CampaignDecision } from "@domain/operator/events/campaignEvents.js";
import type { StatusReason } from "@domain/operator/StatusReason.js";
import { parseOcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";

const PUSH_EVENTS = new Set([
  "queue_info",
  "queueInfo",
  "campaign_event",
  "campaignEvent",
  "notification",
  "ocp_notification",
  "server_terminate",
  "serverTerminate",
  "terminate",
  "entity_terminate",
]);

/**
 * - Purpose: detect unsolicited OCP push payloads for inbound handler routing.
 * - Inputs: parsed WebSocket JSON record.
 * - Outputs: true when message is not a correlated RPC response.
 */
export function isOcpInboundPushMessage(record: Record<string, unknown>): boolean {
  const event = readEventName(record);
  if (event === null) {
    return false;
  }

  if (PUSH_EVENTS.has(event)) {
    return true;
  }

  const parsed = parseOcpInboundMessage(record);
  return typeof parsed !== "string";
}

/**
 * - Purpose: map OCP auth response payload to domain OcpAuthResult.
 * - Inputs: auth RPC response record, token, domain.
 * - Outputs: succeeded or failed OcpAuthResult.
 */
export function mapOcpAuthResponse(
  record: Record<string, unknown>,
  token: string,
  domain: string,
): OcpAuthResult {
  const failure = mapOcpAuthFailure(record);
  if (failure !== null) {
    return failure;
  }

  const agentId = readString(record, ["agent_id", "agentId", "username"]);
  if (agentId === null) {
    return {
      status: "failed",
      reason: "access_denied",
      message: "Access denied: username is required",
    };
  }

  const sipUsername = readString(record, ["sip_username", "sipUsername", "username"]) ?? agentId;
  const sipPassword = readString(record, ["sip_password", "sipPassword", "password"]);
  const sipDomain = readString(record, ["sip_domain", "sipDomain", "domain"]) ?? domain;
  const sipServer = readString(record, ["sip_server", "sipServer", "server", "wss_server"]);

  if (sipPassword === null || sipServer === null) {
    return {
      status: "failed",
      reason: "network_error",
      message: "OCP auth response missing SIP credentials",
    };
  }

  const sessionId = readString(record, ["session_id", "sessionId", "id"]) ?? `session-${agentId}`;
  const session: OperatorSession = {
    id: createOperatorSessionId(sessionId),
    token,
    domain,
    agentId,
  };

  return {
    status: "succeeded",
    session,
    sipCredentials: {
      username: sipUsername,
      password: sipPassword,
      domain: sipDomain,
      server: sipServer,
    },
  };
}

export function readAgentStatusFromRecord(
  record: Record<string, unknown>,
): AgentStatus | null {
  const raw = readString(record, ["status", "agent_status", "agentStatus", "current_status"]);
  if (raw === null) {
    return null;
  }
  const normalized = raw.toLowerCase();
  return isAgentStatus(normalized) ? normalized : null;
}

export function readBreakReasonsFromRecord(
  record: Record<string, unknown>,
): ReadonlyArray<BreakReason> {
  const raw = record["break_reasons"] ?? record["breakReasons"] ?? record["reasons"];
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => createBreakReason(item));
}

export function buildChangeStatusPayload(
  targetStatus: AgentStatus,
  reason: StatusReason | null,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    status: targetStatus,
    agent_status: targetStatus,
  };
  if (reason !== null) {
    payload["reason"] = reason;
  }
  return payload;
}

export function buildCampaignRespondPayload(
  campaignId: string,
  decision: CampaignDecision,
): Record<string, unknown> {
  return {
    campaign_id: campaignId,
    decision,
    accepted: decision === "accept",
  };
}

export function buildDlgStopPayload(
  callId: CallId,
  mainAcallId: MainAcallId,
): Record<string, unknown> {
  return {
    call_id: callId,
    main_acallid: mainAcallId,
  };
}

export function buildLogoutPayload(reason: StatusReason | null): Record<string, unknown> {
  if (reason === null) {
    return {};
  }
  return { reason };
}

export function isGatewaySuccess(record: Record<string, unknown>): boolean {
  if (record["success"] === false) {
    return false;
  }
  if (record["success"] === true) {
    return true;
  }

  const status = readString(record, ["status", "result"]);
  if (status === null) {
    return true;
  }

  const normalized = status.toLowerCase();
  return normalized !== "failed" && normalized !== "error" && normalized !== "rejected";
}

function mapOcpAuthFailure(record: Record<string, unknown>): OcpAuthResult | null {
  const event = readEventName(record);
  const reasonRaw =
    readString(record, ["reason", "error", "code"]) ??
    (event !== null && event !== "auth_success" && event !== "auth_result" ? event : null);

  if (reasonRaw === null) {
    return null;
  }

  const mapped = mapAuthFailureReason(reasonRaw);
  if (mapped === null) {
    return null;
  }

  const message =
    readString(record, ["message", "error_message", "errorMessage"]) ??
    defaultAuthFailureMessage(mapped);

  return {
    status: "failed",
    reason: mapped,
    message,
  };
}

function mapAuthFailureReason(raw: string): OcpAuthFailureReason | null {
  const normalized = raw.trim().toUpperCase();
  if (normalized === "SESSION_EXIST" || normalized === "SESSION_EXISTS") {
    return "session_exists";
  }
  if (normalized === "INVALID_TOKEN" || normalized === "TOKEN_INVALID") {
    return "invalid_token";
  }
  if (normalized === "ACCESS_DENIED" || normalized === "USERNAME_REQUIRED") {
    return "access_denied";
  }
  if (
    normalized === "NETWORK_ERROR" ||
    normalized === "AUTH_FAILED" ||
    normalized === "AUTH_ERROR"
  ) {
    return normalized === "NETWORK_ERROR" ? "network_error" : "invalid_token";
  }
  return null;
}

function defaultAuthFailureMessage(reason: OcpAuthFailureReason): string {
  switch (reason) {
    case "session_exists":
      return "OCP session already exists";
    case "invalid_token":
      return "Invalid OCP token";
    case "access_denied":
      return "Access denied: username is required";
    case "network_error":
      return "OCP network error";
    case "unknown":
      return "OCP auth failed";
  }
}

function readEventName(record: Record<string, unknown>): string | null {
  const event = record["event"] ?? record["type"];
  return typeof event === "string" && event.length > 0 ? event : null;
}

function readString(
  record: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}
