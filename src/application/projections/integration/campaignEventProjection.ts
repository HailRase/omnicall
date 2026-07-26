/**
 * - Purpose: OCP campaign invite projection with single-modal FSM (idle → offered).
 * - Inputs: campaign_events payloads or clear/promote signals.
 * - Outputs: preview modal slot, progressive badges, at-most-one pending preview.
 *
 * Invariant: only one preview modal at a time. A second preview while offered is
 * held in `pendingPreview` until accept/reject/clear promotes it (no supersede wipe).
 */

import type { OcpCampaignEventPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

/** UX phase for docs/tests; idle = nothing visible for modal/progressive badges. */
export type CampaignOfferUiPhase =
  | "idle"
  | "preview_offered"
  | "progressive_offered";

export type CampaignEventProjection = Readonly<{
  phase: CampaignOfferUiPhase;
  /** Non-progressive preview — blocking accept/reject modal. */
  activeCampaign: OcpCampaignEventPayload | null;
  /** Progressive dial — badges only; no modal. */
  progressiveContext: OcpCampaignEventPayload | null;
  /** Next preview held while modal still open (single slot). */
  pendingPreview: OcpCampaignEventPayload | null;
}>;

export type CampaignReduceOutcome =
  | Readonly<{ kind: "offered"; payload: OcpCampaignEventPayload }>
  | Readonly<{ kind: "updated"; payload: OcpCampaignEventPayload }>
  | Readonly<{
      kind: "held";
      activeId: string;
      pendingId: string;
    }>
  | Readonly<{
      kind: "progressive";
      payload: OcpCampaignEventPayload;
      /** True when no preview modal is open — safe to emit public Offered. */
      emitOffered: boolean;
    }>;

export type CampaignClearResult = Readonly<{
  projection: CampaignEventProjection;
  /** Cleared visible offer id (preview preferred, else progressive). */
  clearedId: string | null;
  /** Promoted from pending after clear; already placed in `activeCampaign`. */
  promoted: OcpCampaignEventPayload | null;
}>;

export function initialCampaignEventProjection(): CampaignEventProjection {
  return {
    phase: "idle",
    activeCampaign: null,
    progressiveContext: null,
    pendingPreview: null,
  };
}

export function deriveCampaignOfferPhase(
  projection: Readonly<{
    activeCampaign: OcpCampaignEventPayload | null;
    progressiveContext: OcpCampaignEventPayload | null;
  }>,
): CampaignOfferUiPhase {
  if (projection.activeCampaign !== null) {
    return "preview_offered";
  }
  if (projection.progressiveContext !== null) {
    return "progressive_offered";
  }
  return "idle";
}

/**
 * Apply a campaign_events payload onto prior projection (single-modal hold).
 */
export function reduceCampaignEventFromPayload(
  previous: CampaignEventProjection,
  payload: OcpCampaignEventPayload,
): Readonly<{
  projection: CampaignEventProjection;
  outcome: CampaignReduceOutcome;
}> {
  if (payload.progressive) {
    const projection: CampaignEventProjection = {
      activeCampaign: previous.activeCampaign,
      progressiveContext: payload,
      pendingPreview: previous.pendingPreview,
      phase: deriveCampaignOfferPhase({
        activeCampaign: previous.activeCampaign,
        progressiveContext: payload,
      }),
    };
    return {
      projection,
      outcome: {
        kind: "progressive",
        payload,
        emitOffered: previous.activeCampaign === null,
      },
    };
  }

  if (previous.activeCampaign !== null) {
    if (previous.activeCampaign.id === payload.id) {
      const projection: CampaignEventProjection = {
        ...previous,
        activeCampaign: payload,
        phase: "preview_offered",
      };
      return { projection, outcome: { kind: "updated", payload } };
    }
    const projection: CampaignEventProjection = {
      ...previous,
      pendingPreview: payload,
      phase: "preview_offered",
    };
    return {
      projection,
      outcome: {
        kind: "held",
        activeId: previous.activeCampaign.id,
        pendingId: payload.id,
      },
    };
  }

  const projection: CampaignEventProjection = {
    activeCampaign: payload,
    progressiveContext: null,
    pendingPreview: null,
    phase: "preview_offered",
  };
  return { projection, outcome: { kind: "offered", payload } };
}

/**
 * Clear visible offer; promote pending preview when present → still offered.
 * Otherwise return idle.
 */
export function clearCampaignEvent(
  previous: CampaignEventProjection = initialCampaignEventProjection(),
): CampaignClearResult {
  const clearedId =
    previous.activeCampaign?.id ?? previous.progressiveContext?.id ?? null;
  if (previous.pendingPreview !== null) {
    const promoted = previous.pendingPreview;
    return {
      clearedId,
      promoted,
      projection: {
        phase: "preview_offered",
        activeCampaign: promoted,
        progressiveContext: null,
        pendingPreview: null,
      },
    };
  }
  return {
    clearedId,
    promoted: null,
    projection: initialCampaignEventProjection(),
  };
}
