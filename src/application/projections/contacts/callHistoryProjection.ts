import type { CallHistoryEntry, DomainEvent } from "@domain/index.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

export type CallHistoryLoadStatus = "idle" | "loading" | "populated" | "error";

export type CallHistoryProjection = Readonly<{
  status: CallHistoryLoadStatus;
  entries: ReadonlyArray<CallHistoryEntry>;
  errorKey: string | null;
}>;

/**
 * - Purpose: project call history list state for renderer shell wiring.
 * - Inputs: previous projection, domain events, and explicit load snapshots.
 * - Outputs: immutable call history projection with load status.
 */
export function initialCallHistoryProjection(): CallHistoryProjection {
  return {
    status: "idle",
    entries: [],
    errorKey: null,
  };
}

export function reduceCallHistoryProjection(
  projection: CallHistoryProjection,
  event: DomainEvent,
): CallHistoryProjection {
  if (isSessionResetEvent(event)) {
    return initialCallHistoryProjection();
  }

  if (event.type === "CallHistoryRecorded") {
    const entry = parseRecordedEntry(event);
    if (entry === null) {
      return projection;
    }

    const withoutDuplicate = projection.entries.filter(
      (existing) => existing.id !== entry.id && existing.callId !== entry.callId,
    );

    return {
      status: "populated",
      entries: [entry, ...withoutDuplicate],
      errorKey: null,
    };
  }

  return projection;
}

export function applyCallHistoryLoading(projection: CallHistoryProjection): CallHistoryProjection {
  return {
    ...projection,
    status: "loading",
    errorKey: null,
  };
}

export function applyCallHistoryLoaded(
  _projection: CallHistoryProjection,
  entries: ReadonlyArray<CallHistoryEntry>,
): CallHistoryProjection {
  return {
    status: entries.length > 0 ? "populated" : "idle",
    entries,
    errorKey: null,
  };
}

export function applyCallHistoryLoadError(
  projection: CallHistoryProjection,
  errorKey: string,
): CallHistoryProjection {
  return {
    ...projection,
    status: "error",
    errorKey,
  };
}

function parseRecordedEntry(event: DomainEvent): CallHistoryEntry | null {
  const id = asString(event["entryId"]);
  const callId = asString(event["callId"]);
  const remoteNumber = asString(event["remoteNumber"]);
  const direction = event["direction"];
  const outcome = event["outcome"];
  const startedAt = asString(event["startedAt"]);
  const endedAt = asString(event["endedAt"]);
  const durationSec = event["durationSec"];
  const displayLabel = asOptionalString(event["displayLabel"]);

  if (
    id === null ||
    callId === null ||
    remoteNumber === null ||
    (direction !== "incoming" && direction !== "outgoing") ||
    (outcome !== "completed" && outcome !== "missed" && outcome !== "failed") ||
    startedAt === null ||
    endedAt === null ||
    typeof durationSec !== "number"
  ) {
    return null;
  }

  return {
    id: id as CallHistoryEntry["id"],
    callId: callId as CallHistoryEntry["callId"],
    direction,
    outcome,
    remoteNumber,
    displayLabel,
    startedAt,
    endedAt,
    durationSec,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
