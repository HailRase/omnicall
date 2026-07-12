import type { HeadsetCommand } from "@domain/index.js";
import type { HeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";
import { hasPendingOutgoingDial } from "./buildHeadsetCallSnapshot.js";

function isFocusOnOutgoing(snapshot: HeadsetCallSnapshot): boolean {
  return (
    snapshot.focusSessionId !== undefined &&
    snapshot.outgoingInProgressIds.includes(snapshot.focusSessionId)
  );
}

/** Hold LED is ring-only; mute LED stays off until resume restores session mute. */
function holdIndicatorCommand(): HeadsetCommand {
  return { type: "setHoldIndicator", muted: false };
}

/**
 * - Purpose: map focused session presence to LED commands.
 * - Inputs: headset call snapshot after incoming priority is cleared.
 * - Outputs: presence LED commands for the focused session.
 */
function resolveFocusPresenceCommands(
  snapshot: HeadsetCallSnapshot,
): ReadonlyArray<HeadsetCommand> {
  if (snapshot.focusSessionId === undefined) {
    return [{ type: "clearSignal" }];
  }

  if (snapshot.focusedIsOnHold) {
    return [holdIndicatorCommand()];
  }

  if (isFocusOnOutgoing(snapshot) || hasPendingOutgoingDial(snapshot)) {
    return [{ type: "signalOutgoing" }];
  }

  return [{ type: "answer" }];
}

function resolveFocusMuteCommand(
  snapshot: HeadsetCallSnapshot,
): HeadsetCommand | null {
  if (
    snapshot.focusSessionId === undefined ||
    isFocusOnOutgoing(snapshot) ||
    hasPendingOutgoingDial(snapshot)
  ) {
    return null;
  }

  // Held: keep telephony mute in app/UI; do not drive red mute LED until resume.
  if (snapshot.focusedIsOnHold) {
    return null;
  }

  return { type: "setMute", muted: snapshot.focusedIsMuted };
}

function hasFocusPresenceDelta(
  previous: HeadsetCallSnapshot,
  next: HeadsetCallSnapshot,
): boolean {
  return (
    previous.focusSessionId !== next.focusSessionId ||
    previous.focusedIsOnHold !== next.focusedIsOnHold ||
    previous.focusReason !== next.focusReason ||
    previous.activeSessionId !== next.activeSessionId ||
    previous.heldSessionIds.join(",") !== next.heldSessionIds.join(",") ||
    previous.outgoingInProgressIds.join(",") !==
      next.outgoingInProgressIds.join(",") ||
    previous.establishedCount !== next.establishedCount
  );
}

function hasFocusMuteDelta(
  previous: HeadsetCallSnapshot,
  next: HeadsetCallSnapshot,
): boolean {
  return (
    previous.focusedIsMuted !== next.focusedIsMuted ||
    previous.focusSessionId !== next.focusSessionId ||
    previous.focusedIsOnHold !== next.focusedIsOnHold
  );
}

/**
 * - Purpose: restore pre-connect LED after firmware mute press (incoming/outgoing parity).
 * - Inputs: headset call snapshot where app mute is not allowed.
 * - Outputs: presence LED command that clears device mute without toggling app mute.
 */
export function resolveMuteRejectedLedCommands(
  snapshot: HeadsetCallSnapshot,
): ReadonlyArray<HeadsetCommand> {
  if (snapshot.incomingWaitingCount > 0) {
    return [{ type: "signalIncoming" }];
  }
  if (
    snapshot.focusReason === "outgoing" ||
    isFocusOnOutgoing(snapshot) ||
    hasPendingOutgoingDial(snapshot)
  ) {
    return [{ type: "signalOutgoing" }];
  }
  return [{ type: "setMute", muted: false }];
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
  if (previous === null) {
    return resolveInitialConnectCommands(next);
  }

  const commands: HeadsetCommand[] = [];
  const previousIncomingCount = previous.incomingWaitingCount;
  const incomingAppeared =
    previousIncomingCount === 0 && next.incomingWaitingCount > 0;
  const incomingCountIncreased = next.incomingWaitingCount > previousIncomingCount;

  if (incomingAppeared || incomingCountIncreased) {
    commands.push({ type: "signalIncoming" });
  }

  if (next.incomingWaitingCount > 0) {
    return commands;
  }

  const incomingCleared =
    previousIncomingCount > 0 && next.incomingWaitingCount === 0;
  const isOutgoingDialing = hasPendingOutgoingDial(next);
  const outgoingEnded =
    hasPendingOutgoingDial(previous) && !isOutgoingDialing;
  const establishedDecreased = previous.establishedCount > next.establishedCount;
  const wentIdle =
    next.focusSessionId === undefined &&
    next.establishedCount === 0 &&
    !isOutgoingDialing &&
    next.incomingWaitingCount === 0;

  const presenceChanged = incomingCleared || hasFocusPresenceDelta(previous, next);
  const muteChanged = hasFocusMuteDelta(previous, next);

  if (presenceChanged) {
    if (wentIdle) {
      if (establishedDecreased || outgoingEnded || incomingCleared) {
        commands.push({ type: "hangup" });
      }
      commands.push({ type: "clearSignal" });
    } else {
      commands.push(...resolveFocusPresenceCommands(next));
    }
  }

  if (muteChanged && !wentIdle) {
    const muteCommand = resolveFocusMuteCommand(next);
    if (muteCommand !== null) {
      // Avoid duplicate hold indicator when presence already emitted the same command.
      const alreadyEmitted =
        presenceChanged &&
        muteCommand.type === "setHoldIndicator" &&
        commands.some(
          (command) =>
            command.type === "setHoldIndicator" &&
            command.muted === muteCommand.muted,
        );
      if (!alreadyEmitted) {
        commands.push(muteCommand);
      }
    }
  }

  return commands;
}

/**
 * - Purpose: build LED commands that align device indicators to the current snapshot.
 * - Inputs: current headset call snapshot.
 * - Outputs: ordered headset commands for connect/resync.
 */
export function resolveInitialConnectCommands(
  snapshot: HeadsetCallSnapshot,
): ReadonlyArray<HeadsetCommand> {
  if (snapshot.incomingWaitingCount > 0) {
    return [{ type: "signalIncoming" }];
  }

  if (snapshot.focusSessionId === undefined) {
    return [{ type: "clearSignal" }];
  }

  if (snapshot.focusedIsOnHold) {
    return [holdIndicatorCommand()];
  }

  if (isFocusOnOutgoing(snapshot) || hasPendingOutgoingDial(snapshot)) {
    return [{ type: "signalOutgoing" }];
  }

  const muteCommand = resolveFocusMuteCommand(snapshot);
  if (muteCommand !== null) {
    return [{ type: "answer" }, muteCommand];
  }

  return [{ type: "answer" }];
}
