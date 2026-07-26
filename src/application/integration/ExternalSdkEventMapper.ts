/**
 * Map Domain Events → public SDK event drafts (DI-05).
 * Never forwards Domain JSON or OCP wire objects.
 * Campaign offers map to operator:campaign-* (ADR-0019); phone/labels redacted.
 * OperatorLoggedOut is omitted when OperatorSessionEnded already covers disconnect.
 * Post-call reservation is additive on operator:status-changed (reservedTarget).
 * OCP ACD: `call:acd-context` carries MainCallIDInfo wire fields (ADR-0020);
 * additive `queueLabel` on call:* stays desktop-safe (no wire ids).
 */

import type { DomainEvent } from "@domain/index.js";
import {
  isOperatorStatus,
  OPERATOR_STATUS_LABEL_KEY,
} from "@domain/integration/ocp/OperatorStatus.js";
import { OpaqueIdSchema, type WireJsonObject } from "@axata/axatalk-protocol";

import {
  mapSdkOperatorStatus,
  mapSdkReservedOperatorTarget,
  type SdkPublicOperatorStatus,
  type SdkPublicReservedTarget,
} from "./mapSdkOperatorStatus.js";
import {
  mapSdkPublicCallState,
  type SdkPublicCallState,
} from "./mapSdkPublicCallState.js";
import { mapSdkRegistrationState } from "./mapSdkRegistrationState.js";
import { mapSdkCampaignOfferedPayload } from "./mapSdkCampaignPayload.js";
import {
  redactDisplayNameForSdk,
  redactPhoneForSdk,
} from "./sdkPrivacyRedaction.js";
import type { SdkProductCallLine } from "./ExternalSdkProductState.js";

export type SdkPublicEventDraft = Readonly<{
  type:
    | "call:incoming"
    | "call:outgoing"
    | "call:ringing"
    | "call:answered"
    | "call:ended"
    | "call:failed"
    | "call:held"
    | "call:resumed"
    | "call:muted"
    | "call:unmuted"
    | "call:acd-context"
    | "registration:changed"
    | "account:session-activated"
    | "account:session-ended"
    | "operator:status-changed"
    | "operator:session-changed"
    | "operator:campaign-offered"
    | "operator:campaign-cleared";
  payload: WireJsonObject;
}>;

/**
 * Projection context for operator drafts (reservation is not on Domain Event alone)
 * and optional per-call ACD queue labels from CallOcpContextProjection.
 */
export type SdkOperatorEventMapContext = Readonly<{
  currentStatus?: SdkPublicOperatorStatus;
  reservedTarget?: SdkPublicReservedTarget | null;
  reservedReasonId?: number | null;
  /** Non-empty queue labels keyed by opaque SIP callId. */
  queueLabelByCallId?: Readonly<Record<string, string>>;
  /** Live call lines — used to pick public call:* type on queue resolve. */
  callLines?: readonly SdkProductCallLine[];
}>;

/**
 * Returns all public drafts for a Domain Event (0+). Prefer this when one Domain
 * Event may fan out to multiple protocol events (e.g. ACD context).
 */
