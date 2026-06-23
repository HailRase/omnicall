import type { Call, CallState } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { publishConsultationCallFailed } from "./attendedTransferLogging.js";
import type { StartConsultationInput, TransferCallControlDeps } from "./transferCallControlTypes.js";

/**
 * - Purpose: resolve source call state for consultation rollback event payload.
 * - Inputs: transfer control deps and source call id.
 * - Outputs: Active or Held snapshot state with Held fallback.
 */
export function resolveConsultationRollbackSourceState(
  deps: TransferCallControlDeps,
  sourceCallId: StartConsultationInput["sourceCallId"],
): CallState {
  const sourceResult = deps.resolveTrackedCall(sourceCallId);
  if (isErr(sourceResult)) {
    return "Held";
  }
  if (sourceResult.value.state === "Active" || sourceResult.value.state === "Held") {
    return sourceResult.value.state;
  }
  return "Held";
}

/**
 * - Purpose: rollback consultation start and cleanup phantom consultation leg.
 * - Inputs: transfer deps, call ids, failure reason, correlation id.
 * - Outputs: ConsultationCallFailed event and cleared transfer session.
 */
export async function rollbackConsultationStart(
  deps: TransferCallControlDeps,
  correlationId: CorrelationId,
  sourceCallId: StartConsultationInput["sourceCallId"],
  consultationCallId: Call["id"],
  reason: string,
): Promise<void> {
  const restoredSourceState = resolveConsultationRollbackSourceState(deps, sourceCallId);
  await deps.hangupCall({ callId: consultationCallId, correlationId });
  deps.setTransferSession(null);
  publishConsultationCallFailed(
    deps.eventPublisher,
    correlationId,
    sourceCallId,
    consultationCallId,
    restoredSourceState,
    reason,
  );
}
