/**
 * - Purpose: normalize supported committed Domain events into External Services triggers.
 * - Inputs: typed Domain event, active profile identity, focus snapshot, and context tracker.
 * - Outputs: one supported trigger snapshot or null for ignored facts.
 */
import type {
  ExternalServiceTriggerContext,
  SettingsAccountKey,
} from "@domain/index.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import { ExternalServicesCallContextTracker } from "./ExternalServicesCallContextTracker.js";

export type ExternalServiceTriggerMapContext = Readonly<{
  profileKey: SettingsAccountKey;
  userLogin?: string;
  focusedCallId: string | null;
  tracker: ExternalServicesCallContextTracker;
}>;

export type MappedExternalServiceTrigger = Readonly<{
  trigger: ExternalServiceTriggerContext;
  focusedAtEvent: boolean;
}>;

export function mapDomainEventToExternalServiceTrigger(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  switch (event.type) {
    case "IncomingCallReceived":
      return mapIncomingCallReceived(event, context);
    case "IncomingCallRingingStarted":
      return mapCallEvent("incoming_ringing", event, context);
    case "OutgoingCallRequested":
      return mapOutgoingCallRequested(event, context);
    case "CallAnswered":
      return mapCallEvent("call_answered", event, context);
    case "CallEnded":
      return mapTerminalCallEvent("call_ended", event, context);
    case "CallRejected":
      return mapRejectedCall(event, context, readOptionalString(event, "reason") ?? "rejected");
    case "CallRejectedByDnd":
      return mapRejectedCall(event, context, "dnd");
    case "IncomingCallEndedBeforeAnswer":
      return mapRejectedCall(event, context, "missed", "call_missed");
    case "OperatorCampaignOffered":
      return mapCampaignOffered(event, context);
    case "OperatorCampaignCleared":
      return mapCampaignCleared(event, context);
    case "CallOcpContextResolved":
      return mapAcdContext(event, context);
    case "OperatorStatusChanged":
      return mapPostCallProcessing(event, context);
    default:
      return null;
  }
}

function mapIncomingCallReceived(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): null {
  const callId = readRequiredString(event, "callId");
  const phoneNumber = readRequiredString(event, "phoneNumber");
  if (callId !== null && phoneNumber !== null) {
    context.tracker.trackIncoming(callId, phoneNumber, context.userLogin);
  }
  return null;
}

function mapOutgoingCallRequested(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  const callId = readRequiredString(event, "callId");
  const phoneNumber = readRequiredString(event, "phoneNumber");
  if (callId === null || phoneNumber === null) {
    return null;
  }
  context.tracker.trackOutgoing(callId, phoneNumber, context.userLogin);
  return mapCallEvent("outgoing_connecting", event, context);
}

function mapRejectedCall(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
  reason: string,
  eventType: "call_rejected" | "call_missed" = "call_rejected",
): MappedExternalServiceTrigger | null {
  const callId = readRequiredString(event, "callId");
  if (callId !== null) {
    context.tracker.recordTerminalReason(callId, reason);
  }
  const mapped = mapCallEvent(eventType, event, context);
  if (callId !== null) {
    context.tracker.scheduleCallCleanup(callId);
  }
  return mapped;
}

function mapTerminalCallEvent(
  eventType: "call_ended",
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  const callId = readRequiredString(event, "callId");
  const mapped = mapCallEvent(eventType, event, context);
  if (callId !== null) {
    context.tracker.scheduleCallCleanup(callId);
  }
  return mapped;
}

function mapCallEvent(
  eventType:
    | "incoming_ringing"
    | "outgoing_connecting"
    | "call_answered"
    | "call_ended"
    | "call_rejected"
    | "call_missed"
    | "acd_context_appeared",
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  const callId = readRequiredString(event, "callId");
  if (callId === null) {
    return null;
  }
  const call = context.tracker.getCall(callId);
  if (call === null) {
    return null;
  }
  return {
    trigger: {
      eventType,
      occurredAt: event.occurredAt,
      profileKey: context.profileKey,
      callId,
      callerId: call.callerId,
      calledId: call.calledId,
      callDirection: call.direction,
      userLogin: call.userLogin ?? context.userLogin,
      hangupReason: call.hangupReason,
      ...(call.acd !== undefined ? { acd: call.acd } : {}),
    },
    focusedAtEvent: context.focusedCallId === callId,
  };
}

