import type { CallId } from "../telephony/CallId.js";
import {
  createCallHistoryEntryId,
  type CallHistoryEntryId,
} from "./CallHistoryEntryId.js";

export type CallHistoryDirection = "incoming" | "outgoing";

export type CallHistoryOutcome = "completed" | "missed" | "failed";

export type CallHistoryEntry = Readonly<{
  id: CallHistoryEntryId;
  callId: CallId;
  direction: CallHistoryDirection;
  remoteNumber: string;
  displayLabel: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  outcome: CallHistoryOutcome;
}>;

export type CallHistorySessionSnapshot = Readonly<{
  callId: CallId;
  direction: CallHistoryDirection;
  remoteNumber: string | null;
  displayLabel: string | null;
  startedAt: string;
  endedAt: string;
  wasAnswered: boolean;
  failed: boolean;
  missedBeforeAnswer: boolean;
}>;

export type CreateCallHistoryEntryResult =
  | Readonly<{ ok: true; value: CallHistoryEntry }>
  | Readonly<{ ok: false; errors: ReadonlyArray<"remote_number_required" | "invalid_timestamps"> }>;

/**
 * - Purpose: map finalized call session snapshot into a persisted history entry.
 * - Inputs: tracked session fields at call end.
 * - Outputs: validated CallHistoryEntry or validation errors.
 */
export function createCallHistoryEntryFromSession(
  snapshot: CallHistorySessionSnapshot,
): CreateCallHistoryEntryResult {
  const remoteNumber = resolveHistoryRemoteNumber(snapshot);
  if (remoteNumber === null) {
    return { ok: false, errors: ["remote_number_required"] };
  }

  const startedAtMs = Date.parse(snapshot.startedAt);
  const endedAtMs = Date.parse(snapshot.endedAt);
  if (Number.isNaN(startedAtMs) || Number.isNaN(endedAtMs) || endedAtMs < startedAtMs) {
    return { ok: false, errors: ["invalid_timestamps"] };
  }

  const entryId = createCallHistoryEntryId(`history-${snapshot.callId}`);
  if (entryId === null) {
    return { ok: false, errors: ["remote_number_required"] };
  }

  const durationSec = snapshot.wasAnswered
    ? Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000))
    : 0;

  const outcome = resolveHistoryOutcome(snapshot);

  return {
    ok: true,
    value: {
      id: entryId,
      callId: snapshot.callId,
      direction: snapshot.direction,
      remoteNumber,
      displayLabel: snapshot.displayLabel,
      startedAt: snapshot.startedAt,
      endedAt: snapshot.endedAt,
      durationSec,
      outcome,
    },
  };
}

function resolveHistoryRemoteNumber(snapshot: CallHistorySessionSnapshot): string | null {
  const candidate = snapshot.remoteNumber?.trim() ?? snapshot.displayLabel?.trim() ?? "";
  return candidate.length > 0 ? candidate : null;
}

function resolveHistoryOutcome(snapshot: CallHistorySessionSnapshot): CallHistoryOutcome {
  if (snapshot.failed) {
    return "failed";
  }
  if (snapshot.missedBeforeAnswer || !snapshot.wasAnswered) {
    return "missed";
  }
  return "completed";
}
