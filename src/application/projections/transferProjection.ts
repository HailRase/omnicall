import type { DomainEvent } from "@domain/index.js";
import type {
  AttendedTransferDisabledReason,
  BlindTransferDisabledReason,
  Call,
  CallState,
  TransferSessionPhase,
} from "@domain/index.js";
import {
  createCallId,
  createPhoneNumber,
  evaluateCompleteAttendedTransferEligibility,
  evaluateStartConsultationEligibility,
  validatePhoneNumber,
} from "@domain/index.js";
import { isBenignTransferFailureReason } from "./transferFailureReasons.js";
import { isSessionResetEvent } from "./sessionResetEvents.js";

export type TransferPhase =
  | "idle"
  | "transfer_requested"
  | "transferring"
  | "transferred"
  | "transfer_failed"
  | "consultation_dialing"
  | "consultation_active"
  | "attended_transfer_in_progress"
  | "attended_transfer_failed";

export type TransferProjection = Readonly<{
  phase: TransferPhase;
  transferModeActive: boolean;
  callId: string | null;
  targetNumber: string | null;
  transferType: "blind" | "attended" | null;
  sourceCallId: string | null;
  consultationCallId: string | null;
  lastFailureReason: string | null;
}>;

/**
 * - Purpose: project blind and attended transfer domain events into read-model state.
 * - Inputs: previous transfer projection and domain event.
 * - Outputs: immutable transfer projection for UI wiring.
 */
export function initialTransferProjection(): TransferProjection {
  return {
    phase: "idle",
    transferModeActive: false,
    callId: null,
    targetNumber: null,
    transferType: null,
    sourceCallId: null,
    consultationCallId: null,
    lastFailureReason: null,
  };
}

