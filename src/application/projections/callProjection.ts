import type { DomainEvent } from "@domain/index.js";
import type { CallState } from "@domain/index.js";

export type DialpadMode = "number" | "dtmf";
export type DialpadUiState =
  | "idle"
  | "enteringNumber"
  | "invalidNumber"
  | "registeredButEmptyNumber"
  | "calling"
  | "progress"
  | "activeCallDtmfMode"
  | "failedBusy"
  | "failedUnavailable"
  | "failedRejected"
  | "disabledByNotRegistered"
  | "disabledByOcpReserved"
  | "disabledBySecondSessionPolicy"
  | "disabledByHoldAllInProgress";

export type CallProjection = Readonly<{
  activeCallId: string | null;
  state: CallState | "Idle";
  mode: DialpadMode;
  uiState: DialpadUiState;
  lastError: string | null;
  lastDtmfTone: string | null;
  muted: boolean;
  remoteAudioAttached: boolean;
  toneIndicator: "none" | "ringback" | "busy" | "failed";
}>;

/**
 * - Purpose: project domain call events into renderer-ready state.
 * - Inputs: previous projection and domain event stream.
 * - Outputs: immutable call projection for UI components.
 */
export function initialCallProjection(): CallProjection {
  return {
    activeCallId: null,
    state: "Idle",
    mode: "number",
    uiState: "idle",
    lastError: null,
    lastDtmfTone: null,
    muted: false,
    remoteAudioAttached: false,
    toneIndicator: "none",
  };
}

export function reduceCallProjection(
  projection: CallProjection,
  event: DomainEvent,
): CallProjection {
  switch (event.type) {
    case "OutgoingCallRequested":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Connecting",
        uiState: "calling",
        mode: "number",
        lastError: null,
        muted: false,
        toneIndicator: "none",
      };
    case "CallProgressReceived":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Ringing",
        uiState: "progress",
      };
    case "CallAnswered":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Active",
        mode: "dtmf",
        uiState: "activeCallDtmfMode",
      };
    case "CallHeld":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Held",
      };
    case "CallResumed":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Active",
      };
    case "CallHangupRequested":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Ending",
      };
    case "CallMuted":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        muted: true,
      };
    case "CallUnmuted":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        muted: false,
      };
    case "CallFailed":
      return mapFailureState(
        projection,
        asOptionalString(event["callId"]),
        asOptionalString(event["reason"]),
        asOptionalString(event["details"]),
      );
    case "CallEnded":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Ended",
        mode: "number",
        uiState: "idle",
        muted: false,
        toneIndicator: "none",
        remoteAudioAttached: false,
      };
    case "RemoteAudioAttached":
      return {
        ...projection,
        remoteAudioAttached: true,
      };
    case "RingbackToneStarted":
      return {
        ...projection,
        toneIndicator: "ringback",
      };
    case "BusyToneStarted":
      return {
        ...projection,
        toneIndicator: "busy",
      };
    case "FailedToneStarted":
      return {
        ...projection,
        toneIndicator: "failed",
      };
    case "ToneStopped":
      return {
        ...projection,
        toneIndicator: "none",
      };
    case "DtmfSent":
      return {
        ...projection,
        lastDtmfTone: asOptionalString(event["tone"]),
        lastError: null,
      };
    case "DtmfFailed":
      return {
        ...projection,
        lastError: asOptionalString(event["reason"]) ?? "DTMF failed",
      };
    case "CallTransferRequested":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Transferring",
      };
    case "CallTransferred":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Ended",
        mode: "number",
        uiState: "idle",
        muted: false,
        toneIndicator: "none",
        remoteAudioAttached: false,
      };
    case "CallTransferFailed":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Active",
        lastError: asOptionalString(event["reason"]),
      };
    default:
      return projection;
  }
}

export function setDialpadMode(
  projection: CallProjection,
  mode: DialpadMode,
): CallProjection {
  return {
    ...projection,
    mode,
  };
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export type DialpadDisabledContext = Readonly<{
  isRegistered: boolean;
  isOcpReserved: boolean;
  isSecondSessionDisabled: boolean;
  isHoldAllInProgress: boolean;
  isNumberValid: boolean;
  isConnecting: boolean;
}>;

export function deriveDialpadDisabledReason(
  context: DialpadDisabledContext,
): DialpadUiState | null {
  if (!context.isRegistered) {
    return "disabledByNotRegistered";
  }
  if (context.isOcpReserved) {
    return "disabledByOcpReserved";
  }
  if (context.isHoldAllInProgress) {
    return "disabledByHoldAllInProgress";
  }
  if (context.isSecondSessionDisabled) {
    return "disabledBySecondSessionPolicy";
  }
  if (context.isConnecting) {
    return "calling";
  }
  if (!context.isNumberValid) {
    return "invalidNumber";
  }
  return null;
}

function mapFailureState(
  projection: CallProjection,
  callId: string | null,
  reason: string | null,
  details: string | null,
): CallProjection {
  if (reason === "busy") {
    return {
      ...projection,
      activeCallId: callId,
      state: "Failed",
      uiState: "failedBusy",
      lastError: details ?? "Busy",
      muted: false,
    };
  }
  if (reason === "rejected") {
    return {
      ...projection,
      activeCallId: callId,
      state: "Failed",
      uiState: "failedRejected",
      lastError: details ?? "Rejected",
      muted: false,
    };
  }
  if (reason === "unavailable") {
    return {
      ...projection,
      activeCallId: callId,
      state: "Failed",
      uiState: "failedUnavailable",
      lastError: details ?? "Unavailable",
      muted: false,
    };
  }
  return {
    ...projection,
    activeCallId: callId,
    state: "Failed",
    uiState: "failedUnavailable",
    lastError: details ?? "Call failed",
    muted: false,
  };
}

