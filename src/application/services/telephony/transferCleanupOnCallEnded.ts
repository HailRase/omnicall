import {
  createTransferModeCancelledEvent,
  isEstablishedCall,
  type CallId,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { TransferCallControlDeps } from "./transferCallControlTypes.js";

/**
 * - Purpose: tear down transfer mode when the source leg ends remotely during transfer.
 * - Inputs: transfer control deps, ended call id, correlation id.
 * - Outputs: TransferModeCancelled event and optional consultation leg hangup.
 */
export async function executeTransferCleanupOnCallEnded(
  deps: TransferCallControlDeps,
  endedCallId: CallId,
  correlationId: CorrelationId,
): Promise<void> {
  const session = deps.getTransferSession();
  const transferModeSourceCallId = deps.getTransferModeSourceCallId();
  const isTransferSource =
    (session !== null && session.sourceCallId === endedCallId) ||
    transferModeSourceCallId === endedCallId;

  if (!isTransferSource) {
    return;
  }

  const consultationCallId = session?.consultationCallId ?? null;

  deps.setTransferSession(null);
  deps.setTransferModeSourceCallId(null);

  if (consultationCallId !== null) {
    const consultationResult = deps.resolveTrackedCall(consultationCallId);
    if (consultationResult.ok && isEstablishedCall(consultationResult.value)) {
      await deps.hangupCall({ callId: consultationCallId, correlationId });
    }
  }

  deps.eventPublisher.publish(
    createTransferModeCancelledEvent(correlationId, {
      callId: endedCallId,
      ...(consultationCallId !== null ? { consultationCallId } : {}),
    }),
  );
  deps.logger.info("transfer_mode_cancelled_source_ended", {
    correlationId,
    featureId: "F-007",
    boundedContext: "Telephony",
    operation: "transfer_cleanup_on_source_ended",
    previousState: "transfer_mode",
    nextState: "idle",
    result: "cancelled",
  });
}
