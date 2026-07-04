import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: map campaign modal disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from campaign action hook.
 * - Outputs: localized label string or null when not campaign-related.
 */
export function mapCampaignModalDisabledReason(reason: string): string | null {
  switch (reason) {
    case "campaign_response_in_progress":
      return translateCurrent("campaign.disabled.responseInProgress");
    case "ocp_unavailable":
      return translateCurrent("campaign.disabled.ocpUnavailable");
    default:
      return null;
  }
}

export function mapCampaignModalDisabledReasonWithFallback(
  reason: string,
  fallback = translateCurrent("common.actionUnavailable"),
): string {
  return mapCampaignModalDisabledReason(reason) ?? fallback;
}
