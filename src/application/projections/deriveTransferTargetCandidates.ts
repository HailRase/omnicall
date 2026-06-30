import { isDialpadNumberValid } from "../helpers/dialpadValidation.js";
import type { CallLine } from "./multiLineCallProjection.js";

export type TransferTargetCandidate = Readonly<{
  callId: string;
  displayLabel: string | null;
  remoteNumber: string;
  state: CallLine["state"];
}>;

export type DeriveTransferTargetCandidatesInput = Readonly<{
  sourceCallId: string | null;
  lines: ReadonlyArray<CallLine>;
}>;

const ELIGIBLE_STATES = new Set<CallLine["state"]>(["Active", "Held"]);

/**
 * - Purpose: derive selectable transfer targets from established peer sessions.
 * - Inputs: source call id and multi-line projection entries.
 * - Outputs: dialable candidates excluding source and consultation legs.
 */
export function deriveTransferTargetCandidates(
  input: DeriveTransferTargetCandidatesInput,
): ReadonlyArray<TransferTargetCandidate> {
  const { sourceCallId, lines } = input;
  const candidates: TransferTargetCandidate[] = [];

  for (const line of lines) {
    if (sourceCallId !== null && line.callId === sourceCallId) {
      continue;
    }
    if (line.role === "consultation") {
      continue;
    }
    if (!ELIGIBLE_STATES.has(line.state)) {
      continue;
    }
    const remoteNumber = line.remoteNumber;
    if (remoteNumber === null || !isDialpadNumberValid(remoteNumber)) {
      continue;
    }

    candidates.push({
      callId: line.callId,
      displayLabel: line.displayLabel,
      remoteNumber,
      state: line.state,
    });
  }

  return candidates;
}
