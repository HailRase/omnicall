import type { MultiLineCallProjection } from "../projections/telephony/multiLineCallProjection.js";
import type {
  IncomingCallProjection,
  IncomingCallUiState,
} from "../projections/telephony/incomingCallProjection.js";
import {
  resolveHeadsetSessionFocus,
  type HeadsetFocusReason,
  type HeadsetFocusSessionLookup,
} from "./session/resolveHeadsetSessionFocus.js";

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
  focusSessionId: string | undefined;
  focusedIsMuted: boolean;
  focusedIsOnHold: boolean;
  focusReason: HeadsetFocusReason;
  operatorSelectedCallId: string | undefined;
}>;

export type BuildHeadsetCallSnapshotSelection = Readonly<{
  selectedCallId?: string | undefined;
}>;

const INCOMING_WAITING_UI_STATES: ReadonlySet<IncomingCallUiState> = new Set([
  "incomingRinging",
  "callerIdentityLoading",
  "callerIdentityResolved",
  "autoAnswerCountdown",
  "rejectReasonRequired",
]);

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
  focusSessionId: undefined,
  focusedIsMuted: false,
  focusedIsOnHold: false,
  focusReason: "idle",
  operatorSelectedCallId: undefined,
};

function isIncomingWaiting(incoming: IncomingCallProjection): boolean {
  return (
    incoming.visible &&
    incoming.callId !== null &&
    INCOMING_WAITING_UI_STATES.has(incoming.uiState)
  );
}

/**
 * - Purpose: derive vendor-agnostic headset orchestrator input from telephony projections.
 * - Inputs: multi-line and incoming call projections, optional operator selection.
 * - Outputs: flattened headset call snapshot including session focus.
 */
export function buildHeadsetCallSnapshot(
  multiLine: MultiLineCallProjection,
  incoming: IncomingCallProjection,
  selection: BuildHeadsetCallSnapshotSelection = {},
): HeadsetCallSnapshot {
  const establishedLines = multiLine.lines.filter(
    (line) => line.state === "Active" || line.state === "Held",
  );
  const activeLine = establishedLines.find((line) => line.state === "Active");
  const heldSessionIds = establishedLines
    .filter((line) => line.state === "Held")
    .map((line) => line.callId);
  const incomingWaitingCount = isIncomingWaiting(incoming) ? 1 : 0;
  const firstIncomingCallId = incoming.callId ?? undefined;
  const incomingWaitingId =
    incomingWaitingCount > 0 ? firstIncomingCallId : undefined;
  // Connecting = dialing; Ringing line that is not the waiting incoming = outbound progress.
  const outgoingInProgressIds = multiLine.lines
    .filter((line) => {
      if (line.state === "Connecting") {
        return true;
      }
      return (
        line.state === "Ringing" &&
        (incomingWaitingId === undefined || line.callId !== incomingWaitingId)
      );
    })
    .map((line) => line.callId);
  const establishedSessionIds = establishedLines.map((line) => line.callId);
  const primarySessionId = multiLine.primaryCallId ?? undefined;
  const operatorSelectedCallId = selection.selectedCallId;

  const sessionById: Record<string, HeadsetFocusSessionLookup> = {};
  for (const line of multiLine.lines) {
    if (
      line.state !== "Active" &&
      line.state !== "Held" &&
      line.state !== "Connecting" &&
      line.state !== "Ringing"
    ) {
      continue;
    }
    // Incoming ringing is tracked via incoming projection, not as an established session.
    if (
      line.state === "Ringing" &&
      incomingWaitingId !== undefined &&
      line.callId === incomingWaitingId
    ) {
      continue;
    }
    sessionById[line.callId] = {
      muted: line.muted,
      isOnHold: line.state === "Held",
    };
  }

  const focus = resolveHeadsetSessionFocus({
    selectedCallId: operatorSelectedCallId,
    primarySessionId,
    activeSessionId: activeLine?.callId,
    heldSessionIds,
    outgoingInProgressIds,
    establishedSessionIds,
    incomingWaitingCount,
    firstIncomingCallId,
    sessionById,
  });

  return {
    establishedCount: establishedLines.length,
    activeSessionId: activeLine?.callId,
    primarySessionId,
    activeIsMuted: activeLine?.muted ?? false,
    activeIsOnHold: activeLine?.state === "Held",
    heldSessionIds,
    establishedSessionIds,
    outgoingInProgressIds,
    incomingWaitingCount,
    firstIncomingCallId,
    focusSessionId: focus.focusSessionId,
    focusedIsMuted: focus.focusedIsMuted,
    focusedIsOnHold: focus.focusedIsOnHold,
    focusReason: focus.focusReason,
    operatorSelectedCallId,
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
