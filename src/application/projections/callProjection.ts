import type { DomainEvent } from "@domain/index.js";
import type { CallState } from "@domain/index.js";
import { isSessionResetEvent } from "./sessionResetEvents.js";

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
  | "disabledByHoldAllInProgress"
  | "disabledByConnectingInProgress";

export type CallProjection = Readonly<{
  activeCallId: string | null;
  state: CallState | "Idle";
  mode: DialpadMode;
  dtmfPanelCallId: string | null;
  uiState: DialpadUiState;
  lastError: string | null;
  lastDtmfError: string | null;
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
    dtmfPanelCallId: null,
    uiState: "idle",
    lastError: null,
    lastDtmfError: null,
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
  if (isSessionResetEvent(event)) {
    return initialCallProjection();
  }

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
        uiState: "idle",
      };
    case "CallHeld":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Held",
        remoteAudioAttached: false,
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
    case "CallEnded": {
      const endedCallId = asOptionalString(event["callId"]);
      return {
        ...projection,
        activeCallId: endedCallId,
        state: "Ended",
        mode: projection.dtmfPanelCallId === endedCallId ? "number" : projection.mode,
        dtmfPanelCallId:
          projection.dtmfPanelCallId === endedCallId ? null : projection.dtmfPanelCallId,
        uiState: "idle",
        muted: false,
        toneIndicator: "none",
        remoteAudioAttached: false,
      };
    }
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
        lastDtmfError: null,
      };
    case "DtmfFailed":
      return {
        ...projection,
        lastDtmfError: asOptionalString(event["reason"]) ?? "DTMF failed",
      };
    case "CallTransferRequested":
      return {
        ...projection,
        activeCallId: asOptionalString(event["callId"]),
        state: "Transferring",
        lastError: null,
      };
    case "CallTransferred": {
      const transferredCallId = asOptionalString(event["callId"]);
      return {
        ...projection,
        activeCallId: transferredCallId,
        state: "Ended",
        mode: projection.dtmfPanelCallId === transferredCallId ? "number" : projection.mode,
        dtmfPanelCallId:
          projection.dtmfPanelCallId === transferredCallId ? null : projection.dtmfPanelCallId,
        uiState: "idle",
        muted: false,
        toneIndicator: "none",
        remoteAudioAttached: false,
      };
    }
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
  dtmfPanelCallId: string | null = null,
): CallProjection {
  if (mode === "dtmf") {
    return {
      ...projection,
      mode: "dtmf",
      dtmfPanelCallId: dtmfPanelCallId ?? projection.activeCallId,
      uiState: "activeCallDtmfMode",
    };
  }
  return {
    ...projection,
    mode: "number",
    dtmfPanelCallId: null,
    uiState: projection.state === "Active" || projection.state === "Held" ? "idle" : projection.uiState,
  };
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export type DialpadDisabledContext = Readonly<{
  isRegistered: boolean;
  isOcpReserved: boolean;
  isSecondSessionDisabled: boolean;
  secondSessionDisabledReason: "second_session_disabled" | "hold_all_in_progress" | "connecting_in_progress" | null;
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
    if (context.secondSessionDisabledReason === "connecting_in_progress") {
      return "disabledByConnectingInProgress";
    }
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

