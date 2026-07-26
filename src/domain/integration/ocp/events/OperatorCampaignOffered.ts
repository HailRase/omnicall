/**
 * - Purpose: domain signal when an OCP campaign offer becomes active.
 * - Public SDK: maps to operator:campaign-offered (redacted in Application).
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type OperatorCampaignOfferedEvent = ReturnType<
  typeof createOperatorCampaignOfferedEvent
>;

export function createOperatorCampaignOfferedEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    campaignId: string;
    progressive: boolean;
    clientPhone: string;
    companyTitle: string;
    strategyTitle: string;
    selectionTitle: string;
    queueTitle: string;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "OperatorCampaignOffered",
    {
      campaignId: string;
      progressive: boolean;
      clientPhone: string;
      companyTitle: string;
      strategyTitle: string;
      selectionTitle: string;
      queueTitle: string;
      featureId: typeof OCP_FEATURE_ID;
    }
  >
> {
  return createDomainEvent("OperatorCampaignOffered", correlationId, {
    campaignId: input.campaignId,
    progressive: input.progressive,
    clientPhone: input.clientPhone,
    companyTitle: input.companyTitle,
    strategyTitle: input.strategyTitle,
    selectionTitle: input.selectionTitle,
    queueTitle: input.queueTitle,
    featureId: OCP_FEATURE_ID,
  });
}
