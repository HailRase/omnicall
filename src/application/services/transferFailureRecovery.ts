import {
  applyCallTransition,
  createCallAutoUnheldAfterTransferFailureEvent,
  createCallHeldEvent,
  isEstablishedCall,
  type Call,
  type CallId,
  type CallState,
  type TransferSession,
} from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { ResumeCallInput } from "./activeCallControlTypes.js";
import type { TransferCallControlDeps } from "./transferCallControlTypes.js";

export type TransferFailureRecoveryDeps = TransferCallControlDeps;

/**
 * - Purpose: restore held/active state and optional auto-unhold after transfer failure.
 * - Inputs: transfer deps, call id, pre-transfer state, correlation id.
 * - Outputs: updated call snapshot and optional CallAutoUnheldAfterTransferFailure event.
 */
export async function applyTransferFailureRecovery(
  deps: TransferFailureRecoveryDeps,
  callId: CallId,
  previousState: CallState,
  correlationId: CorrelationId,
): Promise<Call | null> {
  const trackedResult = deps.resolveTrackedCall(callId);
  if (isErr(trackedResult)) {
    return null;
  }

  let call = trackedResult.value;
  const settings = await deps.settingsRepository.getMultiCallSettings();
  const transferSession = deps.getTransferSession();

  if (hasActiveConsultationLeg(transferSession)) {
    return call;
  }

  if (previousState === "Held" && call.state === "Active") {
    if (settings.autoUnholdOnTransferFailure !== false) {
      deps.eventPublisher.publish(
        createCallAutoUnheldAfterTransferFailureEvent(correlationId, { callId }),
      );
      deps.logger.info("transfer_failure_auto_unhold", {
        correlationId,
        featureId: "F-006",
        boundedContext: "Telephony",
        operation: "auto_unhold_after_transfer_failure",
        previousState: "Held",
        nextState: "Active",
        result: "unheld",
      });
      return call;
    }

    const held = applyCallTransition(call, "hold_requested");
    if (held.transition.ok) {
      call = held.call;
      deps.trackCall(call);
      deps.eventPublisher.publish(createCallHeldEvent(correlationId, { callId }));
    }
    return call;
  }

  if (
    settings.autoUnholdOnTransferFailure !== false &&
    previousState === "Held" &&
    call.state === "Held" &&
    isEstablishedCall(call)
  ) {
    const resumeInput: ResumeCallInput = { callId, correlationId };
    const resumeResult = await deps.resumeCall(resumeInput);
    if (resumeResult.ok) {
      call = resumeResult.value;
      deps.eventPublisher.publish(
        createCallAutoUnheldAfterTransferFailureEvent(correlationId, { callId }),
      );
      deps.logger.info("transfer_failure_auto_unhold", {
        correlationId,
        featureId: "F-006",
        boundedContext: "Telephony",
        operation: "auto_unhold_after_transfer_failure",
        previousState: "Held",
        nextState: "Active",
        result: "unheld",
      });
    }
  }

  return call;
}

function hasActiveConsultationLeg(session: TransferSession | null): boolean {
  if (session === null || session.consultationCallId === null) {
    return false;
  }
  return (
    session.phase === "consultation_active" ||
    session.phase === "attended_transfer_failed" ||
    session.phase === "attended_transfer_in_progress"
  );
}
