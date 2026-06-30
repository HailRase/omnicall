import type { DomainEvent } from "@domain/index.js";
import type { ActiveCallControlOperation } from "@domain/index.js";
import type { CallState } from "@domain/index.js";
import { isSessionResetEvent } from "./sessionResetEvents.js";

export type ActiveControlDisabledReason =
  | "no_active_call"
  | "call_ending"
  | "transfer_in_progress"
  | "hold_requires_active"
  | "resume_requires_held"
  | "mute_requires_active_or_held"
  | "already_muted"
  | "not_muted"
  | "hangup_not_allowed";

export type ActiveCallControlOperationError = Readonly<{
  operation: ActiveCallControlOperation;
  message: string;
}>;

export type ActiveCallControlsProjection = Readonly<{
  callId: string | null;
  callState: CallState | "Idle";
  muted: boolean;
  holdDisabledReason: ActiveControlDisabledReason | null;
  resumeDisabledReason: ActiveControlDisabledReason | null;
  muteDisabledReason: ActiveControlDisabledReason | null;
  unmuteDisabledReason: ActiveControlDisabledReason | null;
  hangupDisabledReason: ActiveControlDisabledReason | null;
  lastOperationError: ActiveCallControlOperationError | null;
}>;

/**
 * - Purpose: project call controls availability and disabled reasons.
 * - Inputs: call lifecycle and media domain events.
 * - Outputs: renderer-ready active control projection state.
 */
export function initialActiveCallControlsProjection(): ActiveCallControlsProjection {
  return createActiveCallControlsProjection({
    callId: null,
    callState: "Idle",
    muted: false,
  });
}

export function reduceActiveCallControlsProjection(
  projection: ActiveCallControlsProjection,
  event: DomainEvent,
): ActiveCallControlsProjection {
  if (isSessionResetEvent(event)) {
    return initialActiveCallControlsProjection();
  }

  switch (event.type) {
    case "OutgoingCallRequested":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Connecting",
        muted: false,
      });
    case "IncomingCallReceived":
      if (hasOngoingCallControls(projection)) {
        return projection;
      }
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Ringing",
        muted: false,
      });
    case "CallAnswered":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Active",
        muted: projection.muted,
      });
    case "CallHeld":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Held",
        muted: projection.muted,
      });
    case "CallResumed":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Active",
        muted: projection.muted,
      });
    case "CallMuted":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: projection.callState,
        muted: true,
      });
    case "CallUnmuted":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: projection.callState,
        muted: false,
      });
    case "CallHangupRequested":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Ending",
        muted: projection.muted,
      });
    case "CallTransferRequested":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Transferring",
        muted: projection.muted,
        lastOperationError: null,
      });
    case "CallTransferFailed":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]) ?? projection.callId,
        callState: "Active",
        muted: projection.muted,
        lastOperationError: null,
      });
    case "AttendedTransferRequested":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["sourceCallId"]),
        callState: "Transferring",
        muted: projection.muted,
        lastOperationError: null,
      });
    case "AttendedTransferFailed":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["sourceCallId"]) ?? projection.callId,
        callState: parseRestoredSourceState(event["restoredSourceState"]),
        muted: projection.muted,
        lastOperationError: null,
      });
    case "AttendedTransferCompleted":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["sourceCallId"]),
        callState: "Ended",
        muted: false,
      });
    case "ConsultationCallStarted":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["consultationCallId"]),
        callState: "Active",
        muted: projection.muted,
      });
    case "ConsultationCallFailed":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["sourceCallId"]) ?? projection.callId,
        callState: parseRestoredSourceState(event["restoredSourceState"]),
        muted: projection.muted,
        lastOperationError: null,
      });
    case "CallTransferred":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Ended",
        muted: false,
      });
    case "ActiveCallControlFailed": {
      const operation = parseActiveCallControlOperation(event["operation"]);
      const base = createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]) ?? projection.callId,
        callState: projection.callState,
        muted: projection.muted,
      });
      if (operation === null) {
        return base;
      }
      return {
        ...base,
        lastOperationError: {
          operation,
          message: asOptionalString(event["reason"]) ?? "Operation failed",
        },
      };
    }
    case "CallAutoUnheldAfterTransferFailure":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]) ?? projection.callId,
        callState: "Active",
        muted: projection.muted,
        lastOperationError: null,
      });
    case "TransferModeCancelled": {
      const callId = asOptionalString(event["callId"]) ?? projection.callId;
      if (event["restoredSourceState"] !== undefined) {
        return createActiveCallControlsProjection({
          callId,
          callState: parseRestoredSourceState(event["restoredSourceState"]),
          muted: projection.muted,
          lastOperationError: null,
        });
      }
      return projection;
    }
    case "CallEnded":
    case "CallFailed":
    case "CallRejected":
      return createActiveCallControlsProjection({
        callId: asOptionalString(event["callId"]),
        callState: "Ended",
        muted: false,
      });
    default:
      return projection;
  }
}

