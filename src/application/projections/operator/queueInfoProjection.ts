import type { DomainEvent } from "@domain/index.js";
import { createCallId, type CallId } from "@domain/telephony/CallId.js";

export type QueueLabelState = "hidden" | "loading" | "ready" | "na";

export type QueueInfoProjection = Readonly<{
  isOcpSyncAvailable: boolean;
  queueNameByCallId: ReadonlyMap<string, string>;
  queueLoadingSinceByCallId: ReadonlyMap<string, number>;
}>;

export const QUEUE_LABEL_NA_TIMEOUT_MS = 5000;

export const initialQueueInfoProjection = (): QueueInfoProjection => ({
  isOcpSyncAvailable: false,
  queueNameByCallId: new Map(),
  queueLoadingSinceByCallId: new Map(),
});

/**
 * - Purpose: project queue names by callId from OCP sync events (LF-037).
 * - Inputs: domain events.
 * - Outputs: immutable queue info read model.
 */
export function reduceQueueInfoProjection(
  projection: QueueInfoProjection,
  event: DomainEvent,
): QueueInfoProjection {
  switch (event.type) {
    case "StartupModeResolved": {
      const resolution = event["resolution"];
      if (
        resolution !== undefined &&
        typeof resolution === "object" &&
        resolution !== null &&
        "action" in resolution &&
        resolution.action === "sip_only_ready"
      ) {
        return initialQueueInfoProjection();
      }
      return projection;
    }
    case "OcpAuthenticationSucceeded":
      return {
        ...projection,
        isOcpSyncAvailable: true,
      };
    case "OcpAuthenticationFailed":
      return {
        ...initialQueueInfoProjection(),
        isOcpSyncAvailable: false,
      };
    case "QueueInfoReceived": {
      const callId = parseCallId(event["callId"]);
      const queueName = asOptionalString(event["queueName"]);
      if (callId === null || queueName === null) {
        return projection;
      }
      return clearQueueLoadingSince(setQueueName(projection, callId, queueName), callId);
    }
    case "IncomingCallReceived": {
      const callId = parseCallId(event["callId"]);
      if (callId === null || !projection.isOcpSyncAvailable) {
        return projection;
      }
      return setQueueLoadingSince(projection, callId, parseOccurredAtMs(event.occurredAt));
    }
    case "CallEnded":
    case "IncomingCallEndedBeforeAnswer": {
      const callId = parseCallId(event["callId"]);
      if (callId === null) {
        return projection;
      }
      return clearQueueEntry(projection, callId);
    }
    default:
      return projection;
  }
}

export function getQueueLoadingSinceForCall(
  projection: QueueInfoProjection,
  callId: CallId | string | null,
): number | null {
  if (callId === null || callId.length === 0) {
    return null;
  }
  return projection.queueLoadingSinceByCallId.get(callId) ?? null;
}

export function getQueueNameForCall(
  projection: QueueInfoProjection,
  callId: CallId | string | null,
): string | null {
  if (callId === null || callId.length === 0) {
    return null;
  }
  return projection.queueNameByCallId.get(callId) ?? null;
}

export function deriveQueueLabelState(
  projection: QueueInfoProjection,
  callId: CallId | string | null,
  options?: Readonly<{ nowMs?: number; naTimeoutMs?: number }>,
): QueueLabelState {
  if (!projection.isOcpSyncAvailable) {
    return "hidden";
  }
  if (callId === null || callId.length === 0) {
    return "hidden";
  }
  const queueName = getQueueNameForCall(projection, callId);
  if (queueName !== null) {
    return "ready";
  }
  const loadingSince = getQueueLoadingSinceForCall(projection, callId);
  if (loadingSince === null) {
    return "loading";
  }
  const nowMs = options?.nowMs ?? Date.now();
  const naTimeoutMs = options?.naTimeoutMs ?? QUEUE_LABEL_NA_TIMEOUT_MS;
  if (nowMs - loadingSince >= naTimeoutMs) {
    return "na";
  }
  return "loading";
}

function clearQueueEntry(
  projection: QueueInfoProjection,
  callId: CallId,
): QueueInfoProjection {
  const clearedName = clearQueueName(projection, callId);
  return clearQueueLoadingSince(clearedName, callId);
}

function setQueueLoadingSince(
  projection: QueueInfoProjection,
  callId: CallId,
  sinceMs: number,
): QueueInfoProjection {
  const nextMap = new Map(projection.queueLoadingSinceByCallId);
  nextMap.set(callId, sinceMs);
  return {
    ...projection,
    queueLoadingSinceByCallId: nextMap,
  };
}

function clearQueueLoadingSince(
  projection: QueueInfoProjection,
  callId: CallId,
): QueueInfoProjection {
  if (!projection.queueLoadingSinceByCallId.has(callId)) {
    return projection;
  }
  const nextMap = new Map(projection.queueLoadingSinceByCallId);
  nextMap.delete(callId);
  return {
    ...projection,
    queueLoadingSinceByCallId: nextMap,
  };
}

function parseOccurredAtMs(occurredAt: string): number {
  const parsed = Date.parse(occurredAt);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function setQueueName(
  projection: QueueInfoProjection,
  callId: CallId,
  queueName: string,
): QueueInfoProjection {
  const nextMap = new Map(projection.queueNameByCallId);
  nextMap.set(callId, queueName);
  return {
    ...projection,
    queueNameByCallId: nextMap,
  };
}

function clearQueueName(
  projection: QueueInfoProjection,
  callId: CallId,
): QueueInfoProjection {
  if (!projection.queueNameByCallId.has(callId)) {
    return projection;
  }
  const nextMap = new Map(projection.queueNameByCallId);
  nextMap.delete(callId);
  return {
    ...projection,
    queueNameByCallId: nextMap,
  };
}

function parseCallId(value: unknown): CallId | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return createCallId(value);
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
