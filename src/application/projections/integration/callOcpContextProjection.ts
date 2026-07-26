/**
 * - Purpose: per-call OCP ACD context (queue name) from get_main_acallid responses.
 * - Inputs: SIP call lifecycle marks + OCP calls entity payloads.
 * - Outputs: serializable map for incoming queue badges (hide when empty = direct/internal).
 */

export type CallOcpContextDirection = "incoming" | "outgoing";

export type CallOcpContextResolveState = "pending" | "resolved" | "unavailable";

export type CallOcpContextEntry = Readonly<{
  callId: string;
  direction: CallOcpContextDirection;
  acallId: string | null;
  /** Non-empty ACD queue title; null when direct/internal or unknown. */
  queueName: string | null;
  resolveState: CallOcpContextResolveState;
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
  const { [callId]: _removed, ...rest } = projection.byCallId;
  return { byCallId: rest };
}

export function resetCallOcpContextProjection(): CallOcpContextProjection {
  return initialCallOcpContextProjection();
}
