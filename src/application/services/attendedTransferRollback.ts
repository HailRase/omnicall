import type { Call, CallId, CallState } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { publishConsultationCallFailed } from "./attendedTransferLogging.js";
import type { StartConsultationInput, TransferCallControlDeps } from "./transferCallControlTypes.js";

const CONSULTATION_ABORT_PHASES = new Set([
  "consultation_dialing",
  "consultation_active",
  "attended_transfer_failed",
]);

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
 * - Purpose: hang up consultation leg on transfer cancel without failure semantics.
 * - Inputs: transfer deps, call ids, correlation id.
 * - Outputs: restored source state after session cleanup.
 */
export async function cleanupConsultationLegOnCancel(
  deps: TransferCallControlDeps,
  correlationId: CorrelationId,
  sourceCallId: StartConsultationInput["sourceCallId"],
  consultationCallId: Call["id"],
): Promise<CallState> {
  const restoredSourceState = resolveConsultationRollbackSourceState(deps, sourceCallId);
  await deps.hangupCall({ callId: consultationCallId, correlationId });
  deps.setTransferSession(null);
  return restoredSourceState;
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

/**
 * - Purpose: rollback attended-transfer session when consultation leg ends or fails remotely.
 * - Inputs: transfer deps, consultation call id, failure reason, correlation id.
 * - Outputs: true when ConsultationCallFailed was published and session cleared.
 */
export function publishConsultationLegAbortion(
  deps: TransferCallControlDeps,
  correlationId: CorrelationId,
  consultationCallId: CallId,
  reason: string,
): boolean {
  const session = deps.getTransferSession();
  if (session === null || session.consultationCallId !== consultationCallId) {
    return false;
  }
  if (!CONSULTATION_ABORT_PHASES.has(session.phase)) {
    return false;
  }

  const restoredSourceState = resolveConsultationRollbackSourceState(
    deps,
    session.sourceCallId,
  );
  deps.setTransferSession(null);
  publishConsultationCallFailed(
    deps.eventPublisher,
    correlationId,
    session.sourceCallId,
    consultationCallId,
    restoredSourceState,
    reason,
  );
  return true;
}
