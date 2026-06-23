import {
  applyCallTransition,
  createCallEndedEvent,
  createCallTransferredEvent,
  createCallTransferRequestedEvent,
  evaluateBlindTransferEligibility,
  type Call,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import {
  logBlindTransferFailure,
  publishCallTransferFailed,
} from "./transferCallControlLogging.js";
import { applyTransferFailureRecovery } from "./transferFailureRecovery.js";
import type { BlindTransferInput, TransferCallControlDeps } from "./transferCallControlTypes.js";

/**
 * - Purpose: blind transfer orchestration via telephony gateway and domain events.
 * - Inputs: transfer control deps and blind transfer command input.
 * - Outputs: ended call on success or normalized platform error with state restore.
 */
export async function executeBlindTransfer(
  deps: TransferCallControlDeps,
  input: BlindTransferInput,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedCallResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedCallResult)) {
    return err(createPlatformError("not_found", "no_active_call"));
  }
  const trackedCall = trackedCallResult.value;

  const eligibility = evaluateBlindTransferEligibility({
    callState: trackedCall.state,
    targetNumber: input.targetNumber,
  });
  if (!eligibility.ok) {
    return err(createPlatformError("validation_failed", eligibility.reason));
  }
  const targetNumber = eligibility.targetNumber;

  const transferring = applyCallTransition(trackedCall, "transfer_requested");
  if (!transferring.transition.ok) {
    return err(createPlatformError("validation_failed", "transfer_not_allowed"));
  }

  deps.eventPublisher.publish(
    createCallTransferRequestedEvent(correlationId, {
      callId: input.callId,
      targetNumber,
      transferType: "blind",
    }),
  );
  deps.trackCall(transferring.call);
  deps.logger.info("blind_transfer_requested", {
    correlationId,
    featureId: "F-006",
    boundedContext: "Telephony",
    operation: "blind_transfer",
    previousState: trackedCall.state,
    nextState: "Transferring",
    result: "requested",
  });

  try {
    const gatewayResult = await deps.telephonyGateway.blindTransfer({
      callId: input.callId,
      targetNumber,
      correlationId,
    });
    if (isErr(gatewayResult)) {
      return await handleBlindTransferGatewayFailure(
        deps,
        transferring.call,
        input.callId,
        targetNumber,
        trackedCall.state,
        gatewayResult.error,
        correlationId,
      );
    }

    const completed = applyCallTransition(transferring.call, "transfer_completed");
    if (!completed.transition.ok) {
      return err(createPlatformError("validation_failed", completed.transition.reason));
    }

    deps.eventPublisher.publish(
      createCallTransferredEvent(correlationId, {
        callId: input.callId,
        targetNumber,
        transferType: "blind",
      }),
    );
    await deps.mediaGateway.stopTone({ callId: input.callId, correlationId });
    deps.eventPublisher.publish(
      createCallEndedEvent(correlationId, { callId: input.callId }),
    );
    deps.trackCall(completed.call);
    deps.clearIncomingCallById(input.callId);

    deps.logger.info("blind_transfer_succeeded", {
      correlationId,
      featureId: "F-006",
      boundedContext: "Telephony",
      operation: "blind_transfer",
      previousState: "Transferring",
      nextState: completed.call.state,
      result: "succeeded",
    });
    return ok(completed.call);
  } catch (error: unknown) {
    const normalizedError = normalizeUnknownError(error);
    return await handleBlindTransferGatewayFailure(
      deps,
      transferring.call,
      input.callId,
      targetNumber,
      trackedCall.state,
      normalizedError,
      correlationId,
    );
  }
}

async function handleBlindTransferGatewayFailure(
  deps: TransferCallControlDeps,
  transferringCall: Call,
  callId: BlindTransferInput["callId"],
  targetNumber: Call["phoneNumber"],
  previousState: Call["state"],
  error: PlatformError,
  correlationId: ReturnType<typeof createCorrelationId>,
): Promise<Result<Call, PlatformError>> {
  const restored = applyCallTransition(transferringCall, "transfer_failed");
  if (!restored.transition.ok) {
    logBlindTransferFailure(
      deps.logger,
      "blind_transfer_failed",
      "blind_transfer",
      transferringCall.state,
      transferringCall.state,
      error,
      correlationId,
    );
    return err(error);
  }

  publishCallTransferFailed(deps.eventPublisher, correlationId, callId, targetNumber, error);
  deps.trackCall(restored.call);
  await applyTransferFailureRecovery(deps, callId, previousState, correlationId);
  logBlindTransferFailure(
    deps.logger,
    "blind_transfer_failed",
    "blind_transfer",
    previousState,
    restored.call.state,
    error,
    correlationId,
  );
  return err(error);
}
