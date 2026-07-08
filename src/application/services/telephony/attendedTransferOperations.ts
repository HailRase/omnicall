import {
  applyCallTransition,
  createAttendedTransferCompletedEvent,
  createAttendedTransferRequestedEvent,
  createCallEndedEvent,
  createCallId,
  createConsultationCallRequestedEvent,
  createConsultationCallStartedEvent,
  createTransferSession,
  evaluateCompleteAttendedTransferEligibility,
  evaluateStartConsultationEligibility,
  transitionTransferSession,
  type Call,
  type CallState,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import {
  logAttendedTransferFailure,
  publishAttendedTransferFailed,
} from "./attendedTransferLogging.js";
import { rollbackConsultationStart } from "./attendedTransferRollback.js";
import { applyTransferFailureRecovery } from "./transferFailureRecovery.js";
import {
  markCallLegEndedAfterTransfer,
  restoreSourceAfterAttendedTransferFailure,
} from "./attendedTransferRecovery.js";
import type {
  AttendedTransferInput,
  StartConsultationInput,
  TransferCallControlDeps,
} from "./transferCallControlTypes.js";

/**
 * - Purpose: start consultation call while source held via existing makeCall path.
 * - Inputs: transfer control deps and start consultation command.
 * - Outputs: active consultation call or normalized platform error.
 */
export async function executeStartConsultation(
  deps: TransferCallControlDeps,
  input: StartConsultationInput,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const sourceResult = deps.resolveTrackedCall(input.sourceCallId);
  if (isErr(sourceResult)) {
    return err(createPlatformError("not_found", "no_source_call"));
  }
  const sourceCall = sourceResult.value;

  const settings = await deps.settingsRepository.getMultiCallSettings();
  const eligibility = evaluateStartConsultationEligibility({
    sourceCall,
    transferSession: deps.getTransferSession(),
    multiCallSettings: settings,
    targetNumber: input.targetNumber,
  });
  if (!eligibility.ok) {
    return err(createPlatformError("validation_failed", eligibility.reason));
  }

  const consultationCallId =
    input.consultationCallId ?? createCallId(`consult-${correlationId}`);
  const session = createTransferSession(
    input.sourceCallId,
    eligibility.targetNumber,
    consultationCallId,
  );
  deps.setTransferSession(session);
  deps.setTransferModeSourceCallId(null);

  deps.eventPublisher.publish(
    createConsultationCallRequestedEvent(correlationId, {
      sourceCallId: input.sourceCallId,
      consultationCallId,
      targetNumber: eligibility.targetNumber,
    }),
  );
  deps.logger.info("consultation_call_requested", {
    correlationId,
    featureId: "F-007",
    boundedContext: "Telephony",
    operation: "start_consultation",
    previousState: sourceCall.state,
    nextState: "consultation_dialing",
    result: "requested",
  });

  const makeCallResult = await deps.makeCall({
    callId: consultationCallId,
    phoneNumber: eligibility.targetNumber,
    correlationId,
  });
  if (isErr(makeCallResult)) {
    await rollbackConsultationStart(
      deps,
      correlationId,
      input.sourceCallId,
      consultationCallId,
      makeCallResult.error.message,
    );
    deps.logger.error("consultation_call_failed", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "start_consultation",
      previousState: sourceCall.state,
      nextState: sourceCall.state,
      result: "failed",
      normalizedError: makeCallResult.error.message,
    });
    return makeCallResult;
  }

  const consultationCall = makeCallResult.value;

  if (isConsultationDialingState(consultationCall.state)) {
    deps.logger.info("consultation_call_dialing", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "start_consultation",
      previousState: "consultation_dialing",
      nextState: consultationCall.state,
      result: "dialing",
    });
    return ok(consultationCall);
  }

  if (consultationCall.state !== "Active") {
    await rollbackConsultationStart(
      deps,
      correlationId,
      input.sourceCallId,
      consultationCallId,
      "consultation_not_active",
    );
    return err(createPlatformError("operation_failed", "consultation_not_active"));
  }

  const activated = activateConsultationSession(
    deps,
    correlationId,
    input.sourceCallId,
    consultationCallId,
  );
  if (!activated.ok) {
    await rollbackConsultationStart(
      deps,
      correlationId,
      input.sourceCallId,
      consultationCallId,
      activated.reason,
    );
    deps.logger.error("consultation_session_transition_failed", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "start_consultation",
      previousState: "consultation_dialing",
      nextState: sourceCall.state,
      result: "failed",
      normalizedError: activated.reason,
    });
    return err(createPlatformError("validation_failed", activated.reason));
  }

  return ok(consultationCall);
}

