import {
  createCallMutedEvent,
  createCallUnmutedEvent,
  setCallMuted,
  setCallUnmuted,
  type Call,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { logActiveCallControlFailure, publishActiveCallControlFailed } from "./activeCallControlLogging.js";
import type {
  ActiveCallControlDeps,
  MuteCallInput,
  UnmuteCallInput,
} from "./activeCallControlTypes.js";

/**
 * - Purpose: media-side active call control (mute, unmute).
 * - Inputs: active call control deps and operation-specific call id input.
 * - Outputs: updated call entity or normalized platform error.
 */
export async function executeMuteCall(
  deps: ActiveCallControlDeps,
  input: MuteCallInput,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedCallResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedCallResult)) {
    return trackedCallResult;
  }
  const trackedCall = trackedCallResult.value;
  if (trackedCall.muted) {
    return err(createPlatformError("validation_failed", "Call is already muted"));
  }
  if (trackedCall.state !== "Active" && trackedCall.state !== "Held") {
    return err(createPlatformError("validation_failed", "Mute requires active call"));
  }

  try {
    const muteResult = await deps.mediaGateway.muteCall({
      callId: input.callId,
      correlationId,
    });
    if (isErr(muteResult)) {
      logActiveCallControlFailure(
        deps.logger,
        "call_mute_failed",
        "F-005",
        "Media",
        "mute_call",
        trackedCall.state,
        muteResult.error,
        correlationId,
      );
      publishActiveCallControlFailed(
        deps.eventPublisher,
        correlationId,
        input.callId,
        "mute",
        muteResult.error,
      );
      return muteResult;
    }

    const mutedCall = setCallMuted(trackedCall);
    deps.eventPublisher.publish(
      createCallMutedEvent(correlationId, { callId: input.callId }),
    );
    deps.trackCall(mutedCall);
    deps.logger.info("call_mute_succeeded", {
      correlationId,
      featureId: "F-005",
      boundedContext: "Media",
      operation: "mute_call",
      previousState: trackedCall.state,
      nextState: mutedCall.state,
      result: "succeeded",
    });
    return ok(mutedCall);
  } catch (error: unknown) {
    const normalizedError = normalizeUnknownError(error);
    logActiveCallControlFailure(
      deps.logger,
      "call_mute_failed",
      "F-005",
      "Media",
      "mute_call",
      trackedCall.state,
      normalizedError,
      correlationId,
    );
    publishActiveCallControlFailed(
      deps.eventPublisher,
      correlationId,
      input.callId,
      "mute",
      normalizedError,
    );
    return err(normalizedError);
  }
}

export async function executeUnmuteCall(
  deps: ActiveCallControlDeps,
  input: UnmuteCallInput,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const trackedCallResult = deps.resolveTrackedCall(input.callId);
  if (isErr(trackedCallResult)) {
    return trackedCallResult;
  }
  const trackedCall = trackedCallResult.value;
  if (!trackedCall.muted) {
    return err(createPlatformError("validation_failed", "Call is not muted"));
  }
  if (trackedCall.state !== "Active" && trackedCall.state !== "Held") {
    return err(createPlatformError("validation_failed", "Unmute requires active call"));
  }

  try {
    const unmuteResult = await deps.mediaGateway.unmuteCall({
      callId: input.callId,
      correlationId,
    });
    if (isErr(unmuteResult)) {
      logActiveCallControlFailure(
        deps.logger,
        "call_unmute_failed",
        "F-005",
        "Media",
        "unmute_call",
        trackedCall.state,
        unmuteResult.error,
        correlationId,
      );
      publishActiveCallControlFailed(
        deps.eventPublisher,
        correlationId,
        input.callId,
        "unmute",
        unmuteResult.error,
      );
      return unmuteResult;
    }

    const unmutedCall = setCallUnmuted(trackedCall);
    deps.eventPublisher.publish(
      createCallUnmutedEvent(correlationId, { callId: input.callId }),
    );
    deps.trackCall(unmutedCall);
    deps.logger.info("call_unmute_succeeded", {
      correlationId,
      featureId: "F-005",
      boundedContext: "Media",
      operation: "unmute_call",
      previousState: trackedCall.state,
      nextState: unmutedCall.state,
      result: "succeeded",
    });
    return ok(unmutedCall);
  } catch (error: unknown) {
    const normalizedError = normalizeUnknownError(error);
    logActiveCallControlFailure(
      deps.logger,
      "call_unmute_failed",
      "F-005",
      "Media",
      "unmute_call",
      trackedCall.state,
      normalizedError,
      correlationId,
    );
    publishActiveCallControlFailed(
      deps.eventPublisher,
      correlationId,
      input.callId,
      "unmute",
      normalizedError,
    );
    return err(normalizedError);
  }
}
