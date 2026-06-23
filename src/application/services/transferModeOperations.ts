import {
  createTransferModeCancelledEvent,
  createTransferModeStartedEvent,
  isConsultationEligibleSourceState,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { cleanupConsultationLegOnCancel } from "./attendedTransferRollback.js";
import type {
  CancelTransferInput,
  StartTransferModeInput,
  TransferCallControlDeps,
} from "./transferCallControlTypes.js";

/**
 * - Purpose: enter transfer mode for an established call without mutating call FSM.
 * - Inputs: transfer control deps and source call id.
 * - Outputs: success or validation error when call cannot enter transfer mode.
 */
export function executeStartTransferMode(
  deps: TransferCallControlDeps,
  input: StartTransferModeInput,
): Result<void, PlatformError> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedResult)) {
    return err(createPlatformError("not_found", "no_active_call"));
  }

  const call = trackedResult.value;
  if (!isConsultationEligibleSourceState(call.state)) {
    return err(createPlatformError("validation_failed", "transfer_not_allowed"));
  }

  deps.eventPublisher.publish(
    createTransferModeStartedEvent(correlationId, { callId: input.callId }),
  );
  deps.logger.info("transfer_mode_started", {
    correlationId,
    featureId: "F-006",
    boundedContext: "Telephony",
    operation: "start_transfer_mode",
    previousState: call.state,
    nextState: call.state,
    result: "started",
  });
  return ok(undefined);
}

/**
 * - Purpose: cancel transfer mode and consultation leg without invalid terminal state.
 * - Inputs: transfer control deps and source call id.
 * - Outputs: success or error when gateway transfer is in progress.
 */
export async function executeCancelTransfer(
  deps: TransferCallControlDeps,
  input: CancelTransferInput,
): Promise<Result<void, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedResult)) {
    return err(createPlatformError("not_found", "no_active_call"));
  }

  const call = trackedResult.value;
  if (call.state === "Transferring") {
    return err(createPlatformError("validation_failed", "transfer_in_progress"));
  }

  const session = deps.getTransferSession();
  let cancelPayload: {
    callId: CancelTransferInput["callId"];
    restoredSourceState?: "Active" | "Held";
    consultationCallId?: CancelTransferInput["callId"];
  } = { callId: input.callId };

  if (session !== null) {
    if (session.phase === "attended_transfer_in_progress") {
      return err(createPlatformError("validation_failed", "transfer_in_progress"));
    }

    if (session.consultationCallId !== null) {
      const restoredSourceState = await cleanupConsultationLegOnCancel(
        deps,
        correlationId,
        session.sourceCallId,
        session.consultationCallId,
      );
      const normalizedSourceState: "Active" | "Held" =
        restoredSourceState === "Active" ? "Active" : "Held";
      cancelPayload = {
        callId: input.callId,
        restoredSourceState: normalizedSourceState,
        consultationCallId: session.consultationCallId,
      };
    } else {
      deps.setTransferSession(null);
    }
  }

  deps.eventPublisher.publish(
    createTransferModeCancelledEvent(correlationId, cancelPayload),
  );
  deps.logger.info("transfer_mode_cancelled", {
    correlationId,
    featureId: "F-006",
    boundedContext: "Telephony",
    operation: "cancel_transfer_mode",
    previousState: call.state,
    nextState: call.state,
    result: "cancelled",
  });
  return ok(undefined);
}
