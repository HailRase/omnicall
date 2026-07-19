/**
 * - Purpose: parse OCP WebSocket wire JSON into normalized OcpIncomingMessage.
 * - Inputs: unknown raw message body from WebSocket onmessage.
 * - Outputs: Result with entity-discriminated union or parse/entity errors.
 */

import {
  parseOperatorStatus,
  resolveOperatorReasonId,
} from "@domain/integration/ocp/OperatorStatus.js";
import type {
  OcpCallsPayload,
  OcpCampaignEventPayload,
  OcpCredsPayload,
  OcpIncomingMessage,
  OcpNotificationPayload,
  OcpNotificationPosition,
  OcpNotificationType,
  OcpStatusReasonPayload,
  OcpUsersPayload,
} from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

export type ParseOcpMessageError = "unknown_entity" | "parse_error";

export type ParseOcpMessageResult =
  | Readonly<{ ok: true; value: OcpIncomingMessage }>
  | Readonly<{ ok: false; error: ParseOcpMessageError }>;

function parseErr(error: ParseOcpMessageError): ParseOcpMessageResult {
  return { ok: false, error };
}

function parseOk(value: OcpIncomingMessage): ParseOcpMessageResult {
  return { ok: true, value };
}

const NOTIFICATION_TYPES = new Set<string>([
  "preloader",
  "progress",
  "success",
  "error",
  "warning",
  "notify",
  "help",
]);

