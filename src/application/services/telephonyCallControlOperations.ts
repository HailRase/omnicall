import {
  applyCallTransition,
  createCallEndedEvent,
  createCallHangupRequestedEvent,
  createCallHeldEvent,
  createCallResumedEvent,
  type Call,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import {
  logActiveCallControlFailure,
  publishActiveCallControlFailed,
} from "./activeCallControlLogging.js";
import type {
  ActiveCallControlDeps,
  HangupCallInput,
  HoldCallInput,
  ResumeCallInput,
} from "./activeCallControlTypes.js";
import { cancelScheduledTonePlaybackStop } from "./scheduleTonePlaybackStop.js";

type ExclusiveHoldEnforcer = (
  targetCallId: ResumeCallInput["callId"],
  correlationId: NonNullable<ResumeCallInput["correlationId"]>,
) => Promise<Result<void, PlatformError>>;

/**
 * - Purpose: telephony-side active call control (hangup, hold, resume).
 * - Inputs: active call control deps and operation-specific call id input.
 * - Outputs: updated call entity or normalized platform error.
 */
export async function executeHangupCall(
  deps: ActiveCallControlDeps,
  input: HangupCallInput,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedCallResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedCallResult)) {
    return trackedCallResult;
  }
  const trackedCall = trackedCallResult.value;

  const ending = applyCallTransition(trackedCall, "hangup_requested");
  if (!ending.transition.ok) {
    return err(createPlatformError("validation_failed", ending.transition.reason));
  }

  try {
    const gatewayResult = await deps.telephonyGateway.hangup({
      callId: input.callId,
      correlationId,
    });
    if (isErr(gatewayResult)) {
      logActiveCallControlFailure(
        deps.logger,
        "call_hangup_failed",
        "F-004",
        "Telephony",
        "hangup_call",
        trackedCall.state,
        gatewayResult.error,
        correlationId,
      );
      publishActiveCallControlFailed(
        deps.eventPublisher,
        correlationId,
        input.callId,
        "hangup",
        gatewayResult.error,
      );
      return gatewayResult;
    }

    deps.eventPublisher.publish(
      createCallHangupRequestedEvent(correlationId, { callId: input.callId }),
    );
    deps.logger.info("call_hangup_requested", {
      correlationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "hangup_call",
      previousState: trackedCall.state,
      nextState: "Ending",
      result: "requested",
    });

    const ended = applyCallTransition(ending.call, "hangup_completed");
    if (!ended.transition.ok) {
      return err(createPlatformError("validation_failed", ended.transition.reason));
    }

    cancelScheduledTonePlaybackStop(input.callId);
    await deps.mediaGateway.stopTone({ callId: input.callId, correlationId });
    deps.eventPublisher.publish(
      createCallEndedEvent(correlationId, { callId: input.callId }),
    );
    deps.trackCall(ended.call);
    deps.clearIncomingCallById(input.callId);

    deps.logger.info("call_hangup_succeeded", {
      correlationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "hangup_call",
      previousState: trackedCall.state,
      nextState: ended.call.state,
      result: "succeeded",
    });
    return ok(ended.call);
  } catch (error: unknown) {
    const normalizedError = normalizeUnknownError(error);
    logActiveCallControlFailure(
      deps.logger,
      "call_hangup_failed",
      "F-004",
      "Telephony",
      "hangup_call",
      trackedCall.state,
      normalizedError,
      correlationId,
    );
    publishActiveCallControlFailed(
      deps.eventPublisher,
      correlationId,
      input.callId,
      "hangup",
      normalizedError,
    );
    return err(normalizedError);
  }
}

export async function executeHoldCall(
  deps: ActiveCallControlDeps,
  input: HoldCallInput,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedCallResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedCallResult)) {
    return trackedCallResult;
  }
  const trackedCall = trackedCallResult.value;
  const held = applyCallTransition(trackedCall, "hold_requested");
  if (!held.transition.ok) {
    return err(createPlatformError("validation_failed", held.transition.reason));
  }

  try {
    const holdResult = await deps.telephonyGateway.holdCall({
      callId: input.callId,
      correlationId,
    });
    if (isErr(holdResult)) {
      logActiveCallControlFailure(
        deps.logger,
        "call_hold_failed",
        "F-004",
        "Telephony",
        "hold_call",
        trackedCall.state,
        holdResult.error,
        correlationId,
      );
      publishActiveCallControlFailed(
        deps.eventPublisher,
        correlationId,
        input.callId,
        "hold",
        holdResult.error,
      );
      return holdResult;
    }

    deps.eventPublisher.publish(
      createCallHeldEvent(correlationId, { callId: input.callId }),
    );
    deps.trackCall(held.call);
    deps.logger.info("call_hold_succeeded", {
      correlationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "hold_call",
      previousState: trackedCall.state,
      nextState: held.call.state,
      result: "succeeded",
    });
    return ok(held.call);
  } catch (error: unknown) {
    const normalizedError = normalizeUnknownError(error);
    logActiveCallControlFailure(
      deps.logger,
      "call_hold_failed",
      "F-004",
      "Telephony",
      "hold_call",
      trackedCall.state,
      normalizedError,
      correlationId,
    );
    publishActiveCallControlFailed(
      deps.eventPublisher,
      correlationId,
      input.callId,
      "hold",
      normalizedError,
    );
    return err(normalizedError);
  }
}

export async function executeResumeCall(
  deps: ActiveCallControlDeps,
  input: ResumeCallInput,
  exclusiveHoldEnforcer: ExclusiveHoldEnforcer | null = null,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedCallResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedCallResult)) {
    return trackedCallResult;
  }
  const trackedCall = trackedCallResult.value;

  if (exclusiveHoldEnforcer !== null) {
    const exclusiveHoldResult = await exclusiveHoldEnforcer(
      input.callId,
      correlationId,
    );
    if (isErr(exclusiveHoldResult)) {
      return err(exclusiveHoldResult.error);
    }
  }

  const resumed = applyCallTransition(trackedCall, "resumed");
  if (!resumed.transition.ok) {
    return err(createPlatformError("validation_failed", resumed.transition.reason));
  }

  try {
    const resumeResult = await deps.telephonyGateway.resumeCall({
      callId: input.callId,
      correlationId,
    });
    if (isErr(resumeResult)) {
      logActiveCallControlFailure(
        deps.logger,
        "call_resume_failed",
        "F-004",
        "Telephony",
        "resume_call",
        trackedCall.state,
        resumeResult.error,
        correlationId,
      );
      publishActiveCallControlFailed(
        deps.eventPublisher,
        correlationId,
        input.callId,
        "resume",
        resumeResult.error,
      );
      return resumeResult;
    }

    deps.eventPublisher.publish(
      createCallResumedEvent(correlationId, { callId: input.callId }),
    );
    deps.trackCall(resumed.call);
    deps.logger.info("call_resume_succeeded", {
      correlationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "resume_call",
      previousState: trackedCall.state,
      nextState: resumed.call.state,
      result: "succeeded",
    });
    return ok(resumed.call);
  } catch (error: unknown) {
    const normalizedError = normalizeUnknownError(error);
    logActiveCallControlFailure(
      deps.logger,
      "call_resume_failed",
      "F-004",
      "Telephony",
      "resume_call",
      trackedCall.state,
      normalizedError,
      correlationId,
    );
    publishActiveCallControlFailed(
      deps.eventPublisher,
      correlationId,
      input.callId,
      "resume",
      normalizedError,
    );
    return err(normalizedError);
  }
}