export function createActiveCallControlsProjection(
  base: Readonly<{
    callId: string | null;
    callState: CallState | "Idle";
    muted: boolean;
    lastOperationError?: ActiveCallControlOperationError | null;
  }>,
): ActiveCallControlsProjection {
  return {
    ...base,
    lastOperationError: base.lastOperationError ?? null,
    holdDisabledReason: resolveHoldDisabledReason(base),
    resumeDisabledReason: resolveResumeDisabledReason(base),
    muteDisabledReason: resolveMuteDisabledReason(base),
    unmuteDisabledReason: resolveUnmuteDisabledReason(base),
    hangupDisabledReason: resolveHangupDisabledReason(base),
  };
}

function resolveHoldDisabledReason(base: {
  callId: string | null;
  callState: CallState | "Idle";
}): ActiveControlDisabledReason | null {
  if (base.callId === null) {
    return "no_active_call";
  }
  if (base.callState === "Ending") {
    return "call_ending";
  }
  if (base.callState === "Transferring") {
    return "transfer_in_progress";
  }
  if (base.callState !== "Active") {
    return "hold_requires_active";
  }
  return null;
}

function resolveResumeDisabledReason(base: {
  callId: string | null;
  callState: CallState | "Idle";
}): ActiveControlDisabledReason | null {
  if (base.callId === null) {
    return "no_active_call";
  }
  if (base.callState === "Ending") {
    return "call_ending";
  }
  if (base.callState === "Transferring") {
    return "transfer_in_progress";
  }
  if (base.callState !== "Held") {
    return "resume_requires_held";
  }
  return null;
}

function resolveMuteDisabledReason(base: {
  callId: string | null;
  callState: CallState | "Idle";
  muted: boolean;
}): ActiveControlDisabledReason | null {
  if (base.callId === null) {
    return "no_active_call";
  }
  if (base.callState === "Ending") {
    return "call_ending";
  }
  if (base.callState === "Transferring") {
    return "transfer_in_progress";
  }
  if (base.muted) {
    return "already_muted";
  }
  if (base.callState !== "Active" && base.callState !== "Held") {
    return "mute_requires_active_or_held";
  }
  return null;
}

function resolveUnmuteDisabledReason(base: {
  callId: string | null;
  callState: CallState | "Idle";
  muted: boolean;
}): ActiveControlDisabledReason | null {
  if (base.callId === null) {
    return "no_active_call";
  }
  if (base.callState === "Ending") {
    return "call_ending";
  }
  if (base.callState === "Transferring") {
    return "transfer_in_progress";
  }
  if (!base.muted) {
    return "not_muted";
  }
  if (base.callState !== "Active" && base.callState !== "Held") {
    return "mute_requires_active_or_held";
  }
  return null;
}

function resolveHangupDisabledReason(base: {
  callId: string | null;
  callState: CallState | "Idle";
}): ActiveControlDisabledReason | null {
  if (base.callId === null) {
    return "no_active_call";
  }
  if (
    base.callState === "Ended" ||
    base.callState === "Failed" ||
    base.callState === "Idle"
  ) {
    return "hangup_not_allowed";
  }
  if (base.callState === "Ending") {
    return "call_ending";
  }
  return null;
}

function parseRestoredSourceState(value: unknown): CallState {
  if (value === "Active" || value === "Held") {
    return value;
  }
  return "Active";
}

function hasOngoingCallControls(
  projection: ActiveCallControlsProjection,
): boolean {
  if (projection.callId === null) {
    return false;
  }
  return (
    projection.callState === "Active" ||
    projection.callState === "Held" ||
    projection.callState === "Connecting" ||
    projection.callState === "Transferring"
  );
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseActiveCallControlOperation(
  value: unknown,
): ActiveCallControlOperation | null {
  if (
    value === "hold" ||
    value === "resume" ||
    value === "mute" ||
    value === "unmute" ||
    value === "hangup"
  ) {
    return value;
  }
  return null;
}
