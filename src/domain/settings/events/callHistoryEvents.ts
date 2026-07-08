import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallHistoryEntry } from "../CallHistoryEntry.js";
import type { CallHistoryEntryId } from "../CallHistoryEntryId.js";

export type CallHistoryRecordedEvent = ReturnType<typeof createCallHistoryRecordedEvent>;
export type CallHistoryDeletedEvent = ReturnType<typeof createCallHistoryDeletedEvent>;

/**
 * - Purpose: announce that a call history row was persisted.
 * - Inputs: full entry snapshot and correlation id.
 * - Outputs: CallHistoryRecorded domain event.
 */
export function createCallHistoryRecordedEvent(
  correlationId: CorrelationId,
  entry: CallHistoryEntry,
): ReturnType<
  typeof createDomainEvent<
    "CallHistoryRecorded",
    Readonly<{
      entryId: CallHistoryEntry["id"];
      callId: CallHistoryEntry["callId"];
      direction: CallHistoryEntry["direction"];
      outcome: CallHistoryEntry["outcome"];
      remoteNumber: string;
      displayLabel: string | null;
      startedAt: string;
      endedAt: string;
      durationSec: number;
    }>
  >
> {
  return createDomainEvent("CallHistoryRecorded", correlationId, {
    entryId: entry.id,
    callId: entry.callId,
    direction: entry.direction,
    outcome: entry.outcome,
    remoteNumber: entry.remoteNumber,
    displayLabel: entry.displayLabel,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    durationSec: entry.durationSec,
  });
}

/**
 * - Purpose: announce that one call history row was removed.
 * - Inputs: deleted entry id and correlation id.
 * - Outputs: CallHistoryDeleted domain event.
 */
export function createCallHistoryDeletedEvent(
  correlationId: CorrelationId,
  entryId: CallHistoryEntryId,
): ReturnType<
  typeof createDomainEvent<
    "CallHistoryDeleted",
    Readonly<{
      entryId: CallHistoryEntryId;
    }>
  >
> {
  return createDomainEvent("CallHistoryDeleted", correlationId, { entryId });
}
