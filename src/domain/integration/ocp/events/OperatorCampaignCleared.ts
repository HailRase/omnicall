/**
 * - Purpose: domain signal when an active OCP campaign offer is cleared.
 * - Public SDK: maps to operator:campaign-cleared.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type OperatorCampaignClearReason =
  | "accepted"
  | "rejected"
  | "call_ended"
  | "session_reset"
  | "superseded";

export type OperatorCampaignClearedEvent = ReturnType<
  typeof createOperatorCampaignClearedEvent
>;

export function createOperatorCampaignClearedEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    campaignId: string;
    reasonCode?: OperatorCampaignClearReason;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "OperatorCampaignCleared",
    {
      campaignId: string;
      reasonCode?: OperatorCampaignClearReason;
      featureId: typeof OCP_FEATURE_ID;
    }
  >
> {
  return createDomainEvent("OperatorCampaignCleared", correlationId, {
    campaignId: input.campaignId,
    ...(input.reasonCode !== undefined ? { reasonCode: input.reasonCode } : {}),
    featureId: OCP_FEATURE_ID,
  });
}