export function mapDomainEventToSdkPublicDrafts(
  event: DomainEvent,
  context: SdkOperatorEventMapContext = {},
): readonly SdkPublicEventDraft[] {
  switch (event.type) {
    case "IncomingCallReceived": {
      const draft = callDraft(
        "call:incoming",
        event,
        "ringing",
        "inbound",
        context,
      );
      return draft === null ? [] : [draft];
    }
    case "OutgoingCallRequested": {
      const draft = callDraft(
        "call:outgoing",
        event,
        "connecting",
        "outbound",
        context,
      );
      return draft === null ? [] : [draft];
    }
    case "CallProgressReceived": {
      const draft = callDraft(
        "call:ringing",
        event,
        "connecting",
        "outbound",
        context,
      );
      return draft === null ? [] : [draft];
    }
    case "CallAnswered": {
      const draft = callDraft(
        "call:answered",
        event,
        "active",
        undefined,
        context,
      );
      return draft === null ? [] : [draft];
    }
    case "CallEnded": {
      const draft = callDraft("call:ended", event, "ended", undefined, context);
      return draft === null ? [] : [draft];
    }
    case "CallFailed": {
      const draft = callDraft(
        "call:failed",
        event,
        "failed",
        undefined,
        context,
      );
      return draft === null ? [] : [draft];
    }
    case "CallHeld": {
      const draft = callDraft("call:held", event, "held", undefined, context);
      return draft === null ? [] : [draft];
    }
    case "CallResumed": {
      const draft = callDraft(
        "call:resumed",
        event,
        "active",
        undefined,
        context,
      );
      return draft === null ? [] : [draft];
    }
    case "CallMuted": {
      const draft = callDraft("call:muted", event, "active", undefined, context);
      return draft === null ? [] : [draft];
    }
    case "CallUnmuted": {
      const draft = callDraft(
        "call:unmuted",
        event,
        "active",
        undefined,
        context,
      );
      return draft === null ? [] : [draft];
    }
    case "CallOcpContextResolved":
      return callOcpContextResolvedDrafts(event, context);
    case "RegistrationSucceeded":
      return [{ type: "registration:changed", payload: { state: "registered" } }];
    case "RegistrationFailed":
      return [{ type: "registration:changed", payload: { state: "failed" } }];
    case "SipRegistrationCleared":
      return [
        {
          type: "registration:changed",
          payload: { state: mapSdkRegistrationState("idle") },
        },
      ];
    case "UserSessionEnded":
      return [
        { type: "account:session-ended", payload: { reasonCode: "ended" } },
      ];
    case "AccountSessionActivated":
      return [
        {
          type: "account:session-activated",
          payload: optionalProfileLabel(event),
        },
      ];
    case "OperatorStatusChanged": {
      const draft = operatorStatusDraft(event, context);
      return draft === null ? [] : [draft];
    }
    case "OperatorStatusReservationSet": {
      const draft = operatorReservationDraft(event, context);
      return draft === null ? [] : [draft];
    }
    case "OperatorSessionStarted":
      return [
        { type: "operator:session-changed", payload: { connected: true } },
      ];
    case "OperatorSessionEnded":
      return [
        { type: "operator:session-changed", payload: { connected: false } },
      ];
    case "OperatorCampaignOffered": {
      const draft = operatorCampaignOfferedDraft(event);
      return draft === null ? [] : [draft];
    }
    case "OperatorCampaignCleared": {
      const draft = operatorCampaignClearedDraft(event);
      return draft === null ? [] : [draft];
    }
    default:
      return [];
  }
}

/**
 * Returns the first public draft, or null. Prefer `mapDomainEventToSdkPublicDrafts`
 * when a Domain Event may emit more than one protocol event.
 */
export function mapDomainEventToSdkPublicDraft(
  event: DomainEvent,
  context: SdkOperatorEventMapContext = {},
): SdkPublicEventDraft | null {
  const drafts = mapDomainEventToSdkPublicDrafts(event, context);
  return drafts[0] ?? null;
}

function operatorStatusDraft(
  event: DomainEvent,
  context: SdkOperatorEventMapContext,
): SdkPublicEventDraft | null {
  const newStatusRaw = event["newStatus"];
  if (!isOperatorStatus(newStatusRaw)) {
    return null;
  }
  const status = mapSdkOperatorStatus(newStatusRaw);
  const reasonIdRaw = event["reasonId"];
  const reasonId =
    typeof reasonIdRaw === "number" &&
    Number.isInteger(reasonIdRaw) &&
    reasonIdRaw >= 0
      ? reasonIdRaw
      : undefined;
  const reasonLabelKey = OPERATOR_STATUS_LABEL_KEY[newStatusRaw];
  return {
    type: "operator:status-changed",
    payload: {
      status,
      ...(reasonId !== undefined ? { reasonId } : {}),
      reasonLabelKey: reasonLabelKey.slice(0, 128),
      ...reservedPayload(context),
    },
  };
}

