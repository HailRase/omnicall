/**
 * - Purpose: map campaign modal disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from campaign action hook.
 * - Outputs: localized label string or null when not campaign-related.
 */
export function mapCampaignModalDisabledReason(reason: string): string | null {
  switch (reason) {
    case "campaign_response_in_progress":
      return "Ответ на кампанию выполняется";
    case "ocp_unavailable":
      return "OCP недоступен";
    default:
      return null;
  }
}

export function mapCampaignModalDisabledReasonWithFallback(
  reason: string,
  fallback = "Действие недоступно",
): string {
  return mapCampaignModalDisabledReason(reason) ?? fallback;
}
