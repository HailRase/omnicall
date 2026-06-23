import type { DomainEvent } from "@domain/index.js";
import { createCallId, type CallId } from "@domain/telephony/CallId.js";

export type CampaignContextState = "hidden" | "none" | "context_ready";

export type CampaignContext = Readonly<{
  campaignId: string;
  title: string;
  progressive: boolean;
}>;

export type CampaignProjection = Readonly<{
  isOcpSyncAvailable: boolean;
  campaignByCallId: ReadonlyMap<string, CampaignContext>;
}>;

export const initialCampaignProjection = (): CampaignProjection => ({
  isOcpSyncAvailable: false,
  campaignByCallId: new Map(),
});

/**
 * - Purpose: project campaign metadata by callId for incoming modal prep (LF-038).
 * - Inputs: domain events including CampaignEventReceived.
 * - Outputs: immutable campaign read model.
 */
export function reduceCampaignProjection(
  projection: CampaignProjection,
  event: DomainEvent,
): CampaignProjection {
  switch (event.type) {
    case "StartupModeResolved": {
      const resolution = event["resolution"];
      if (
        resolution !== undefined &&
        typeof resolution === "object" &&
        resolution !== null &&
        "action" in resolution &&
        resolution.action === "sip_only_ready"
      ) {
        return initialCampaignProjection();
      }
      return projection;
    }
    case "OcpAuthenticationSucceeded":
      return { ...projection, isOcpSyncAvailable: true };
    case "OcpAuthenticationFailed":
      return { ...initialCampaignProjection(), isOcpSyncAvailable: false };
    case "CampaignEventReceived": {
      const callId = parseCallId(event["callId"]);
      if (callId === null) {
        return projection;
      }
      const campaignId = asOptionalString(event["campaignId"]);
      const title = asOptionalString(event["title"]);
      if (campaignId === null || title === null) {
        return projection;
      }
      const progressive = event["progressive"] === true;
      return setCampaign(projection, callId, { campaignId, title, progressive });
    }
    case "CallEnded":
    case "IncomingCallEndedBeforeAnswer": {
      const callId = parseCallId(event["callId"]);
      if (callId === null) {
        return projection;
      }
      return clearCampaign(projection, callId);
    }
    case "CampaignEventAnswered": {
      const callId = parseCallId(event["callId"]);
      if (callId === null) {
        return projection;
      }
      return clearCampaign(projection, callId);
    }
    default:
      return projection;
  }
}

export function getCampaignForCall(
  projection: CampaignProjection,
  callId: CallId | string | null,
): CampaignContext | null {
  if (callId === null || callId.length === 0) {
    return null;
  }
  return projection.campaignByCallId.get(callId) ?? null;
}

export function deriveCampaignContextState(
  projection: CampaignProjection,
  callId: CallId | string | null,
): CampaignContextState {
  if (!projection.isOcpSyncAvailable) {
    return "hidden";
  }
  if (callId === null || callId.length === 0) {
    return "none";
  }
  return getCampaignForCall(projection, callId) !== null ? "context_ready" : "none";
}

function setCampaign(
  projection: CampaignProjection,
  callId: CallId,
  context: CampaignContext,
): CampaignProjection {
  const nextMap = new Map(projection.campaignByCallId);
  nextMap.set(callId, context);
  return { ...projection, campaignByCallId: nextMap };
}

function clearCampaign(
  projection: CampaignProjection,
  callId: CallId,
): CampaignProjection {
  if (!projection.campaignByCallId.has(callId)) {
    return projection;
  }
  const nextMap = new Map(projection.campaignByCallId);
  nextMap.delete(callId);
  return { ...projection, campaignByCallId: nextMap };
}

function parseCallId(value: unknown): CallId | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return createCallId(value);
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
