/**
 * - Purpose: pure blind-transfer eligibility rules for domain validation.
 * - Inputs: call lifecycle state and raw target number string.
 * - Outputs: validated PhoneNumber or deterministic disabled reason.
 */
import type { CallState } from "./CallState.js";
import type { PhoneNumber } from "./PhoneNumber.js";
import { createPhoneNumber, validatePhoneNumber } from "./PhoneNumber.js";
import { transitionCallState } from "./CallStateMachine.js";

export type BlindTransferDisabledReason =
  | "transfer_not_allowed"
  | "no_active_call"
  | "invalid_target";

export type BlindTransferEligibilityInput = Readonly<{
  callState: CallState | null;
  targetNumber: string;
}>;

export type BlindTransferEligibilityResult =
  | Readonly<{ ok: true; targetNumber: PhoneNumber }>
  | Readonly<{ ok: false; reason: BlindTransferDisabledReason }>;

export function evaluateBlindTransferEligibility(
  input: BlindTransferEligibilityInput,
): BlindTransferEligibilityResult {
  if (input.callState === null) {
    return { ok: false, reason: "no_active_call" };
  }

  const transferTransition = transitionCallState(input.callState, "transfer_requested");
  if (!transferTransition.ok) {
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
