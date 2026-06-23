import type { DomainEvent } from "@domain/index.js";
import type { BlindTransferDisabledReason } from "@domain/index.js";

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
  callId: string | null;
  targetNumber: string | null;
  transferType: "blind" | "attended" | null;
  sourceCallId: string | null;
  consultationCallId: string | null;
  lastFailureReason: string | null;
}>;

/**
 * - Purpose: project blind transfer domain events into read-model state.
 * - Inputs: previous transfer projection and domain event.
 * - Outputs: immutable transfer projection for future UI wiring.
 */
export function initialTransferProjection(): TransferProjection {
  return {
    phase: "idle",
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
  switch (event.type) {
    case "CallTransferRequested":
      return {
        phase: "transferring",
        callId: asOptionalString(event["callId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: readTransferType(event["transferType"]),
        sourceCallId: null,
        consultationCallId: null,
        lastFailureReason: null,
      };
    case "CallTransferred":
      return {
        phase: "transferred",
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
        callId: asOptionalString(event["callId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: readTransferType(event["transferType"]),
        sourceCallId: null,
        consultationCallId: null,
        lastFailureReason: asOptionalString(event["reason"]),
      };
    case "ConsultationCallRequested":
      return {
        phase: "consultation_dialing",
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
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]) ?? projection.sourceCallId,
        consultationCallId:
          asOptionalString(event["consultationCallId"]) ?? projection.consultationCallId,
        lastFailureReason: null,
      };
    case "ConsultationCallFailed":
      return {
        ...initialTransferProjection(),
        lastFailureReason: asOptionalString(event["reason"]),
      };
    case "AttendedTransferRequested":
      return {
        ...projection,
        phase: "attended_transfer_in_progress",
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]) ?? projection.sourceCallId,
        consultationCallId:
          asOptionalString(event["consultationCallId"]) ?? projection.consultationCallId,
        lastFailureReason: null,
      };
    case "AttendedTransferCompleted":
      return {
        phase: "transferred",
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
        transferType: "attended",
        sourceCallId: asOptionalString(event["sourceCallId"]) ?? projection.sourceCallId,
        consultationCallId:
          asOptionalString(event["consultationCallId"]) ?? projection.consultationCallId,
        lastFailureReason: asOptionalString(event["reason"]),
      };
    case "CallEnded":
      if (projection.phase === "transferred") {
        return initialTransferProjection();
      }
      return projection;
    default:
      return projection;
  }
}

export type BlindTransferDisabledContext = Readonly<{
  callId: string | null;
  callState: string;
  targetNumber: string;
}>;

export function deriveBlindTransferDisabledReason(
  context: BlindTransferDisabledContext,
): BlindTransferDisabledReason | null {
  if (context.callId === null) {
    return "no_active_call";
  }
  if (context.callState !== "Active" && context.callState !== "Held") {
    return "transfer_not_allowed";
  }
  if (context.targetNumber.trim().length === 0) {
    return "invalid_target";
  }
  return null;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readTransferType(value: unknown): "blind" | "attended" | null {
  if (value === "blind" || value === "attended") {
    return value;
  }
  return null;
}
