/**
 * - Purpose: bind OCP call/campaign projections to CallContextBadges view-model.
 * - Inputs: SIP callId + remote phone for matching.
 * - Outputs: derived badge list (empty when SIP-only or no context).
 */

import { useMemo } from "react";
import { deriveCallContextBadges, type CallContextBadge } from "@application/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

export function useCallContextBadges(
  callId: string | null,
  remotePhone: string | null,
): ReadonlyArray<CallContextBadge> {
  const ocpAuthenticated = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.isAuthenticated,
  );
  const entry = useAccountBootstrapStore((state) =>
    callId === null
      ? null
      : (state.ocpCallContextProjection.byCallId[callId] ?? null),
  );
  const campaign = useAccountBootstrapStore(
    (state) => state.ocpCampaignEventProjection,
  );

  return useMemo(
    () =>
      deriveCallContextBadges({
        callId,
        remotePhone,
        ocpAuthenticated,
        entry,
        campaign,
      }),
    [callId, remotePhone, ocpAuthenticated, entry, campaign],
  );
}