export function reduceTransferProjection(
  projection: TransferProjection,
  event: DomainEvent,
): TransferProjection {
  if (isSessionResetEvent(event)) {
    return initialTransferProjection();
  }

  switch (event.type) {
    case "TransferModeStarted":
      return {
        ...projection,
        transferModeActive: true,
        sourceCallId: asOptionalString(event["callId"]) ?? projection.sourceCallId,
        callId: asOptionalString(event["callId"]) ?? projection.callId,
        lastFailureReason: null,
      };
    case "TransferModeCancelled":
      return {
        ...projection,
        transferModeActive: false,
        phase: projection.phase === "transfer_failed" ? projection.phase : "idle",
        targetNumber: null,
        consultationCallId: null,
        lastFailureReason:
          projection.phase === "transfer_failed" ? projection.lastFailureReason : null,
      };
    case "CallTransferRequested":
      return {
        phase: "transferring",
        transferModeActive: true,
        callId: asOptionalString(event["callId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: readTransferType(event["transferType"]),
        sourceCallId: asOptionalString(event["callId"]),
        consultationCallId: null,
        lastFailureReason: null,
      };
    case "CallTransferred":
      return {
        phase: "transferred",
        transferModeActive: false,
        callId: asOptionalString(event["callId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: readTransferType(event["transferType"]),
        sourceCallId: null,
        consultationCallId: null,
        lastFailureReason: null,
      };
    case "CallTransferFailed":
      return {
        phase: "transfer_failed",
        transferModeActive: true,
        callId: asOptionalString(event["callId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: readTransferType(event["transferType"]),
        sourceCallId: asOptionalString(event["callId"]),
        consultationCallId: null,
        lastFailureReason: asOptionalString(event["reason"]),
      };
    case "ConsultationCallRequested":
      return {
        phase: "consultation_dialing",
        transferModeActive: true,
        callId: asOptionalString(event["consultationCallId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]),
        consultationCallId: asOptionalString(event["consultationCallId"]),
        lastFailureReason: null,
      };
    case "ConsultationCallStarted":
      return {
        ...projection,
        phase: "consultation_active",
        transferModeActive: true,
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]) ?? projection.sourceCallId,
        consultationCallId:
          asOptionalString(event["consultationCallId"]) ?? projection.consultationCallId,
        lastFailureReason: null,
      };
    case "ConsultationCallFailed":
      return {
        ...initialTransferProjection(),
        transferModeActive: projection.transferModeActive,
        sourceCallId: asOptionalString(event["sourceCallId"]),
        callId: asOptionalString(event["sourceCallId"]),
        lastFailureReason: asOptionalFailureReason(event["reason"]),
      };
    case "AttendedTransferRequested":
      return {
        ...projection,
        phase: "attended_transfer_in_progress",
        transferModeActive: true,
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]) ?? projection.sourceCallId,
        consultationCallId:
          asOptionalString(event["consultationCallId"]) ?? projection.consultationCallId,
        lastFailureReason: null,
      };
    case "AttendedTransferCompleted":
      return {
        phase: "transferred",
        transferModeActive: false,
        callId: asOptionalString(event["sourceCallId"]),
        targetNumber: projection.targetNumber,
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]),
        consultationCallId: asOptionalString(event["consultationCallId"]),
        lastFailureReason: null,
      };
    case "AttendedTransferFailed":
      return {
        ...projection,
        phase: "attended_transfer_failed",
        transferModeActive: true,
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]) ?? projection.sourceCallId,
        consultationCallId:
          asOptionalString(event["consultationCallId"]) ?? projection.consultationCallId,
        lastFailureReason: asOptionalString(event["reason"]),
      };
    case "CallAutoUnheldAfterTransferFailure":
      return projection;
    case "CallFailed": {
      const failedCallId = asOptionalString(event["callId"]);
      if (
        failedCallId !== null &&
        projection.transferModeActive &&
        failedCallId === projection.consultationCallId
      ) {
        return {
          ...projection,
          phase: "idle",
          consultationCallId: null,
          callId: projection.sourceCallId,
          lastFailureReason: asOptionalFailureReason(event["reason"]),
        };
      }
      return projection;
    }
    case "CallEnded": {
      const endedCallId = asOptionalString(event["callId"]);
      if (projection.phase === "transferred") {
        return initialTransferProjection();
      }
      if (projection.phase === "transferring") {
        return {
          ...initialTransferProjection(),
          transferModeActive: projection.transferModeActive,
          phase: "transfer_failed",
          callId: projection.callId,
          targetNumber: projection.targetNumber,
          transferType: projection.transferType,
          sourceCallId: projection.sourceCallId,
          lastFailureReason: "Call ended during transfer",
        };
      }
      if (
        endedCallId !== null &&
        projection.transferModeActive &&
        (endedCallId === projection.sourceCallId || endedCallId === projection.callId)
      ) {
        return initialTransferProjection();
      }
      return projection;
    }
    default:
      return projection;
  }
}

export type BlindTransferDisabledContext = Readonly<{
  callId: string | null;
  callState: string;
  targetNumber: string;
  transferInProgress: boolean;
}>;

export type StartConsultationDisabledContext = Readonly<{
  sourceCallId: string | null;
  sourceCallState: string;
  consultationCallId: string | null;
  targetNumber: string;
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure: boolean;
  attendedPhase: string;
  transferInProgress: boolean;
}>;

export type StartTransferDisabledContext = Readonly<{
  activeCallId: string | null;
  activeCallState: string;
  transferModeActive: boolean;
}>;

export type AttendedTransferDisabledContext = Readonly<{
  sourceCallId: string | null;
  consultationCallId: string | null;
  sourceCallState: string;
  consultationCallState: string;
  attendedPhase: string;
  transferInProgress: boolean;
}>;

export function deriveBlindTransferDisabledReason(
  context: BlindTransferDisabledContext,
): BlindTransferDisabledReason | "transfer_in_progress" | null {
  if (context.transferInProgress) {
    return "transfer_in_progress";
  }
  if (context.callId === null) {
    return "no_active_call";
  }
  if (context.callState !== "Active" && context.callState !== "Held") {
    return "transfer_not_allowed";
  }
  if (validatePhoneNumber(context.targetNumber).length > 0) {
    return "invalid_target";
  }
  return null;
}

