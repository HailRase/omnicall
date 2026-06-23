import type { MainAcallId } from "./MainAcallId.js";
import { parseMainAcallId } from "./MainAcallId.js";

export type OcpInboundMessageKind = "queue_info" | "campaign_event" | "notification";

export type OcpNotificationLevel = "info" | "warn" | "error";

export type OcpQueueInfoPayload = Readonly<{
  kind: "queue_info";
  mainAcallId: MainAcallId;
  queueName: string;
}>;

export type OcpCampaignEventPayload = Readonly<{
  kind: "campaign_event";
  campaignId: string;
  title: string;
  mainAcallId: MainAcallId | null;
  progressive: boolean;
}>;

export type OcpNotificationPayload = Readonly<{
  kind: "notification";
  notificationId: string;
  message: string;
  level: OcpNotificationLevel;
}>;

export type OcpInboundMessage =
  | OcpQueueInfoPayload
  | OcpCampaignEventPayload
  | OcpNotificationPayload;

export type OcpInboundParseError =
  | "invalid_payload"
  | "unknown_message_kind"
  | "queue_name_required"
  | "campaign_id_required"
  | "notification_message_required";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readMessageKind(record: Record<string, unknown>): string | null {
  const event = record["event"];
  if (typeof event === "string" && event.length > 0) {
    return event;
  }
  const type = record["type"];
  if (typeof type === "string" && type.length > 0) {
    return type;
  }
  return null;
}

function parseQueueInfoMessage(
  record: Record<string, unknown>,
): OcpQueueInfoPayload | OcpInboundParseError {
  const mainAcallId = parseMainAcallId(record["main_acallid"] ?? record["mainAcallId"]);
  if (mainAcallId === null) {
    return "invalid_payload";
  }

  const queueNameRaw = record["queue_name"] ?? record["queueName"];
  if (typeof queueNameRaw !== "string" || queueNameRaw.trim().length === 0) {
    return "queue_name_required";
  }

  return {
    kind: "queue_info",
    mainAcallId,
    queueName: queueNameRaw.trim(),
  };
}

function parseNotificationLevel(value: unknown): OcpNotificationLevel {
  if (value === "warn" || value === "warning") {
    return "warn";
  }
  if (value === "error") {
    return "error";
  }
  return "info";
}

function parseNotificationMessage(
  record: Record<string, unknown>,
): OcpNotificationPayload | OcpInboundParseError {
  const messageRaw = record["message"] ?? record["text"] ?? record["body"];
  if (typeof messageRaw !== "string" || messageRaw.trim().length === 0) {
    return "notification_message_required";
  }

  const idRaw = record["notification_id"] ?? record["notificationId"] ?? record["id"];
  const notificationId =
    typeof idRaw === "string" && idRaw.trim().length > 0
      ? idRaw.trim()
      : `notif-${Date.now()}`;

  return {
    kind: "notification",
    notificationId,
    message: messageRaw.trim(),
    level: parseNotificationLevel(record["level"] ?? record["severity"]),
  };
}

function parseCampaignEventMessage(
  record: Record<string, unknown>,
): OcpCampaignEventPayload | OcpInboundParseError {
  const campaignIdRaw = record["campaign_id"] ?? record["campaignId"];
  if (typeof campaignIdRaw !== "string" || campaignIdRaw.trim().length === 0) {
    return "campaign_id_required";
  }

  const titleRaw = record["title"] ?? record["campaign_title"] ?? record["campaignTitle"];
  const title = typeof titleRaw === "string" && titleRaw.trim().length > 0
    ? titleRaw.trim()
    : "Campaign";

  const mainAcallId = parseMainAcallId(record["main_acallid"] ?? record["mainAcallId"]);
  const progressiveRaw = record["progressive"] ?? record["is_progressive"];
  const progressive = progressiveRaw === true;

  return {
    kind: "campaign_event",
    campaignId: campaignIdRaw.trim(),
    title,
    mainAcallId,
    progressive,
  };
}

/**
 * - Purpose: narrow raw OCP WebSocket payloads at integration boundary.
 * - Inputs: unknown inbound message.
 * - Outputs: typed OcpInboundMessage or parse error.
 */
export function parseOcpInboundMessage(
  raw: unknown,
): OcpInboundMessage | OcpInboundParseError {
  if (!isRecord(raw)) {
    return "invalid_payload";
  }

  const kind = readMessageKind(raw);
  if (kind === null) {
    return "unknown_message_kind";
  }

  if (kind === "queue_info" || kind === "queueInfo") {
    return parseQueueInfoMessage(raw);
  }

  if (kind === "campaign_event" || kind === "campaignEvent") {
    return parseCampaignEventMessage(raw);
  }

  if (kind === "notification" || kind === "ocp_notification") {
    return parseNotificationMessage(raw);
  }

  return "unknown_message_kind";
}
