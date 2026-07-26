/**
 * - Purpose: domain signal when OCP MainCallIDInfo resolves for a SIP call.
 * - Public SDK: `call:acd-context` carries OCP wire fields (ADR-0020, capability-gated);
 *   additive `queueLabel` on `call:*` remains desktop-safe (no wire ids).
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type CallOcpContextResolvedDirection = "incoming" | "outgoing";

/** Semantic phase of the OCP sync that produced this context. */
export type CallOcpContextResolvedPhase = "progress" | "accepted";

/** OCP MainCallIDInfo fields (camelCase in Domain; snake_case only at SDK boundary). */
export type CallOcpContextResolvedWire = Readonly<{
  mainAcallId?: string;
  acallId: string;
  event: string;
  callerId: string;
  calledId: string;
  /** May be empty for direct/internal calls. */
  queue: string;
}>;

export type CallOcpContextResolvedEvent = ReturnType<
  typeof createCallOcpContextResolvedEvent
>;

export function createCallOcpContextResolvedEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    callId: string;
    direction: CallOcpContextResolvedDirection;
    /**
     * ACD queue title for UI / additive SDK `queueLabel`.
     * Empty when OCP returned an empty queue (direct/internal).
     */
    queueName: string;
    phase: CallOcpContextResolvedPhase;
    /** Operator / local party label (OCP login) — required for SDK `user_login`. */
    localPartyLabel: string;
    ocp: CallOcpContextResolvedWire;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "CallOcpContextResolved",
    {
      callId: string;
      direction: CallOcpContextResolvedDirection;
      queueName: string;
      phase: CallOcpContextResolvedPhase;
      localPartyLabel: string;
      ocp: CallOcpContextResolvedWire;
      featureId: typeof OCP_FEATURE_ID;
    }
  >
> {
  const localPartyLabel = input.localPartyLabel.trim().slice(0, 128);
  const queue = input.ocp.queue.trim().slice(0, 128);
  return createDomainEvent("CallOcpContextResolved", correlationId, {
    callId: input.callId,
    direction: input.direction,
    queueName: input.queueName.trim().slice(0, 128),
    phase: input.phase,
    localPartyLabel,
    ocp: {
      ...(input.ocp.mainAcallId !== undefined &&
      input.ocp.mainAcallId.trim().length > 0
        ? { mainAcallId: input.ocp.mainAcallId.trim().slice(0, 256) }
        : {}),
      acallId: input.ocp.acallId.trim().slice(0, 256),
      event: input.ocp.event.trim().slice(0, 128),
      callerId: input.ocp.callerId.trim().slice(0, 128),
      calledId: input.ocp.calledId.trim().slice(0, 128),
      queue,
    },
    featureId: OCP_FEATURE_ID,
  });
}