/**
 * - Purpose: promote consultation session to active after deferred outbound answer.
 * - Inputs: transfer control deps, consultation call id, correlation id.
 * - Outputs: ConsultationCallStarted event when session was dialing.
 */
export function completeConsultationWhenAnswered(
  deps: TransferCallControlDeps,
  consultationCallId: Call["id"],
  correlationId: CorrelationId,
): void {
  const session = deps.getTransferSession();
  if (session === null || session.phase !== "consultation_dialing") {
    return;
  }
  if (session.consultationCallId !== consultationCallId) {
    return;
  }

  const consultationResult = deps.resolveTrackedCall(consultationCallId);
  if (isErr(consultationResult) || consultationResult.value.state !== "Active") {
    return;
  }

  const sourceResult = deps.resolveTrackedCall(session.sourceCallId);

  const activated = activateConsultationSession(
    deps,
    correlationId,
    session.sourceCallId,
    consultationCallId,
  );
  if (!activated.ok) {
    const sourceState = isErr(sourceResult) ? "Held" : sourceResult.value.state;
    void rollbackConsultationStart(
      deps,
      correlationId,
      session.sourceCallId,
      consultationCallId,
      activated.reason,
    );
    deps.logger.error("consultation_session_transition_failed", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "complete_consultation",
      previousState: "consultation_dialing",
      nextState: sourceState,
      result: "failed",
      normalizedError: activated.reason,
    });
  }
}

function isConsultationDialingState(state: CallState): boolean {
  return state === "Connecting" || state === "Ringing";
}

function activateConsultationSession(
  deps: TransferCallControlDeps,
  correlationId: CorrelationId,
  sourceCallId: StartConsultationInput["sourceCallId"],
  consultationCallId: Call["id"],
): Readonly<{ ok: true } | { ok: false; reason: string }> {
  const currentSession = deps.getTransferSession();
  const started = transitionTransferSession(
    currentSession,
    "consultation_started",
    consultationCallId,
  );
  if (!started.ok) {
    return { ok: false, reason: started.reason };
  }
  deps.setTransferSession(started.session);

  deps.eventPublisher.publish(
    createConsultationCallStartedEvent(correlationId, {
      sourceCallId,
      consultationCallId,
    }),
  );
  deps.logger.info("consultation_call_started", {
    correlationId,
    featureId: "F-007",
    boundedContext: "Telephony",
    operation: "start_consultation",
    previousState: "consultation_dialing",
    nextState: "consultation_active",
    result: "succeeded",
  });
  return { ok: true };
}

/**
 * - Purpose: complete attended transfer via gateway and end both call legs.
 * - Inputs: transfer control deps and attended transfer command.
 * - Outputs: ended source call snapshot or normalized platform error.
 */