function mapCampaignOffered(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  const campaignId = readRequiredString(event, "campaignId");
  if (campaignId === null) {
    return null;
  }
  const campaign = {
    campaign_id: campaignId,
    campaign_progressive: event["progressive"] === true ? "true" : "false",
    campaign_client_phone: readOptionalString(event, "clientPhone") ?? "",
    campaign_company: readOptionalString(event, "companyTitle") ?? "",
    campaign_strategy: readOptionalString(event, "strategyTitle") ?? "",
    campaign_selection: readOptionalString(event, "selectionTitle") ?? "",
    queue_name: readOptionalString(event, "queueTitle") ?? "",
  };
  context.tracker.cacheCampaign(campaignId, campaign);
  return mapOperatorTrigger("campaign_offered", event, context, campaign);
}

function mapCampaignCleared(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  const campaignId = readRequiredString(event, "campaignId");
  const reason = readOptionalString(event, "reasonCode");
  if (campaignId === null || (reason !== "accepted" && reason !== "rejected")) {
    return null;
  }
  const campaign = context.tracker.takeCampaign(campaignId) ?? {};
  return mapOperatorTrigger(
    reason === "accepted" ? "campaign_accepted" : "campaign_rejected",
    event,
    context,
    campaign,
  );
}

function mapOperatorTrigger(
  eventType: "campaign_offered" | "campaign_accepted" | "campaign_rejected",
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
  campaign: Readonly<Record<string, string>>,
): MappedExternalServiceTrigger {
  return {
    trigger: {
      eventType,
      occurredAt: event.occurredAt,
      profileKey: context.profileKey,
      userLogin: context.userLogin,
      campaign,
    },
    focusedAtEvent: true,
  };
}

function mapPostCallProcessing(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  if (event["newStatus"] !== OperatorStatus.POST_CALL_PROCESSING) {
    return null;
  }
  return {
    trigger: {
      eventType: "post_call_processing",
      occurredAt: event.occurredAt,
      profileKey: context.profileKey,
      ...(context.userLogin !== undefined ? { userLogin: context.userLogin } : {}),
    },
    focusedAtEvent: true,
  };
}

function mapAcdContext(
  event: DomainEvent,
  context: ExternalServiceTriggerMapContext,
): MappedExternalServiceTrigger | null {
  const facts = readAcdFacts(event);
  if (facts === null || !context.tracker.mergeAcd(facts)) {
    return null;
  }
  return mapCallEvent("acd_context_appeared", event, context);
}

function readAcdFacts(
  event: DomainEvent,
): Readonly<{
  callId: string;
  callerId: string;
  calledId: string;
  direction: "inbound" | "outbound";
  userLogin: string;
  queueName: string;
  phase: string;
  event: string;
}> | null {
  const callId = readRequiredString(event, "callId");
  const callerId = readRequiredStringFromRecord(event["ocp"], "callerId");
  const calledId = readRequiredStringFromRecord(event["ocp"], "calledId");
  const acdEvent = readRequiredStringFromRecord(event["ocp"], "event");
  const direction = event["direction"] === "incoming" ? "inbound" : event["direction"] === "outgoing" ? "outbound" : null;
  const userLogin = readRequiredString(event, "localPartyLabel");
  const queueName = readOptionalString(event, "queueName") ?? "";
  const phase = readRequiredString(event, "phase");
  if (
    callId === null ||
    callerId === null ||
    calledId === null ||
    acdEvent === null ||
    direction === null ||
    userLogin === null ||
    phase === null
  ) {
    return null;
  }
  return { callId, callerId, calledId, direction, userLogin, queueName, phase, event: acdEvent };
}

function readRequiredString(event: DomainEvent, key: string): string | null {
  return readOptionalString(event, key) ?? null;
}

function readOptionalString(event: DomainEvent, key: string): string | undefined {
  const value = event[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readRequiredStringFromRecord(
  value: unknown,
  key: string,
): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = (value as Readonly<Record<string, unknown>>)[key];
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}
