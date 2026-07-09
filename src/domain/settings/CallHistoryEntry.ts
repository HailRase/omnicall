import type { CallId } from "../telephony/CallId.js";
import {
  createCallHistoryEntryId,
  type CallHistoryEntryId,
} from "./CallHistoryEntryId.js";

export type CallHistoryDirection = "incoming" | "outgoing";

export type CallHistoryOutcome = "completed" | "missed" | "canceled" | "failed";

/**
 * - Purpose: classify who ended the call for history detail.
 * - Inputs: hangup/reject/failure signals from session tracking.
 * - Outputs: stable end-reason key for persistence and i18n.
 */
export type CallHistoryEndReason =
  | "local_hangup"
  | "remote_cancel"
  | "failure"
  | "unknown";

export const CALL_HISTORY_END_REASONS = [
  "local_hangup",
  "remote_cancel",
  "failure",
  "unknown",
] as const satisfies ReadonlyArray<CallHistoryEndReason>;

export type CallHistoryEntry = Readonly<{
  id: CallHistoryEntryId;
  callId: CallId;
  direction: CallHistoryDirection;
  remoteNumber: string;
  displayLabel: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  ringDurationSec: number;
  talkDurationSec: number;
  outcome: CallHistoryOutcome;
  endReason: CallHistoryEndReason;
}>;

export type CallHistorySessionSnapshot = Readonly<{
  callId: CallId;
  direction: CallHistoryDirection;
  remoteNumber: string | null;
  displayLabel: string | null;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string;
  wasAnswered: boolean;
  failed: boolean;
  localHangup: boolean;
  remoteCancelBeforeAnswer: boolean;
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

  const answeredAtMs =
    snapshot.answeredAt !== null ? Date.parse(snapshot.answeredAt) : Number.NaN;
  if (
    snapshot.wasAnswered &&
    (Number.isNaN(answeredAtMs) ||
      answeredAtMs < startedAtMs ||
      answeredAtMs > endedAtMs)
  ) {
    return { ok: false, errors: ["invalid_timestamps"] };
  }

  const entryId = createCallHistoryEntryId(`history-${snapshot.callId}`);
  if (entryId === null) {
    return { ok: false, errors: ["remote_number_required"] };
  }

  const durationSec = Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000));
  const ringDurationSec = snapshot.wasAnswered
    ? Math.max(0, Math.floor((answeredAtMs - startedAtMs) / 1000))
    : durationSec;
  const talkDurationSec = snapshot.wasAnswered
    ? Math.max(0, Math.floor((endedAtMs - answeredAtMs) / 1000))
    : 0;

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
      ringDurationSec,
      talkDurationSec,
      outcome: resolveHistoryOutcome(snapshot),
      endReason: resolveHistoryEndReason(snapshot),
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

  if (snapshot.wasAnswered) {
    return "completed";
  }

  if (
    snapshot.direction === "incoming" &&
    !snapshot.localHangup &&
    (snapshot.remoteCancelBeforeAnswer || !snapshot.wasAnswered)
  ) {
    return "missed";
  }

  return "canceled";
}

function resolveHistoryEndReason(snapshot: CallHistorySessionSnapshot): CallHistoryEndReason {
  if (snapshot.failed) {
    return "failure";
  }
  if (snapshot.localHangup) {
    return "local_hangup";
  }
  return "remote_cancel";
}
