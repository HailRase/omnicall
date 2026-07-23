/**
 * Map Domain Events → public SDK event drafts (DI-05).
 * Never forwards Domain JSON; campaign events are omitted (ADR-0017 O-CAMP-1).
 * OperatorLoggedOut is omitted when OperatorSessionEnded already covers disconnect.
 * Post-call reservation is additive on operator:status-changed (reservedTarget).
 */

import type { DomainEvent } from "@domain/index.js";
import {
  isOperatorStatus,
  OPERATOR_STATUS_LABEL_KEY,
} from "@domain/integration/ocp/OperatorStatus.js";
import type { WireJsonObject } from "@axata/axatalk-protocol";

import {
  mapSdkOperatorStatus,
  mapSdkReservedOperatorTarget,
  type SdkPublicOperatorStatus,
  type SdkPublicReservedTarget,
} from "./mapSdkOperatorStatus.js";
import { mapSdkPublicCallState } from "./mapSdkPublicCallState.js";
import { mapSdkRegistrationState } from "./mapSdkRegistrationState.js";
import {
  redactDisplayNameForSdk,
  redactPhoneForSdk,
} from "./sdkPrivacyRedaction.js";

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
    | "registration:changed"
    | "account:session-activated"
    | "account:session-ended"
    | "operator:status-changed"
    | "operator:session-changed";
  payload: WireJsonObject;
}>;

/**
 * Projection context for operator drafts (reservation is not on Domain Event alone).
 */
export type SdkOperatorEventMapContext = Readonly<{
  currentStatus?: SdkPublicOperatorStatus;
  reservedTarget?: SdkPublicReservedTarget | null;
  reservedReasonId?: number | null;
}>;

/**
 * Returns null when the Domain Event has no public SDK counterpart.
 */
export function mapDomainEventToSdkPublicDraft(
  event: DomainEvent,
  context: SdkOperatorEventMapContext = {},
): SdkPublicEventDraft | null {
  switch (event.type) {
    case "IncomingCallReceived":
      return callDraft("call:incoming", event, "ringing", "inbound");
    case "OutgoingCallRequested":
      return callDraft("call:outgoing", event, "connecting", "outbound");
    case "CallProgressReceived":
      return callDraft("call:ringing", event, "connecting", "outbound");
    case "CallAnswered":
      return callDraft("call:answered", event, "active");
    case "CallEnded":
      return callDraft("call:ended", event, "ended");
    case "CallFailed":
      return callDraft("call:failed", event, "failed");
    case "CallHeld":
      return callDraft("call:held", event, "held");
    case "CallResumed":
      return callDraft("call:resumed", event, "active");
    case "CallMuted":
      return callDraft("call:muted", event, "active");
    case "CallUnmuted":
      return callDraft("call:unmuted", event, "active");
    case "RegistrationSucceeded":
      return {
        type: "registration:changed",
        payload: { state: "registered" },
      };
    case "RegistrationFailed":
      return {
        type: "registration:changed",
        payload: { state: "failed" },
      };
    case "SipRegistrationCleared":
      return {
        type: "registration:changed",
        payload: { state: mapSdkRegistrationState("idle") },
      };
    case "UserSessionEnded":
      return {
        type: "account:session-ended",
        payload: { reasonCode: "ended" },
      };
    case "AccountSessionActivated":
      return {
        type: "account:session-activated",
        payload: optionalProfileLabel(event),
      };
    case "OperatorStatusChanged":
      return operatorStatusDraft(event, context);
    case "OperatorStatusReservationSet":
      return operatorReservationDraft(event, context);
    case "OperatorSessionStarted":
      return {
        type: "operator:session-changed",
        payload: { connected: true },
      };
    case "OperatorSessionEnded":
      return {
        type: "operator:session-changed",
        payload: { connected: false },
      };
    default:
      return null;
  }
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

function callDraft(
  type: SdkPublicEventDraft["type"],
  event: DomainEvent,
  state: string,
  direction?: "inbound" | "outbound",
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
    },
  };
}

function optionalProfileLabel(event: DomainEvent): WireJsonObject {
  const label = readString(event, "profileKey");
  return label !== null ? { profileLabel: label.slice(0, 128) } : {};
}

function readString(event: DomainEvent, key: string): string | null {
  const value = event[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