export async function executeAttendedTransfer(
  deps: TransferCallControlDeps,
  input: AttendedTransferInput,
): Promise<Result<Call, PlatformError>> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const sourceResult = deps.resolveTrackedCall(input.sourceCallId);
  if (isErr(sourceResult)) {
    return err(createPlatformError("not_found", "no_source_call"));
  }
  const consultationResult = deps.resolveTrackedCall(input.consultationCallId);
  if (isErr(consultationResult)) {
    return err(createPlatformError("not_found", "consultation_not_active"));
  }

  const sourceCall = sourceResult.value;
  const consultationCall = consultationResult.value;
  const previousSourceState = sourceCall.state;

  const eligibility = evaluateCompleteAttendedTransferEligibility({
    sourceCall,
    consultationCall,
    transferSession: deps.getTransferSession(),
  });
  if (!eligibility.ok) {
    return err(createPlatformError("validation_failed", eligibility.reason));
  }

  const session = deps.getTransferSession();
  const requestedSession = transitionTransferSession(session, "attended_transfer_requested");
  if (!requestedSession.ok) {
    return err(createPlatformError("validation_failed", requestedSession.reason));
  }
  deps.setTransferSession(requestedSession.session);

  const transferring = applyCallTransition(sourceCall, "transfer_requested");
  if (!transferring.transition.ok) {
    return err(createPlatformError("validation_failed", "transfer_not_allowed"));
  }
  deps.trackCall(transferring.call);

  deps.eventPublisher.publish(
    createAttendedTransferRequestedEvent(correlationId, {
      sourceCallId: input.sourceCallId,
      consultationCallId: input.consultationCallId,
    }),
  );
  deps.logger.info("attended_transfer_requested", {
    correlationId,
    featureId: "F-007",
    boundedContext: "Telephony",
    operation: "attended_transfer",
    previousState: previousSourceState,
    nextState: "Transferring",
    result: "requested",
  });

  try {
    const gatewayResult = await deps.telephonyGateway.attendedTransfer({
      sourceCallId: input.sourceCallId,
      consultationCallId: input.consultationCallId,
      correlationId,
    });
    if (isErr(gatewayResult)) {
      return await handleAttendedTransferGatewayFailure(
        deps,
        transferring.call,
        previousSourceState,
        gatewayResult.error,
        correlationId,
        input,
      );
    }

    const completedSource = markCallLegEndedAfterTransfer(transferring.call);
    const completedConsultation = markCallLegEndedAfterTransfer(consultationCall);

    deps.eventPublisher.publish(
      createAttendedTransferCompletedEvent(correlationId, {
        sourceCallId: input.sourceCallId,
        consultationCallId: input.consultationCallId,
      }),
    );
    await deps.mediaGateway.stopTone({
      callId: input.sourceCallId,
      correlationId,
    });
    await deps.mediaGateway.stopTone({
      callId: input.consultationCallId,
      correlationId,
    });
    deps.eventPublisher.publish(
      createCallEndedEvent(correlationId, { callId: input.sourceCallId }),
    );
    deps.eventPublisher.publish(
      createCallEndedEvent(correlationId, { callId: input.consultationCallId }),
    );
    deps.trackCall(completedSource);
    deps.trackCall(completedConsultation);
    deps.clearIncomingCallById(input.sourceCallId);
    deps.clearIncomingCallById(input.consultationCallId);
    deps.setTransferSession(null);

    deps.logger.info("attended_transfer_succeeded", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "attended_transfer",
      previousState: "Transferring",
      nextState: "Ended",
      result: "succeeded",
    });
    return ok(completedSource);
  } catch (error: unknown) {
    const normalizedError = normalizeUnknownError(error);
    return await handleAttendedTransferGatewayFailure(
      deps,
      transferring.call,
      previousSourceState,
      normalizedError,
      correlationId,
      input,
    );
  }
}

async function handleAttendedTransferGatewayFailure(
  deps: TransferCallControlDeps,
  transferringSource: Call,
  previousSourceState: Call["state"],
  error: PlatformError,
  correlationId: ReturnType<typeof createCorrelationId>,
  input: AttendedTransferInput,
): Promise<Result<Call, PlatformError>> {
  const restoredSource = restoreSourceAfterAttendedTransferFailure(
    transferringSource,
    previousSourceState,
  );
  deps.trackCall(restoredSource);

  const session = deps.getTransferSession();
  const failedSession = transitionTransferSession(session, "attended_transfer_failed");
  if (failedSession.ok) {
    deps.setTransferSession(failedSession.session);
  }

  publishAttendedTransferFailed(
    deps.eventPublisher,
    correlationId,
    input.sourceCallId,
    input.consultationCallId,
    restoredSource.state,
    error,
  );
  await applyTransferFailureRecovery(
    deps,
    input.sourceCallId,
    previousSourceState,
    correlationId,
  );
  logAttendedTransferFailure(
    deps.logger,
    previousSourceState,
    restoredSource.state,
    error,
    correlationId,
  );
  return err(error);
}

