/**
 * - Purpose: enrich manual Run now input with tracked focused-call parties.
 * - Inputs: Run now input and optional tracked call context.
 * - Outputs: input with filled caller/called/direction when tracker has the call.
 */

import type { RunExternalServiceRequestNowInput } from "../../../use-cases/integration/RunExternalServiceRequestNowUseCase.js";
import type { ExternalServicesCallContext } from "./ExternalServicesCallContextTracker.js";

export function enrichExternalServicesManualRunInput(
  input: RunExternalServiceRequestNowInput,
  trackedCall: ExternalServicesCallContext | null,
): RunExternalServiceRequestNowInput {
  const callId = input.focusedCallContext?.callId;
  if (callId === undefined || trackedCall === null || trackedCall.callId !== callId) {
    return input;
  }
  return {
    ...input,
    ...(input.userLogin === undefined && trackedCall.userLogin !== undefined
      ? { userLogin: trackedCall.userLogin }
      : {}),
    focusedCallContext: {
      callId,
      ...(trackedCall.callerId !== undefined ? { callerId: trackedCall.callerId } : {}),
      ...(trackedCall.calledId !== undefined ? { calledId: trackedCall.calledId } : {}),
      callDirection: trackedCall.direction,
      ...input.focusedCallContext,
    },
  };
}
