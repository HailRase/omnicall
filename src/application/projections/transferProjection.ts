import type { DomainEvent } from "@domain/index.js";
import type { BlindTransferDisabledReason } from "@domain/index.js";

export type TransferPhase =
  | "idle"
  | "transfer_requested"
  | "transferring"
  | "transferred"
  | "transfer_failed";

export type TransferProjection = Readonly<{
  phase: TransferPhase;
  callId: string | null;
  targetNumber: string | null;
  transferType: "blind" | null;
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
        lastFailureReason: null,
      };
    case "CallTransferred":
      return {
        phase: "transferred",
        callId: asOptionalString(event["callId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: readTransferType(event["transferType"]),
        lastFailureReason: null,
      };
    case "CallTransferFailed":
      return {
        phase: "transfer_failed",
        callId: asOptionalString(event["callId"]),
        targetNumber: asOptionalString(event["targetNumber"]),
        transferType: readTransferType(event["transferType"]),
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

function readTransferType(value: unknown): "blind" | null {
  return value === "blind" ? "blind" : null;
}
