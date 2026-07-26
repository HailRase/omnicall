/**
 * Hook: raise shell window when OCP preview campaign requires Accept/Reject.
 * Progressive campaign (badges only) does not raise — no blocking modal.
 * Renderer observes projection only; native raise runs in main via IPC (ADR-0013).
 */

import { useEffect, useRef } from "react";
import type { CampaignEventProjection } from "@application/index.js";
import type { ShellWindowRaisePayload } from "@shared/ipc/ShellWindowRaiseContract.js";

type UseShellWindowAttentionFromCampaignInput = Readonly<{
  campaignEventProjection: CampaignEventProjection;
  raiseWindow?: (payload: ShellWindowRaisePayload) => Promise<unknown>;
}>;

function defaultRaiseWindow(payload: ShellWindowRaisePayload): Promise<unknown> {
  return window.softphone.raiseShellWindow(payload);
}

/**
 * Edge-trigger raise once per preview campaign id (`activeCampaign.id`).
 */
export function useShellWindowAttentionFromCampaign(
  input: UseShellWindowAttentionFromCampaignInput,
): void {
  const raiseWindow = input.raiseWindow ?? defaultRaiseWindow;
  const raisedCampaignRef = useRef<string | null>(null);

  const campaignOfferId =
    input.campaignEventProjection.activeCampaign !== null
      ? input.campaignEventProjection.activeCampaign.id
      : null;

  useEffect(() => {
    if (campaignOfferId === null) {
      raisedCampaignRef.current = null;
      return;
    }
    if (raisedCampaignRef.current === campaignOfferId) {
      return;
    }
    raisedCampaignRef.current = campaignOfferId;
    void raiseWindow({
      reason: "ocp_campaign_offer",
      dedupeKey: campaignOfferId,
    });
  }, [campaignOfferId, raiseWindow]);
}
