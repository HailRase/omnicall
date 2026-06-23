import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallId } from "../../telephony/CallId.js";
import type { MainAcallId } from "../ocp/MainAcallId.js";

export type CampaignDecision = "accept" | "reject";

export type CampaignEventReceivedEvent = ReturnType<typeof createCampaignEventReceivedEvent>;
export type CampaignEventAnsweredEvent = ReturnType<typeof createCampaignEventAnsweredEvent>;

/**
 * - Purpose: campaign metadata arrived from OCP inbound sync (LF-038 prep).
 * - Inputs: correlationId, campaign fields, optional matched callId.
 * - Outputs: CampaignEventReceived domain event.
 */
export function createCampaignEventReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    campaignId: string;
    title: string;
    mainAcallId: MainAcallId | null;
    progressive: boolean;
    callId: CallId | null;
  }>,
) {
  return createDomainEvent("CampaignEventReceived", correlationId, payload);
}

/**
 * - Purpose: record operator accept/reject decision for a campaign request (LF-040).
 * - Inputs: correlationId, campaignId, decision, optional callId.
 * - Outputs: CampaignEventAnswered domain event.
 */
export function createCampaignEventAnsweredEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    campaignId: string;
    decision: CampaignDecision;
    callId: CallId | null;
  }>,
) {
  return createDomainEvent("CampaignEventAnswered", correlationId, payload);
}
