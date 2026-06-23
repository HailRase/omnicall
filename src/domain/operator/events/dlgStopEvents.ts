import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallId } from "../../telephony/CallId.js";
import type { MainAcallId } from "../ocp/MainAcallId.js";

export type DlgStopTrigger = "call_ended" | "call_failed" | "incoming_ended_before_answer";

export type DlgStopRequestedEvent = ReturnType<typeof createDlgStopRequestedEvent>;
export type DlgStopSentEvent = ReturnType<typeof createDlgStopSentEvent>;

/**
 * - Purpose: record intent to send OCP dlg_stop for a call (LF-064).
 * - Inputs: correlationId, callId, mainAcallId, trigger.
 * - Outputs: DlgStopRequested domain event.
 */
export function createDlgStopRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    mainAcallId: MainAcallId;
    trigger: DlgStopTrigger;
  }>,
) {
  return createDomainEvent("DlgStopRequested", correlationId, payload);
}

/**
 * - Purpose: confirm dlg_stop was sent through OCP gateway (LF-064).
 * - Inputs: correlationId, callId, mainAcallId, trigger.
 * - Outputs: DlgStopSent domain event.
 */
export function createDlgStopSentEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    mainAcallId: MainAcallId;
    trigger: DlgStopTrigger;
  }>,
) {
  return createDomainEvent("DlgStopSent", correlationId, payload);
}