function operatorReservationDraft(
  event: DomainEvent,
  context: SdkOperatorEventMapContext,
): SdkPublicEventDraft | null {
  const reservedStatusRaw = event["reservedStatus"];
  if (!isOperatorStatus(reservedStatusRaw)) {
    return null;
  }
  const reservedTarget = mapSdkReservedOperatorTarget(reservedStatusRaw);
  if (reservedTarget === null) {
    return null;
  }
  const status = context.currentStatus ?? "unknown";
  const reservedReasonIdRaw = event["reservedReasonId"];
  const reservedReasonId =
    typeof reservedReasonIdRaw === "number" &&
    Number.isInteger(reservedReasonIdRaw) &&
    reservedReasonIdRaw >= 0
      ? reservedReasonIdRaw
      : context.reservedReasonId !== null &&
          context.reservedReasonId !== undefined &&
          context.reservedReasonId >= 0
        ? context.reservedReasonId
        : undefined;
  return {
    type: "operator:status-changed",
    payload: {
      status,
      reservedTarget,
      ...(reservedReasonId !== undefined
        ? { reservedReasonId }
        : {}),
    },
  };
}

function reservedPayload(context: SdkOperatorEventMapContext): WireJsonObject {
  if (context.reservedTarget === null || context.reservedTarget === undefined) {
    return {};
  }
  return {
    reservedTarget: context.reservedTarget,
    ...(context.reservedReasonId !== null &&
    context.reservedReasonId !== undefined &&
    Number.isInteger(context.reservedReasonId) &&
    context.reservedReasonId >= 0
      ? { reservedReasonId: context.reservedReasonId }
      : {}),
  };
}

function callOcpContextResolvedDrafts(
  event: DomainEvent,
  context: SdkOperatorEventMapContext,
): readonly SdkPublicEventDraft[] {
  const callId = readString(event, "callId");
  const localPartyLabel = readString(event, "localPartyLabel");
  const ocp = readOcpWire(event);
  if (callId === null || localPartyLabel === null || ocp === null) {
    return [];
  }
  const directionRaw = readString(event, "direction");
  const direction: "inbound" | "outbound" =
    directionRaw === "outgoing" ? "outbound" : "inbound";
  const phaseRaw = readString(event, "phase");
  const phase: "progress" | "accepted" =
    phaseRaw === "accepted" ? "accepted" : "progress";

  const drafts: SdkPublicEventDraft[] = [
    {
      type: "call:acd-context",
      payload: {
        callId,
        ...(ocp.mainAcallId !== undefined
          ? { main_acallid: ocp.mainAcallId }
          : {}),
        acallid: ocp.acallId,
        event: ocp.event,
        caller_id: ocp.callerId,
        called_id: ocp.calledId,
        queue: ocp.queue,
        user_login: localPartyLabel.slice(0, 128),
        phase,
        direction,
      },
    },
  ];

  const queueLabel = ocp.queue.trim().slice(0, 128);
  if (queueLabel.length === 0) {
    return drafts;
  }
  const line = context.callLines?.find((entry) => entry.callId === callId);
  const typeAndState = resolvePublicCallTypeForQueueEnrichment(line, direction);
  if (typeAndState !== null) {
    drafts.push({
      type: typeAndState.type,
      payload: {
        callId,
        state: typeAndState.state,
        direction,
        queueLabel,
      },
    });
  }
  return drafts;
}

function readOcpWire(event: DomainEvent): Readonly<{
  mainAcallId?: string;
  acallId: string;
  event: string;
  callerId: string;
  calledId: string;
  queue: string;
}> | null {
  const raw = event["ocp"];
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const acallId =
    typeof record["acallId"] === "string" ? record["acallId"].trim() : "";
  const eventName =
    typeof record["event"] === "string" ? record["event"].trim() : "";
  const callerId =
    typeof record["callerId"] === "string" ? record["callerId"].trim() : "";
  const calledId =
    typeof record["calledId"] === "string" ? record["calledId"].trim() : "";
  if (
    acallId.length === 0 ||
    eventName.length === 0 ||
    callerId.length === 0 ||
    calledId.length === 0
  ) {
    return null;
  }
  const queue =
    typeof record["queue"] === "string" ? record["queue"].slice(0, 128) : "";
  const mainRaw = record["mainAcallId"];
  const mainAcallId =
    typeof mainRaw === "string" && mainRaw.trim().length > 0
      ? mainRaw.trim().slice(0, 256)
      : undefined;
  return {
    ...(mainAcallId !== undefined ? { mainAcallId } : {}),
    acallId: acallId.slice(0, 256),
    event: eventName.slice(0, 128),
    callerId: callerId.slice(0, 128),
    calledId: calledId.slice(0, 128),
    queue,
  };
}

