/**
 * - Purpose: pure UI view-model for OCP queue + campaign badges on call surfaces.
 * - Inputs: per-call OCP context, campaign projection, remote phone for match.
 * - Outputs: ordered badge descriptors (empty = render nothing).
 */

import type { CampaignEventProjection } from "./campaignEventProjection.js";
import type { CallOcpContextEntry } from "./callOcpContextProjection.js";

export type CallContextBadgeKind =
  | "queue"
  | "queuePending"
  | "progressive"
  | "company"
  | "selection";

export type CallContextBadge = Readonly<{
  kind: CallContextBadgeKind;
  /** Present for text badges; absent for pending skeleton. */
  value?: string;
}>;

export type DeriveCallContextBadgesInput = Readonly<{
  callId: string | null;
  remotePhone: string | null;
  /** When false, all badges hidden (SIP-only / OCP offline). */
  ocpAuthenticated: boolean;
  entry: CallOcpContextEntry | null;
  campaign: CampaignEventProjection;
}>;

function phonesMatch(a: string | null, b: string | null): boolean {
  if (a === null || b === null) {
    return false;
  }
  return a.trim() === b.trim();
}

function pickCampaignContext(
  campaign: CampaignEventProjection,
  callId: string | null,
  remotePhone: string | null,
): NonNullable<CampaignEventProjection["progressiveContext"]> | null {
  const item = campaign.progressiveContext;
  if (item === null) {
    return null;
  }
  if (callId !== null && item.callId === callId) {
    return item;
  }
  if (phonesMatch(item.clientPhone, remotePhone)) {
    return item;
  }
  // Progressive context is global until SIP call arrives (legacy parity).
  return item;
}

/**
 * Queue badge only for incoming ACD calls with a non-empty queue name.
 * Campaign badges from progressive (or matched) campaign payload.
 * One queue label: OCP calls.queue wins over campaign.queueTitle.
 */
export function deriveCallContextBadges(
  input: DeriveCallContextBadgesInput,
): ReadonlyArray<CallContextBadge> {
  if (!input.ocpAuthenticated) {
    return [];
  }

  const badges: CallContextBadge[] = [];
  const campaignCtx = pickCampaignContext(
    input.campaign,
    input.callId,
    input.remotePhone,
  );

  const entry = input.entry;
  const isIncoming = entry?.direction === "incoming";
  let queueShown = false;

  if (isIncoming && entry !== undefined && entry !== null) {
    if (entry.resolveState === "pending") {
      badges.push({ kind: "queuePending" });
      queueShown = true;
    } else if (
      entry.resolveState === "resolved" &&
      entry.queueName !== null &&
      entry.queueName.length > 0
    ) {
      badges.push({ kind: "queue", value: entry.queueName });
      queueShown = true;
    }
  }

  if (campaignCtx !== null) {
    if (
      !queueShown &&
      campaignCtx.queueTitle.trim().length > 0 &&
      (isIncoming || phonesMatch(campaignCtx.clientPhone, input.remotePhone))
    ) {
      badges.push({ kind: "queue", value: campaignCtx.queueTitle.trim() });
      queueShown = true;
    }
    if (campaignCtx.progressive) {
      badges.push({ kind: "progressive" });
    }
    if (campaignCtx.companyTitle.trim().length > 0) {
      badges.push({ kind: "company", value: campaignCtx.companyTitle.trim() });
    }
    if (campaignCtx.selectionTitle.trim().length > 0) {
      badges.push({ kind: "selection", value: campaignCtx.selectionTitle.trim() });
    }
  }

  void queueShown;
  return badges;
}
