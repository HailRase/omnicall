import type {
  CallHistoryDirection,
  CallHistoryEntry,
  CallHistoryOutcome,
} from "./CallHistoryEntry.js";
import { createCallHistoryEntryId } from "./CallHistoryEntryId.js";
import { createCallId } from "../telephony/CallId.js";
import {
  readCallHistoryDirection,
  readNonNegativeInteger,
  readNullableString,
  readRequiredString,
} from "./persistedCallHistoryReaders.js";

/**
 * - Purpose: migrate legacy v1 history rows into current CallHistoryEntry shape.
 * - Inputs: raw v1 persisted entry object.
 * - Outputs: validated CallHistoryEntry or null when invalid.
 */
export function parsePersistedCallHistoryEntryV1(raw: unknown): CallHistoryEntry | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const idRaw = readRequiredString(record, "id");
  const callIdRaw = readRequiredString(record, "callId");
  const direction = readCallHistoryDirection(record, "direction");
  const remoteNumber = readRequiredString(record, "remoteNumber");
  const startedAt = readRequiredString(record, "startedAt");
  const endedAt = readRequiredString(record, "endedAt");
  const durationSec = readNonNegativeInteger(record, "durationSec");
  const legacyOutcome = readLegacyCallHistoryOutcome(record, "outcome");

  if (
    idRaw === null ||
    callIdRaw === null ||
    direction === null ||
    remoteNumber === null ||
    startedAt === null ||
    endedAt === null ||
    durationSec === null ||
    legacyOutcome === null
  ) {
    return null;
  }

  const outcome = migrateLegacyOutcome(direction, legacyOutcome);
  const talkDurationSec = outcome === "completed" ? durationSec : 0;

  return buildValidatedCallHistoryEntry({
    idRaw,
    callIdRaw,
    direction,
    remoteNumber,
    displayLabel: readNullableString(record, "displayLabel"),
    startedAt,
    endedAt,
    durationSec,
    ringDurationSec: 0,
    talkDurationSec,
    outcome,
    endReason: "unknown",
  });
}

export function buildValidatedCallHistoryEntry(input: Readonly<{
  idRaw: string;
  callIdRaw: string;
  direction: CallHistoryDirection;
  remoteNumber: string;
  displayLabel: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  ringDurationSec: number;
  talkDurationSec: number;
  outcome: CallHistoryOutcome;
  endReason: CallHistoryEntry["endReason"];
}>): CallHistoryEntry | null {
  const entryId = createCallHistoryEntryId(input.idRaw);
  if (entryId === null) {
    return null;
  }

  const callId = createCallId(input.callIdRaw);
  const startedAtMs = Date.parse(input.startedAt);
  const endedAtMs = Date.parse(input.endedAt);
  if (Number.isNaN(startedAtMs) || Number.isNaN(endedAtMs) || endedAtMs < startedAtMs) {
    return null;
  }

  if (input.remoteNumber.trim().length === 0) {
    return null;
  }

  return {
    id: entryId,
    callId,
    direction: input.direction,
    remoteNumber: input.remoteNumber.trim(),
    displayLabel: input.displayLabel,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationSec: input.durationSec,
    ringDurationSec: input.ringDurationSec,
    talkDurationSec: input.talkDurationSec,
    outcome: input.outcome,
    endReason: input.endReason,
  };
}

function migrateLegacyOutcome(
  direction: CallHistoryDirection,
  outcome: "completed" | "missed" | "failed",
): CallHistoryOutcome {
  if (outcome === "missed" && direction === "outgoing") {
    return "canceled";
  }
  return outcome;
}

function readLegacyCallHistoryOutcome(
  record: Record<string, unknown>,
  key: string,
): "completed" | "missed" | "failed" | null {
  const value = record[key];
  if (value === "completed" || value === "missed" || value === "failed") {
    return value;
  }
  return null;
}