function resolvePublicCallTypeForQueueEnrichment(
  line: SdkProductCallLine | undefined,
  direction: "inbound" | "outbound",
): Readonly<{
  type: SdkPublicEventDraft["type"];
  state: SdkPublicCallState;
}> | null {
  if (line !== undefined) {
    const publicState = mapSdkPublicCallState(line.state);
    if (publicState === null || publicState === "ended" || publicState === "failed") {
      return null;
    }
    if (publicState === "held" || publicState === "active" || publicState === "ending") {
      return { type: "call:answered", state: publicState === "ending" ? "active" : publicState };
    }
    if (direction === "inbound") {
      return { type: "call:incoming", state: publicState };
    }
    return {
      type: publicState === "connecting" ? "call:outgoing" : "call:ringing",
      state: publicState,
    };
  }
  if (direction === "inbound") {
    return { type: "call:incoming", state: "ringing" };
  }
  return { type: "call:outgoing", state: "connecting" };
}

function callDraft(
  type: SdkPublicEventDraft["type"],
  event: DomainEvent,
  state: string,
  direction: "inbound" | "outbound" | undefined,
  context: SdkOperatorEventMapContext,
): SdkPublicEventDraft | null {
  const callId = readString(event, "callId");
  if (callId === null) {
    return null;
  }
  const publicState = mapSdkPublicCallState(
    state === "ringing"
      ? "Ringing"
      : state === "connecting"
        ? "Connecting"
        : state === "held"
          ? "Held"
          : state === "ended"
            ? "Ended"
            : state === "failed"
              ? "Failed"
              : "Active",
  );
  if (publicState === null) {
    return null;
  }
  const phone = readString(event, "phoneNumber");
  const display = readString(event, "displayName");
  const queueLabel = context.queueLabelByCallId?.[callId];
  return {
    type,
    payload: {
      callId,
      state: publicState,
      ...(direction !== undefined ? { direction } : {}),
      ...(phone !== null ? { remoteNumber: redactPhoneForSdk(phone) } : {}),
      ...(display !== null
        ? { remoteDisplayName: redactDisplayNameForSdk(display) }
        : {}),
      ...(queueLabel !== undefined && queueLabel.length > 0
        ? { queueLabel: queueLabel.slice(0, 128) }
        : {}),
    },
  };
}

function optionalProfileLabel(event: DomainEvent): WireJsonObject {
  const label = readString(event, "profileKey");
  return label !== null ? { profileLabel: label.slice(0, 128) } : {};
}

function operatorCampaignOfferedDraft(
  event: DomainEvent,
): SdkPublicEventDraft | null {
  const campaignId = readString(event, "campaignId");
  if (campaignId === null) {
    return null;
  }
  const progressive = event["progressive"] === true;
  const payload = mapSdkCampaignOfferedPayload({
    campaignId,
    progressive,
    clientPhone: readString(event, "clientPhone") ?? "",
    companyTitle: readString(event, "companyTitle") ?? "",
    strategyTitle: readString(event, "strategyTitle") ?? "",
    selectionTitle: readString(event, "selectionTitle") ?? "",
    queueTitle: readString(event, "queueTitle") ?? "",
  });
  if (payload === null) {
    return null;
  }
  return {
    type: "operator:campaign-offered",
    payload,
  };
}

function operatorCampaignClearedDraft(
  event: DomainEvent,
): SdkPublicEventDraft | null {
  const campaignId = readString(event, "campaignId");
  if (campaignId === null) {
    return null;
  }
  const campaignIdParsed = OpaqueIdSchema.safeParse(campaignId.trim());
  if (!campaignIdParsed.success) {
    return null;
  }
  const reasonRaw = event["reasonCode"];
  const reasonCode =
    reasonRaw === "accepted" ||
    reasonRaw === "rejected" ||
    reasonRaw === "call_ended" ||
    reasonRaw === "session_reset" ||
    reasonRaw === "superseded"
      ? reasonRaw
      : undefined;
  return {
    type: "operator:campaign-cleared",
    payload: {
      campaignId: campaignIdParsed.data,
      ...(reasonCode !== undefined ? { reasonCode } : {}),
    },
  };
}

function readString(event: DomainEvent, key: string): string | null {
  const value = event[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