export function deriveStartConsultationDisabledReason(
  context: StartConsultationDisabledContext,
): AttendedTransferDisabledReason | "transfer_in_progress" | null {
  if (context.transferInProgress) {
    return "transfer_in_progress";
  }

  const eligibility = evaluateStartConsultationEligibility({
    sourceCall: buildCallSnapshot(context.sourceCallId, context.sourceCallState),
    transferSession:
      context.attendedPhase === "idle"
        ? null
        : {
            sourceCallId: createCallId(context.sourceCallId ?? ""),
            consultationCallId:
              context.consultationCallId === null
                ? null
                : createCallId(context.consultationCallId),
            targetNumber: null,
            phase: parseAttendedPhase(context.attendedPhase),
          },
    multiCallSettings: {
      multiSessionsEnabled: context.multiSessionsEnabled,
      autoUnholdOnTransferFailure: context.autoUnholdOnTransferFailure,
    },
    targetNumber: context.targetNumber,
  });

  if (!eligibility.ok) {
    return eligibility.reason;
  }
  return null;
}

export function deriveStartTransferDisabledReason(
  context: StartTransferDisabledContext,
): string | null {
  if (context.activeCallId === null) {
    return "no_active_call";
  }
  if (context.activeCallState === "Transferring") {
    return "transfer_in_progress";
  }
  if (context.transferModeActive) {
    return "transfer_mode_active";
  }
  if (context.activeCallState !== "Active" && context.activeCallState !== "Held") {
    return "transfer_not_allowed";
  }
  return null;
}

export function deriveAttendedTransferDisabledReason(
  context: AttendedTransferDisabledContext,
): AttendedTransferDisabledReason | "transfer_in_progress" | null {
  if (context.transferInProgress) {
    return "transfer_in_progress";
  }
  if (context.consultationCallId === null) {
    return null;
  }

  const eligibility = evaluateCompleteAttendedTransferEligibility({
    sourceCall: buildCallSnapshot(context.sourceCallId, context.sourceCallState),
    consultationCall: buildCallSnapshot(
      context.consultationCallId,
      context.consultationCallState,
    ),
    transferSession:
      context.sourceCallId === null || context.consultationCallId === null
        ? null
        : {
            sourceCallId: createCallId(context.sourceCallId),
            consultationCallId: createCallId(context.consultationCallId),
            targetNumber: null,
            phase: parseAttendedPhase(context.attendedPhase),
          },
  });

  if (!eligibility.ok) {
    return eligibility.reason;
  }
  return null;
}

function buildCallSnapshot(callId: string | null, state: string): Call | null {
  if (callId === null) {
    return null;
  }
  return {
    id: createCallId(callId),
    direction: "outgoing",
    phoneNumber: createPhoneNumber("+12025550100"),
    state: parseCallState(state),
    muted: false,
  };
}

function parseCallState(value: string): CallState {
  if (
    value === "Active" ||
    value === "Held" ||
    value === "Connecting" ||
    value === "Ringing" ||
    value === "Transferring" ||
    value === "Ending" ||
    value === "Ended" ||
    value === "Failed" ||
    value === "Conference"
  ) {
    return value;
  }
  return "Active";
}

function parseAttendedPhase(value: string): TransferSessionPhase {
  if (
    value === "consultation_dialing" ||
    value === "consultation_active" ||
    value === "attended_transfer_in_progress" ||
    value === "attended_transfer_failed"
  ) {
    return value;
  }
  return "idle";
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asOptionalFailureReason(value: unknown): string | null {
  const reason = asOptionalString(value);
  if (reason === null || isBenignTransferFailureReason(reason)) {
    return null;
  }
  return reason;
}

function readTransferType(value: unknown): "blind" | "attended" | null {
  if (value === "blind" || value === "attended") {
    return value;
  }
  return null;
}
