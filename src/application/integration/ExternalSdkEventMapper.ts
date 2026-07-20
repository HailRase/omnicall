/**
 * Map Domain Events → public SDK event drafts (DI-05).
 * Never forwards Domain JSON; campaign events are omitted (ADR-0017 O-CAMP-1).
 */

import type { DomainEvent } from "@domain/index.js";
import type { WireJsonObject } from "@axatalk/protocol";

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
    | "account:session-ended";
  payload: WireJsonObject;
}>;

/**
 * Returns null when the Domain Event has no public SDK counterpart.
 */
export function mapDomainEventToSdkPublicDraft(
  event: DomainEvent,
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
    default:
      return null;
  }
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
