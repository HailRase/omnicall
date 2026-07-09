import type { MultiLineCallProjection } from "../projections/telephony/multiLineCallProjection.js";
import type { IncomingCallProjection } from "../projections/telephony/incomingCallProjection.js";

export type HeadsetCallSnapshot = Readonly<{
  establishedCount: number;
  activeSessionId: string | undefined;
  primarySessionId: string | undefined;
  activeIsMuted: boolean;
  activeIsOnHold: boolean;
  heldSessionIds: ReadonlyArray<string>;
  establishedSessionIds: ReadonlyArray<string>;
  outgoingInProgressIds: ReadonlyArray<string>;
  incomingWaitingCount: number;
  firstIncomingCallId: string | undefined;
}>;

const EMPTY_SNAPSHOT: HeadsetCallSnapshot = {
  establishedCount: 0,
  activeSessionId: undefined,
  primarySessionId: undefined,
  activeIsMuted: false,
  activeIsOnHold: false,
  heldSessionIds: [],
  establishedSessionIds: [],
  outgoingInProgressIds: [],
  incomingWaitingCount: 0,
  firstIncomingCallId: undefined,
};

/**
 * - Purpose: derive vendor-agnostic headset orchestrator input from telephony projections.
 * - Inputs: multi-line and incoming call projections.
 * - Outputs: flattened headset call snapshot.
 */
export function buildHeadsetCallSnapshot(
  multiLine: MultiLineCallProjection,
  incoming: IncomingCallProjection,
): HeadsetCallSnapshot {
  const establishedLines = multiLine.lines.filter(
    (line) => line.state === "Active" || line.state === "Held",
  );
  const activeLine = establishedLines.find((line) => line.state === "Active");
  const heldSessionIds = establishedLines
    .filter((line) => line.state === "Held")
    .map((line) => line.callId);
  const outgoingInProgressIds = multiLine.lines
    .filter((line) => line.state === "Connecting")
    .map((line) => line.callId);
  const incomingWaitingCount =
    incoming.visible && incoming.callId !== null && incoming.uiState === "incomingRinging"
      ? 1
      : 0;

  return {
    establishedCount: establishedLines.length,
    activeSessionId: activeLine?.callId,
    primarySessionId: multiLine.primaryCallId ?? undefined,
    activeIsMuted: activeLine?.muted ?? false,
    activeIsOnHold: activeLine?.state === "Held",
    heldSessionIds,
    establishedSessionIds: establishedLines.map((line) => line.callId),
    outgoingInProgressIds,
    incomingWaitingCount,
    firstIncomingCallId: incoming.callId ?? undefined,
  };
}

export function initialHeadsetCallSnapshot(): HeadsetCallSnapshot {
  return EMPTY_SNAPSHOT;
}

export function hasPendingOutgoingDial(snapshot: HeadsetCallSnapshot): boolean {
  return snapshot.outgoingInProgressIds.length > 0;
}

export function isAllEstablishedOnHold(snapshot: HeadsetCallSnapshot): boolean {
  return (
    snapshot.establishedCount > 0 &&
    snapshot.heldSessionIds.length >= snapshot.establishedCount &&
    snapshot.activeSessionId === undefined
  );
}
