/**
 * - Purpose: pure attended-transfer eligibility rules for consultation and completion.
 * - Inputs: call states, multi-call settings, transfer session snapshot.
 * - Outputs: allow decision or deterministic disabled reason.
 */
import type { CallState } from "./CallState.js";
import type { MultiCallSettings } from "./MultiCallPolicy.js";
import type { PhoneNumber } from "./PhoneNumber.js";
import { createPhoneNumber, validatePhoneNumber } from "./PhoneNumber.js";
import { transitionCallState } from "./CallStateMachine.js";
import type { TransferSession } from "./CallRelationship.js";
import { isTransferSessionBlockingSecondConsultation } from "./CallRelationship.js";
import { isEstablishedCall } from "./MultiCallPolicy.js";
import type { Call } from "./Call.js";

export type AttendedTransferDisabledReason =
  | "consultation_in_progress"
  | "transfer_not_allowed"
  | "second_session_disabled"
  | "no_source_call"
  | "invalid_target"
  | "consultation_not_active"
  | "relationship_invalid";

export type StartConsultationEligibilityInput = Readonly<{
  sourceCall: Call | null;
  transferSession: TransferSession | null;
  multiCallSettings: MultiCallSettings;
  targetNumber: string;
}>;

export type StartConsultationEligibilityResult =
  | Readonly<{ ok: true; targetNumber: PhoneNumber }>
  | Readonly<{ ok: false; reason: AttendedTransferDisabledReason }>;

export type CompleteAttendedTransferEligibilityInput = Readonly<{
  sourceCall: Call | null;
  consultationCall: Call | null;
  transferSession: TransferSession | null;
}>;

export type CompleteAttendedTransferEligibilityResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: AttendedTransferDisabledReason }>;

export function evaluateStartConsultationEligibility(
  input: StartConsultationEligibilityInput,
): StartConsultationEligibilityResult {
  if (input.sourceCall === null) {
    return { ok: false, reason: "no_source_call" };
  }

  if (isTransferSessionBlockingSecondConsultation(input.transferSession)) {
    return { ok: false, reason: "consultation_in_progress" };
  }

  if (!input.multiCallSettings.multiSessionsEnabled) {
    return { ok: false, reason: "second_session_disabled" };
  }

  if (!isEstablishedCall(input.sourceCall)) {
    return { ok: false, reason: "transfer_not_allowed" };
  }

  const validationErrors = validatePhoneNumber(input.targetNumber);
  if (validationErrors.length > 0) {
    return { ok: false, reason: "invalid_target" };
  }

  return {
    ok: true,
    targetNumber: createPhoneNumber(input.targetNumber),
  };
}

export function evaluateCompleteAttendedTransferEligibility(
  input: CompleteAttendedTransferEligibilityInput,
): CompleteAttendedTransferEligibilityResult {
  if (input.sourceCall === null || input.consultationCall === null) {
    return { ok: false, reason: "relationship_invalid" };
  }

  if (input.transferSession === null) {
    return { ok: false, reason: "relationship_invalid" };
  }

  if (
    input.transferSession.sourceCallId !== input.sourceCall.id ||
    input.transferSession.consultationCallId !== input.consultationCall.id
  ) {
    return { ok: false, reason: "relationship_invalid" };
  }

  if (
    input.transferSession.phase !== "consultation_active" &&
    input.transferSession.phase !== "attended_transfer_failed"
  ) {
    return { ok: false, reason: "consultation_not_active" };
  }

  if (input.consultationCall.state !== "Active") {
    return { ok: false, reason: "consultation_not_active" };
  }

  const sourceState = input.sourceCall.state;
  if (sourceState !== "Held" && sourceState !== "Active") {
    return { ok: false, reason: "transfer_not_allowed" };
  }

  const transferTransition = transitionCallState(sourceState, "transfer_requested");
  if (!transferTransition.ok) {
    return { ok: false, reason: "transfer_not_allowed" };
  }

  return { ok: true };
}

export function isConsultationEligibleSourceState(state: CallState | null): boolean {
  return state === "Active" || state === "Held";
}
