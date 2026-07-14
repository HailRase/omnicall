/**
 * - Purpose: hold the active OCP campaign invite for accept/reject UI.
 * - Inputs: campaign_events entity payloads or clear signals.
 * - Outputs: serializable active campaign snapshot.
 */

import type { OcpCampaignEventPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

export type CampaignEventProjection = Readonly<{
  activeCampaign: OcpCampaignEventPayload | null;
}>;

export function initialCampaignEventProjection(): CampaignEventProjection {
  return {
    activeCampaign: null,
  };
}

export function reduceCampaignEventFromPayload(
  payload: OcpCampaignEventPayload,
): CampaignEventProjection {
  return {
    activeCampaign: payload,
  };
}

export function clearCampaignEvent(): CampaignEventProjection {
  return {
    activeCampaign: null,
  };
}