const NOTIFICATION_POSITIONS = new Set<string>(["top-left", "top-right", "center"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  return coerceFiniteNumber(record[key]);
}

function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function coerceOperatorStatusValue(value: unknown): ReturnType<typeof parseOperatorStatus> {
  const asNumber = coerceFiniteNumber(value);
  return asNumber === null ? null : parseOperatorStatus(asNumber);
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function readWireReasonId(statusRecord: Record<string, unknown>): number | null {
  return coerceFiniteNumber(statusRecord["reason_id"]);
}

function readStatusTime(record: Record<string, unknown>): string {
  const raw = record["status_time"];
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  const asNumber = coerceFiniteNumber(raw);
  if (asNumber !== null) {
    const millis = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
    return new Date(millis).toISOString();
  }
  return new Date().toISOString();
}

function parseEnvelope(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isRecord(raw) ? raw : null;
}

function parseCredsPayload(payload: unknown): OcpCredsPayload | null {
  if (!isRecord(payload)) {
    return null;
  }
  const username = readString(payload, "username");
  const password = readString(payload, "password");
  const domain = readString(payload, "domain");
  const server = readString(payload, "server");
  if (username === null || password === null || domain === null || server === null) {
    return null;
  }
  return { username, password, domain, server };
}

function parseUsersPayload(payload: unknown): OcpUsersPayload | null {
  const first: unknown = Array.isArray(payload)
    ? payload[0]
    : isRecord(payload)
      ? payload
      : null;
  if (!isRecord(first)) {
    return null;
  }

  const operatorId = readNumber(first, "id");
  if (operatorId === null) {
    return null;
  }

  const statusField: unknown = first["status"];
  let status: ReturnType<typeof parseOperatorStatus> = null;
  let wireReasonId: number | null = null;

  if (isRecord(statusField)) {
    status = coerceOperatorStatusValue(statusField["value"]);
    wireReasonId = readWireReasonId(statusField);
  } else {
    status = coerceOperatorStatusValue(statusField);
  }

  if (status === null) {
    return null;
  }

  return {
    operatorId,
    status,
    reasonId: resolveOperatorReasonId(status, wireReasonId),
    statusSince: readStatusTime(first),
  };
}

function parseStatusReasonsPayload(
  payload: unknown,
): ReadonlyArray<OcpStatusReasonPayload> | null {
  if (!Array.isArray(payload)) {
    return null;
  }
  const reasons: OcpStatusReasonPayload[] = [];
  for (const entry of payload) {
    if (!isRecord(entry)) {
      return null;
    }
    const id = readNumber(entry, "id");
    const parentStatus = coerceOperatorStatusValue(entry["status"]);
    const defaultDescription =
      readString(entry, "default_description") ??
      readString(entry, "description") ??
      readString(entry, "name");
    if (id === null || parentStatus === null || defaultDescription === null) {
      return null;
    }
    const timeDeltaRaw = entry["time_delta"];
    const timeDelta =
      timeDeltaRaw === null || timeDeltaRaw === undefined
        ? null
        : coerceFiniteNumber(timeDeltaRaw);
    reasons.push({
      id,
      parentStatus,
      defaultDescription,
      timeDelta,
    });
  }
  return reasons;
}

function parseNotificationType(value: unknown): OcpNotificationType | null {
  return typeof value === "string" && NOTIFICATION_TYPES.has(value)
    ? (value as OcpNotificationType)
    : null;
}

function parseNotificationPosition(value: unknown): OcpNotificationPosition | null {
  return typeof value === "string" && NOTIFICATION_POSITIONS.has(value)
    ? (value as OcpNotificationPosition)
    : null;
}

function parseNotificationPayload(payload: unknown): OcpNotificationPayload | null {
  if (!isRecord(payload)) {
    return null;
  }
  const id = readString(payload, "id");
  const type = parseNotificationType(payload["type"]);
  const body = readString(payload, "body");
  const time = readNumber(payload, "time");
  const blocked = readBoolean(payload, "blocked");
  const deleted = readBoolean(payload, "deleted");
  const position = parseNotificationPosition(payload["position"]);
  if (
    id === null ||
    type === null ||
    body === null ||
    time === null ||
    blocked === null ||
    deleted === null ||
    position === null
  ) {
    return null;
  }
  const sticky = readBoolean(payload, "sticky");
  return {
    id,
    uuid: readOptionalString(payload, "uuid"),
    type,
    body,
    time,
    blocked,
    deleted,
    ...(sticky !== null ? { sticky } : {}),
    position,
  };
}

function parseCampaignEventPayload(payload: unknown): OcpCampaignEventPayload | null {
  if (!isRecord(payload)) {
    return null;
  }
  const id = readString(payload, "id");
  const callId = readString(payload, "call_id");
  const queueId = readString(payload, "queue_id");
  const abonentId = readString(payload, "abonent_id");
  const companyId = readString(payload, "company_id");
  const queueTitle = readString(payload, "queue_title");
  const selectionId = readString(payload, "selection_id");
  const clientPhone = readString(payload, "client_phone");
  const companyTitle = readString(payload, "company_title");
  const strategyTitle = readString(payload, "strategy_title");
  const selectionTitle = readString(payload, "selection_title");
  const strategyCallId = readString(payload, "strategy_call_id");
  const isAnswered = readBoolean(payload, "is_answered");
  const progressive = readBoolean(payload, "progressive");
  if (
    id === null ||
    callId === null ||
    queueId === null ||
    abonentId === null ||
    companyId === null ||
    queueTitle === null ||
    selectionId === null ||
    clientPhone === null ||
    companyTitle === null ||
    strategyTitle === null ||
    selectionTitle === null ||
    strategyCallId === null ||
    isAnswered === null ||
    progressive === null
  ) {
    return null;
  }
  return {
    id,
    callId,
    queueId,
    abonentId,
    companyId,
    queueTitle,
    selectionId,
    isAnswered,
    progressive,
    clientPhone,
    companyTitle,
    strategyTitle,
    selectionTitle,
    strategyCallId,
  };
}

function parseCallsPayload(payload: unknown): OcpCallsPayload | null {
  if (!isRecord(payload)) {
    return null;
  }
  const acallId = readString(payload, "acall_id");
  if (acallId === null) {
    return null;
  }
  const event = readString(payload, "event");
  if (event !== null) {
    const callerId = readString(payload, "caller_id");
    const calledId = readString(payload, "called_id");
    const queue = readString(payload, "queue");
    if (callerId === null || calledId === null || queue === null) {
      return null;
    }
    const mainAcallId = readOptionalString(payload, "main_acall_id");
    return {
      ...(mainAcallId !== undefined ? { mainAcallId } : {}),
      acallId,
      event,
      callerId,
      calledId,
      queue,
    };
  }
  const userLogin = readString(payload, "user_login");
  if (userLogin === null) {
    return null;
  }
  return { acallId, userLogin };
}

function parseErrorPayload(payload: unknown): { code: string } | null {
  if (!isRecord(payload)) {
    return null;
  }
  const code = readString(payload, "code");
  return code === null ? null : { code };
}

export function parseOcpMessage(raw: unknown): ParseOcpMessageResult {
  const envelope = parseEnvelope(raw);
  if (envelope === null) {
    return parseErr("parse_error");
  }

  const entity = envelope["entity"];
  if (typeof entity !== "string" || entity.length === 0) {
    return parseErr("parse_error");
  }

  const payload = envelope["payload"];

  switch (entity) {
    case "creds": {
      const data = parseCredsPayload(payload);
      return data === null ? parseErr("parse_error") : parseOk({ entity, data });
    }
    case "users": {
      const data = parseUsersPayload(payload);
      return data === null ? parseErr("parse_error") : parseOk({ entity, data });
    }
    case "operator_status_reasons": {
      const data = parseStatusReasonsPayload(payload);
      return data === null ? parseErr("parse_error") : parseOk({ entity, data });
    }
    case "notification": {
      const data = parseNotificationPayload(payload);
      return data === null ? parseErr("parse_error") : parseOk({ entity, data });
    }
    case "terminate":
      return parseOk({ entity: "terminate" });
    case "campaign_events": {
      const data = parseCampaignEventPayload(payload);
      return data === null ? parseErr("parse_error") : parseOk({ entity, data });
    }
    case "calls": {
      const data = parseCallsPayload(payload);
      return data === null ? parseErr("parse_error") : parseOk({ entity, data });
    }
    case "Error": {
      const data = parseErrorPayload(payload);
      return data === null ? parseErr("parse_error") : parseOk({ entity, data });
    }
    default:
      return parseErr("unknown_entity");
  }
}
