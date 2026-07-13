/**
 * - Purpose: normalized OCP incoming messages after adapter parsing.
 * - Inputs: parsed wire payloads from OcpGateway.onMessage.
 * - Outputs: entity-discriminated union for Application and projections.
 */

import type { OperatorStatus } from "../OperatorStatus.js";

export type OcpCredsPayload = Readonly<{
  username: string;
  password: string;
  domain: string;
  server: string;
}>;

export type OcpUsersPayload = Readonly<{
  operatorId: number;
  status: OperatorStatus;
  reasonId: number;
  statusSince: string;
}>;

export type OcpStatusReasonPayload = Readonly<{
  id: number;
  parentStatus: OperatorStatus;
  defaultDescription: string;
  timeDelta: number | null;
}>;

export type OcpNotificationType =
  | "preloader"
  | "progress"
  | "success"
  | "error"
  | "warning"
  | "notify"
  | "help";

export type OcpNotificationPosition = "top-left" | "top-right" | "center";

export type OcpNotificationPayload = Readonly<{
  id: string;
  uuid: string | undefined;
  type: OcpNotificationType;
  body: string;
  time: number;
  blocked: boolean;
  deleted: boolean;
  sticky?: boolean;
  position: OcpNotificationPosition;
}>;

export type OcpCampaignEventPayload = Readonly<{
  id: string;
  callId: string;
  queueId: string;
  abonentId: string;
  companyId: string;
  queueTitle: string;
  selectionId: string;
  isAnswered: boolean;
  progressive: boolean;
  clientPhone: string;
  companyTitle: string;
  strategyTitle: string;
  selectionTitle: string;
  strategyCallId: string;
}>;

export type OcpMainCallIdInfoPayload = Readonly<{
  mainAcallId?: string;
  acallId: string;
  event: string;
  callerId: string;
  calledId: string;
  queue: string;
}>;

export type OcpCallIdMappingPayload = Readonly<{
  acallId: string;
  userLogin: string;
}>;

export type OcpCallsPayload = OcpMainCallIdInfoPayload | OcpCallIdMappingPayload;

export type OcpErrorCode = "SESSION_EXIST" | "INVALID_TOKEN" | (string & {});

export type OcpIncomingMessage =
  | Readonly<{ entity: "creds"; data: OcpCredsPayload }>
  | Readonly<{ entity: "users"; data: OcpUsersPayload }>
  | Readonly<{ entity: "operator_status_reasons"; data: ReadonlyArray<OcpStatusReasonPayload> }>
  | Readonly<{ entity: "notification"; data: OcpNotificationPayload }>
  | Readonly<{ entity: "terminate" }>
  | Readonly<{ entity: "campaign_events"; data: OcpCampaignEventPayload }>
  | Readonly<{ entity: "calls"; data: OcpCallsPayload }>
  | Readonly<{ entity: "Error"; data: Readonly<{ code: OcpErrorCode }> }>;
