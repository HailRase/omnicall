import type { CallHistoryEntry, Contact } from "@domain/index.js";
import {
  buildContactDirectory,
  type CallerPresentationSource,
} from "../../read-models/contactDirectory.js";
import type { CallHistoryProjection } from "./callHistoryProjection.js";
import type { MultiCallProjection } from "../telephony/multiCallProjection.js";

export type CallHistoryRedialDisabledReasonKey =
  | "history.redial.disabled.notRegistered"
  | "history.redial.disabled.activeCallPolicy";

export type CallHistoryMessageKey =
  | CallHistoryRedialDisabledReasonKey
  | "history.direction.incoming"
  | "history.direction.outgoing"
  | "history.outcome.completed"
  | "history.outcome.missed"
  | "history.outcome.canceled"
  | "history.outcome.failed"
  | "history.endReason.local_hangup"
  | "history.endReason.remote_cancel"
  | "history.endReason.failure"
  | "history.endReason.unknown"
  | "history.error.loadFailed";

export type CallHistoryEntryShellViewModel = Readonly<{
  id: string;
  remoteNumber: string;
  displayLabel: string | null;
  primaryLabel: string;
  secondaryLabel: string | null;
  contactId: string | null;
  presentationSource: CallerPresentationSource;
  directionKey: "history.direction.incoming" | "history.direction.outgoing";
  outcomeKey:
    | "history.outcome.completed"
    | "history.outcome.missed"
    | "history.outcome.canceled"
    | "history.outcome.failed";
  endReasonKey:
    | "history.endReason.local_hangup"
    | "history.endReason.remote_cancel"
    | "history.endReason.failure"
    | "history.endReason.unknown";
  startedAtIso: string;
  durationSec: number;
  ringDurationSec: number;
  talkDurationSec: number;
  redialDisabledReasonKey: CallHistoryRedialDisabledReasonKey | null;
}>;

export type CallHistoryShellViewModel = Readonly<{
  status: CallHistoryProjection["status"];
  entries: ReadonlyArray<CallHistoryEntryShellViewModel>;
  errorKey: "history.error.loadFailed" | null;
  isEmpty: boolean;
}>;

/**
 * - Purpose: map call history projection into renderer shell view-model fields.
 * - Inputs: history projection, registration flag, and multi-call guards.
 * - Outputs: shell view-model with per-row redial disabled reasons.
 */
export function deriveCallHistoryShell(input: Readonly<{
  projection: CallHistoryProjection;
  contacts: ReadonlyArray<Contact>;
  isSipRegistered: boolean;
  multiCallProjection: MultiCallProjection;
}>): CallHistoryShellViewModel {
  const globalRedialReason = resolveGlobalRedialDisabledReason(
    input.isSipRegistered,
    input.multiCallProjection,
  );
  const contactDirectory = buildContactDirectory(input.contacts);

  const entries = input.projection.entries.map((entry) =>
    mapEntry(entry, globalRedialReason, contactDirectory),
  );

  return {
    status: input.projection.status,
    entries,
    errorKey: toHistoryErrorKey(input.projection.errorKey),
    isEmpty: input.projection.status !== "loading" && entries.length === 0,
  };
}

function toHistoryErrorKey(errorKey: string | null): "history.error.loadFailed" | null {
  if (errorKey === "history.error.loadFailed") {
    return errorKey;
  }
  return null;
}

function mapEntry(
  entry: CallHistoryEntry,
  globalRedialReason: CallHistoryRedialDisabledReasonKey | null,
  contactDirectory: ReturnType<typeof buildContactDirectory>,
): CallHistoryEntryShellViewModel {
  const presentation = contactDirectory.resolvePresentation({
    remoteNumber: entry.remoteNumber,
    displayLabel: entry.displayLabel,
  });

  return {
    id: entry.id,
    remoteNumber: entry.remoteNumber,
    displayLabel: entry.displayLabel,
    primaryLabel: presentation.primaryLabel,
    secondaryLabel: presentation.secondaryLabel,
    contactId: presentation.contactId,
    presentationSource: presentation.source,
    directionKey:
      entry.direction === "incoming"
        ? "history.direction.incoming"
        : "history.direction.outgoing",
    outcomeKey: mapOutcomeKey(entry.outcome),
    endReasonKey: mapEndReasonKey(entry.endReason),
    startedAtIso: entry.startedAt,
    durationSec: entry.durationSec,
    ringDurationSec: entry.ringDurationSec,
    talkDurationSec: entry.talkDurationSec,
    redialDisabledReasonKey: globalRedialReason,
  };
}

function mapOutcomeKey(
  outcome: CallHistoryEntry["outcome"],
): CallHistoryEntryShellViewModel["outcomeKey"] {
  switch (outcome) {
    case "completed":
      return "history.outcome.completed";
    case "missed":
      return "history.outcome.missed";
    case "canceled":
      return "history.outcome.canceled";
    case "failed":
      return "history.outcome.failed";
  }
}

function mapEndReasonKey(
  endReason: CallHistoryEntry["endReason"],
): CallHistoryEntryShellViewModel["endReasonKey"] {
  switch (endReason) {
    case "local_hangup":
      return "history.endReason.local_hangup";
    case "remote_cancel":
      return "history.endReason.remote_cancel";
    case "failure":
      return "history.endReason.failure";
    case "unknown":
      return "history.endReason.unknown";
  }
}

function resolveGlobalRedialDisabledReason(
  isSipRegistered: boolean,
  multiCallProjection: MultiCallProjection,
): CallHistoryRedialDisabledReasonKey | null {
  if (!isSipRegistered) {
    return "history.redial.disabled.notRegistered";
  }

  if (
    multiCallProjection.hasEstablishedCall &&
    !multiCallProjection.multiSessionsEnabled
  ) {
    return "history.redial.disabled.activeCallPolicy";
  }

  return null;
}
