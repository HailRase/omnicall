/**
 * - Purpose: hold OCP campaign invite for preview modal and progressive call badges.
 * - Inputs: campaign_events entity payloads or clear signals.
 * - Outputs: serializable preview (`activeCampaign`) vs progressive context snapshot.
 */

import type { OcpCampaignEventPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

export type CampaignEventProjection = Readonly<{
  /** Non-progressive preview — blocking accept/reject modal. */
  activeCampaign: OcpCampaignEventPayload | null;
  /** Progressive dial — badges only; no modal. */
  progressiveContext: OcpCampaignEventPayload | null;
}>;

export function initialCampaignEventProjection(): CampaignEventProjection {
  return {
    activeCampaign: null,
    progressiveContext: null,
  };
}

/**
 * Routes payload by `progressive`: preview → modal slot; progressive → badge context.
 * Mutually exclusive slots (latest event wins).
 */
export function reduceCampaignEventFromPayload(
  payload: OcpCampaignEventPayload,
): CampaignEventProjection {
  if (payload.progressive) {
    return {
      activeCampaign: null,
      progressiveContext: payload,
    };
  }
  return {
    activeCampaign: payload,
    progressiveContext: null,
  };
}

export function clearCampaignEvent(): CampaignEventProjection {
  return initialCampaignEventProjection();
}
