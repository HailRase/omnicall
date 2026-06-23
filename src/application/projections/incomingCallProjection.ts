import type { DomainEvent } from "@domain/index.js";

export type IncomingCallUiState =
  | "noIncomingCall"
  | "incomingRinging"
  | "callerIdentityLoading"
  | "callerIdentityResolved"
  | "queueInfoPending"
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
  queueInfo: string | null;
  uiState: IncomingCallUiState;
  autoAnswerSecondsRemaining: number | null;
  rejectReasonRequired: boolean;
  selectedBreakReason: string | null;
  ringingIndicator: "idle" | "ringing";
}>;

export function initialIncomingCallProjection(): IncomingCallProjection {
  return {
    visible: false,
    callId: null,
    callerNumber: null,
    displayName: null,
    queueInfo: null,
    uiState: "noIncomingCall",
    autoAnswerSecondsRemaining: null,
    rejectReasonRequired: false,
    selectedBreakReason: null,
    ringingIndicator: "idle",
  };
}

export function reduceIncomingCallProjection(
  projection: IncomingCallProjection,
  event: DomainEvent,
): IncomingCallProjection {
  switch (event.type) {
    case "IncomingCallReceived":
      return {
        ...projection,
        visible: true,
        callId: asOptionalString(event["callId"]),
        callerNumber: asOptionalString(event["phoneNumber"]),
        uiState: "callerIdentityLoading",
        queueInfo: null,
        selectedBreakReason: null,
      };
    case "IncomingCallRingingStarted":
      return {
        ...projection,
        visible: true,
        ringingIndicator: "ringing",
        autoAnswerSecondsRemaining: asOptionalNumber(event["autoAnswerTimeoutSec"]),
        uiState:
          asOptionalNumber(event["autoAnswerTimeoutSec"]) !== null
            ? "autoAnswerCountdown"
            : "incomingRinging",
      };
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
      };
    case "CallAnswered":
      return {
        ...projection,
        visible: false,
        uiState: "noIncomingCall",
        ringingIndicator: "idle",
        autoAnswerSecondsRemaining: null,
      };
    case "CallRejected":
      return {
        ...projection,
        visible: false,
        uiState: "noIncomingCall",
        ringingIndicator: "idle",
        autoAnswerSecondsRemaining: null,
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
        autoAnswerSecondsRemaining: null,
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
