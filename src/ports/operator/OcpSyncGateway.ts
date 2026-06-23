import type { CampaignDecision } from "@domain/operator/events/campaignEvents.js";
import type { OcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import type { CallId } from "@domain/telephony/CallId.js";
import type { MainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type RespondToCampaignCommand = Readonly<{
  campaignId: string;
  decision: CampaignDecision;
  correlationId: CorrelationId;
}>;

export type RespondToCampaignResult =
  | Readonly<{ status: "succeeded" }>
  | Readonly<{ status: "failed"; reason: string; message: string }>;

export type SendDlgStopCommand = Readonly<{
  callId: CallId;
  mainAcallId: MainAcallId;
  correlationId: CorrelationId;
}>;

export type SendDlgStopResult =
  | Readonly<{ status: "succeeded" }>
  | Readonly<{ status: "failed"; reason: string; message: string }>;

/**
 * - Purpose: parse inbound OCP sync WebSocket messages and send campaign responses.
 * - Inputs: raw unknown payload from transport; campaign respond commands.
 * - Outputs: typed OcpInboundMessage or null; respond result.
 */
export interface OcpSyncGateway {
  parseInboundMessage(raw: unknown): OcpInboundMessage | null;
  respondToCampaign(command: RespondToCampaignCommand): Promise<RespondToCampaignResult>;
  sendDlgStop(command: SendDlgStopCommand): Promise<SendDlgStopResult>;
}
