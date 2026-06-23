import type { DomainEvent } from "@domain/index.js";
import { createCallId, type CallId } from "@domain/telephony/CallId.js";

export type QueueLabelState = "hidden" | "loading" | "ready" | "na";

export type QueueInfoProjection = Readonly<{
  isOcpSyncAvailable: boolean;
  queueNameByCallId: ReadonlyMap<string, string>;
}>;

export const initialQueueInfoProjection = (): QueueInfoProjection => ({
  isOcpSyncAvailable: false,
  queueNameByCallId: new Map(),
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
      return setQueueName(projection, callId, queueName);
    }
    case "CallEnded":
    case "IncomingCallEndedBeforeAnswer": {
      const callId = parseCallId(event["callId"]);
      if (callId === null) {
        return projection;
      }
      return clearQueueName(projection, callId);
    }
    default:
      return projection;
  }
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
  return "loading";
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
