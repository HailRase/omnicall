import type { HeadsetCommand } from "@domain/index.js";
import type { HeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";
import {
  hasPendingOutgoingDial,
  isAllEstablishedOnHold,
} from "./buildHeadsetCallSnapshot.js";

function appendHoldLedCommand(
  commands: HeadsetCommand[],
  snapshot: HeadsetCallSnapshot,
): void {
  if (isAllEstablishedOnHold(snapshot) || snapshot.activeIsOnHold) {
    commands.push({ type: "setHoldIndicator" });
    return;
  }

  if (snapshot.activeSessionId !== undefined) {
    commands.push({ type: "answer" });
  }
}

/**
 * - Purpose: map session snapshot deltas to headset LED commands.
 * - Inputs: previous and next headset call snapshots.
 * - Outputs: ordered headset commands for LED sync.
 */
export function resolveDeviceCommandsFromSnapshot(
  previous: HeadsetCallSnapshot | null,
  next: HeadsetCallSnapshot,
): ReadonlyArray<HeadsetCommand> {
  const commands: HeadsetCommand[] = [];
  const hasIncomingWaiting = next.incomingWaitingCount > 0;
  const previousIncomingCount = previous?.incomingWaitingCount ?? 0;
  const incomingAppeared =
    previousIncomingCount === 0 && next.incomingWaitingCount > 0;
  const incomingCountIncreased = next.incomingWaitingCount > previousIncomingCount;
  const isOutgoingDialing = hasPendingOutgoingDial(next);

  if (incomingAppeared || incomingCountIncreased) {
    commands.push({ type: "signalIncoming" });
  }

  if (hasIncomingWaiting) {
    return commands;
  }

  const incomingCleared =
    previousIncomingCount > 0 && next.incomingWaitingCount === 0;
  const outgoingStarted =
    !hasPendingOutgoingDial(previous ?? next) && isOutgoingDialing;
  const emptySnapshot: HeadsetCallSnapshot = {
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
  const outgoingEnded =
    hasPendingOutgoingDial(previous ?? emptySnapshot) && !isOutgoingDialing;
  const establishedIncreased =
    (previous?.establishedCount ?? 0) < next.establishedCount;
  const establishedDecreased =
    (previous?.establishedCount ?? 0) > next.establishedCount;
  const holdChanged =
    previous?.activeSessionId !== next.activeSessionId ||
    previous?.activeIsOnHold !== next.activeIsOnHold ||
    previous?.heldSessionIds.join(",") !== next.heldSessionIds.join(",");

  if (incomingCleared && next.establishedCount === 0 && !isOutgoingDialing) {
    commands.push({ type: "clearSignal" });
  } else if (incomingCleared && !isOutgoingDialing) {
    if (isAllEstablishedOnHold(next)) {
      commands.push({ type: "setHoldIndicator" });
    } else if (next.activeSessionId !== undefined) {
      commands.push({ type: "answer" });
    } else {
      commands.push({ type: "clearSignal" });
    }
  }

  if (outgoingStarted) {
    commands.push({ type: "signalOutgoing" });
  }

  if (outgoingEnded) {
    if (isAllEstablishedOnHold(next)) {
      commands.push({ type: "setHoldIndicator" });
    } else if (next.activeSessionId !== undefined) {
      commands.push({ type: "answer" });
    } else if (next.establishedCount === 0 && next.incomingWaitingCount === 0) {
      commands.push({ type: "clearSignal" });
    }
  }

  if (
    establishedDecreased &&
    next.establishedCount === 0 &&
    !isOutgoingDialing
  ) {
    commands.push({ type: "clearSignal" });
  }

  if (establishedIncreased && next.activeSessionId !== undefined && !isOutgoingDialing) {
    commands.push({ type: "answer" });
  }

  if (holdChanged && !isOutgoingDialing) {
    appendHoldLedCommand(commands, next);
  }

  const muteChanged =
    previous?.activeIsMuted !== next.activeIsMuted ||
    previous?.activeSessionId !== next.activeSessionId;

  if (muteChanged && next.activeSessionId !== undefined && !next.activeIsOnHold) {
    commands.push({ type: "setMute", muted: next.activeIsMuted });
  }

  if (
    next.establishedCount === 0 &&
    !isOutgoingDialing &&
    next.incomingWaitingCount === 0 &&
    (establishedDecreased || outgoingEnded)
  ) {
    commands.push({ type: "hangup" });
  }

  if (isOutgoingDialing) {
    return commands.filter((command) => command.type !== "setHoldIndicator");
  }

  return commands;
}

export function resolveInitialConnectCommands(
  snapshot: HeadsetCallSnapshot,
): ReadonlyArray<HeadsetCommand> {
  if (snapshot.incomingWaitingCount > 0) {
    return [{ type: "signalIncoming" }];
  }

  if (hasPendingOutgoingDial(snapshot)) {
    return [{ type: "signalOutgoing" }];
  }

  if (isAllEstablishedOnHold(snapshot) || snapshot.activeIsOnHold) {
    return [{ type: "setHoldIndicator" }];
  }

  if (snapshot.activeSessionId !== undefined) {
    return [
      { type: "answer" },
      { type: "setMute", muted: snapshot.activeIsMuted },
    ];
  }

  return [{ type: "clearSignal" }];
}
