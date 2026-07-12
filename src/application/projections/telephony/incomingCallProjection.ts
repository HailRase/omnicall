import type { DomainEvent } from "@domain/index.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

export type IncomingCallUiState =
  | "noIncomingCall"
  | "incomingRinging"
  | "callerIdentityLoading"
  | "callerIdentityResolved"
  | "rejectReasonRequired"
  | "autoAnswerCountdown"
  | "dndAutoRejecting"
  | "answering"
  | "rejecting"
  | "answerFailed"
  | "rejectFailed"
  | "incomingEndedBeforeAnswer";

export type IncomingCallProjection = Readonly<{
  visible: boolean;
  callId: string | null;
  callerNumber: string | null;
  displayName: string | null;
  uiState: IncomingCallUiState;
  autoAnswerTimeoutSec: number | null;
  autoAnswerExpiresAt: string | null;
  rejectReasonRequired: boolean;
  selectedBreakReason: string | null;
  ringingIndicator: "idle" | "ringing";
  /** null = SDP not yet known; false = audio-only offer; true = video offered. */
  incomingRemoteVideoOffered: boolean | null;
}>;

export function initialIncomingCallProjection(): IncomingCallProjection {
  return {
    visible: false,
    callId: null,
    callerNumber: null,
    displayName: null,
    uiState: "noIncomingCall",
    autoAnswerTimeoutSec: null,
    autoAnswerExpiresAt: null,
    rejectReasonRequired: false,
    selectedBreakReason: null,
    ringingIndicator: "idle",
    incomingRemoteVideoOffered: null,
  };
}

export function reduceIncomingCallProjection(
  projection: IncomingCallProjection,
  event: DomainEvent,
): IncomingCallProjection {
  if (isSessionResetEvent(event)) {
    return initialIncomingCallProjection();
  }

  switch (event.type) {
    case "IncomingCallReceived": {
      const nextCallId = asOptionalString(event["callId"]);
      // Preserve early SDP offered flag only when it arrived before callId was set.
      const preserveEarlyOffered =
        projection.callId === null && projection.incomingRemoteVideoOffered !== null;
      return {
        ...projection,
        visible: true,
        callId: nextCallId,
        callerNumber: asOptionalString(event["phoneNumber"]),
        uiState: "callerIdentityLoading",
        selectedBreakReason: null,
        incomingRemoteVideoOffered: preserveEarlyOffered
          ? projection.incomingRemoteVideoOffered
          : null,
      };
    }
    case "IncomingCallRingingStarted": {
      const autoAnswerTimeoutSec = asOptionalNumber(event["autoAnswerTimeoutSec"]);
      return {
        ...projection,
        visible: true,
        ringingIndicator: "ringing",
        autoAnswerTimeoutSec,
        autoAnswerExpiresAt: asOptionalString(event["autoAnswerExpiresAt"]),
        uiState:
          autoAnswerTimeoutSec !== null ? "autoAnswerCountdown" : "incomingRinging",
      };
    }
    case "IncomingCallDisplayNameResolved":
      return {
        ...projection,
        displayName: asOptionalString(event["displayName"]),
        uiState: "callerIdentityResolved",
      };
    case "CallRejectReasonSelected":
      return {
        ...projection,
        selectedBreakReason: asOptionalString(event["breakReason"]),
      };
    case "CallRejectedByDnd":
      return {
        ...projection,
        visible: false,
        uiState: "dndAutoRejecting",
        ringingIndicator: "idle",
        incomingRemoteVideoOffered: null,
      };
    case "IncomingRemoteVideoOfferedChanged": {
      const callId = asOptionalString(event["callId"]);
      if (callId === null || typeof event["offered"] !== "boolean") {
        return projection;
      }
      // Allow early apply before IncomingCallReceived; ignore events for other calls.
      if (projection.callId !== null && projection.callId !== callId) {
        return projection;
      }
      return {
        ...projection,
        incomingRemoteVideoOffered: event["offered"],
      };
    }
    case "CallAnswered":
      return {
        ...projection,
        visible: false,
        uiState: "noIncomingCall",
        ringingIndicator: "idle",
        autoAnswerTimeoutSec: null,
        autoAnswerExpiresAt: null,
        incomingRemoteVideoOffered: null,
      };
    case "CallRejected":
      return {
        ...projection,
        visible: false,
        uiState: "noIncomingCall",
        ringingIndicator: "idle",
        autoAnswerTimeoutSec: null,
        autoAnswerExpiresAt: null,
        incomingRemoteVideoOffered: null,
      };
    case "IncomingCallEndedBeforeAnswer":
      if (!projection.visible) {
        return projection;
      }
      return {
        ...projection,
        visible: false,
        uiState: "incomingEndedBeforeAnswer",
        ringingIndicator: "idle",
        autoAnswerTimeoutSec: null,
        autoAnswerExpiresAt: null,
        incomingRemoteVideoOffered: null,
      };
    case "CallFailed":
      if (!projection.visible) {
        return projection;
      }
      return {
        ...projection,
        uiState: projection.uiState === "rejecting" ? "rejectFailed" : "answerFailed",
      };
    default:
      return projection;
  }
}

export function setIncomingCallUiState(
  projection: IncomingCallProjection,
  uiState: IncomingCallUiState,
): IncomingCallProjection {
  return { ...projection, uiState };
}

export function setIncomingRejectReasonRequired(
  projection: IncomingCallProjection,
  rejectReasonRequired: boolean,
): IncomingCallProjection {
  return {
    ...projection,
    rejectReasonRequired,
    uiState: rejectReasonRequired ? "rejectReasonRequired" : projection.uiState,
  };
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asOptionalNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}
