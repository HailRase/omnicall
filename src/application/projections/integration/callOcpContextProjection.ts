/**
 * - Purpose: per-call OCP ACD context from get_main_acallid / MainCallIDInfo.
 * - Inputs: SIP call lifecycle marks + resolved OCP wire fields.
 * - Outputs: queue badge state + stored wire for SDK snapshot recovery (ADR-0020).
 */

export type CallOcpContextDirection = "incoming" | "outgoing";

export type CallOcpContextResolveState = "pending" | "resolved" | "unavailable";

export type CallOcpContextResolvedPhase = "progress" | "accepted";

/** Stored MainCallIDInfo for snapshot / reconnect (camelCase in Application). */
export type CallOcpContextAcdWire = Readonly<{
  mainAcallId?: string;
  acallId: string;
  event: string;
  callerId: string;
  calledId: string;
  queue: string;
  userLogin: string;
  phase: CallOcpContextResolvedPhase;
}>;

export type CallOcpContextEntry = Readonly<{
  callId: string;
  direction: CallOcpContextDirection;
  acallId: string | null;
  /** Non-empty ACD queue title; null when direct/internal or unknown. */
  queueName: string | null;
  resolveState: CallOcpContextResolveState;
  /** Full wire when resolved; null while pending/unavailable. */
  acdWire: CallOcpContextAcdWire | null;
}>;

export type CallOcpContextProjection = Readonly<{
  byCallId: Readonly<Record<string, CallOcpContextEntry>>;
}>;

export function initialCallOcpContextProjection(): CallOcpContextProjection {
  return { byCallId: {} };
}

export function markCallOcpContextPending(
  projection: CallOcpContextProjection,
  input: Readonly<{ callId: string; direction: CallOcpContextDirection }>,
): CallOcpContextProjection {
  const previous = projection.byCallId[input.callId];
  return {
    byCallId: {
      ...projection.byCallId,
      [input.callId]: {
        callId: input.callId,
        direction: input.direction,
        acallId: previous?.acallId ?? null,
        queueName: previous?.queueName ?? null,
        resolveState: "pending",
        acdWire: previous?.acdWire ?? null,
      },
    },
  };
}

export function resolveCallOcpContext(
  projection: CallOcpContextProjection,
  input: Readonly<{
    callId: string;
    acallId: string;
    queueName: string | null;
    acdWire: CallOcpContextAcdWire;
  }>,
): CallOcpContextProjection {
  const previous = projection.byCallId[input.callId];
  if (previous === undefined) {
    return projection;
  }
  const normalizedQueue =
    input.queueName !== null && input.queueName.trim().length > 0
      ? input.queueName.trim()
      : null;
  return {
    byCallId: {
      ...projection.byCallId,
      [input.callId]: {
        ...previous,
        acallId: input.acallId,
        queueName: normalizedQueue,
        resolveState: "resolved",
        acdWire: input.acdWire,
      },
    },
  };
}

export function markCallOcpContextUnavailable(
  projection: CallOcpContextProjection,
  callId: string,
): CallOcpContextProjection {
  const previous = projection.byCallId[callId];
  if (previous === undefined || previous.resolveState !== "pending") {
    return projection;
  }
  return {
    byCallId: {
      ...projection.byCallId,
      [callId]: {
        ...previous,
        resolveState: "unavailable",
      },
    },
  };
}

export function clearCallOcpContext(
  projection: CallOcpContextProjection,
  callId: string,
): CallOcpContextProjection {
  if (projection.byCallId[callId] === undefined) {
    return projection;
  }
  const next = { ...projection.byCallId };
  delete next[callId];
  return { byCallId: next };
}

export function resetCallOcpContextProjection(): CallOcpContextProjection {
  return initialCallOcpContextProjection();
}
