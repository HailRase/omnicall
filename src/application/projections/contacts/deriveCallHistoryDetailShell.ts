import type { Contact } from "@domain/index.js";
import {
  buildContactDirectory,
  type CallerPresentationSource,
} from "../../read-models/contactDirectory.js";
import type { CallHistoryRedialDisabledReasonKey } from "./deriveCallHistoryShell.js";
import type { MultiCallProjection } from "../telephony/multiCallProjection.js";

export type CallHistoryDetailShellViewModel = Readonly<{
  id: string;
  remoteNumber: string;
  displayLabel: string | null;
  primaryLabel: string;
  secondaryLabel: string | null;
  contactId: string | null;
  presentationSource: CallerPresentationSource;
  directionKey: "history.direction.incoming" | "history.direction.outgoing";
  outcomeKey: "history.outcome.completed" | "history.outcome.missed" | "history.outcome.failed";
  startedAtIso: string;
  durationSec: number;
  redialDisabledReasonKey: CallHistoryRedialDisabledReasonKey | null;
}>;

export type CallHistoryDetailShellEntry = Readonly<{
  id: string;
  remoteNumber: string;
  displayLabel: string | null;
  direction: "incoming" | "outgoing";
  outcome: "completed" | "missed" | "failed";
  startedAt: string;
  durationSec: number;
}>;

/**
 * - Purpose: map one call history entry into detail shell view-model with identity enrichment.
 * - Inputs: history entry, contacts, registration flag, and multi-call guards.
 * - Outputs: enriched detail view-model with redial disabled reason.
 */
export function deriveCallHistoryDetailShell(input: Readonly<{
  entry: CallHistoryDetailShellEntry;
  contacts: ReadonlyArray<Contact>;
  isSipRegistered: boolean;
  multiCallProjection: MultiCallProjection;
}>): CallHistoryDetailShellViewModel {
  const globalRedialReason = resolveGlobalRedialDisabledReason(
    input.isSipRegistered,
    input.multiCallProjection,
  );
  const contactDirectory = buildContactDirectory(input.contacts);
  const presentation = contactDirectory.resolvePresentation({
    remoteNumber: input.entry.remoteNumber,
    displayLabel: input.entry.displayLabel,
  });

  return {
    id: input.entry.id,
    remoteNumber: input.entry.remoteNumber,
    displayLabel: input.entry.displayLabel,
    primaryLabel: presentation.primaryLabel,
    secondaryLabel: presentation.secondaryLabel,
    contactId: presentation.contactId,
    presentationSource: presentation.source,
    directionKey:
      input.entry.direction === "incoming"
        ? "history.direction.incoming"
        : "history.direction.outgoing",
    outcomeKey: mapOutcomeKey(input.entry.outcome),
    startedAtIso: input.entry.startedAt,
    durationSec: input.entry.durationSec,
    redialDisabledReasonKey: globalRedialReason,
  };
}

function mapOutcomeKey(
  outcome: CallHistoryDetailShellEntry["outcome"],
): CallHistoryDetailShellViewModel["outcomeKey"] {
  switch (outcome) {
    case "completed":
      return "history.outcome.completed";
    case "missed":
      return "history.outcome.missed";
    case "failed":
      return "history.outcome.failed";
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
