import { describe, expect, it } from "vitest";
import {
  initialHeadsetCallSnapshot,
  type HeadsetCallSnapshot,
} from "./buildHeadsetCallSnapshot.js";
import {
  resolveDeviceCommandsFromSnapshot,
  resolveInitialConnectCommands,
} from "./resolveDeviceCommandsFromSnapshot.js";

function snapshot(partial: Partial<HeadsetCallSnapshot>): HeadsetCallSnapshot {
  return {
    ...initialHeadsetCallSnapshot(),
    ...partial,
  };
}

describe("resolveDeviceCommandsFromSnapshot", () => {
  it("clears ring and sends answer LED when incoming is answered", () => {
    const previous = snapshot({
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      focusSessionId: "in-1",
      focusReason: "incoming",
    });
    const next = snapshot({
      activeSessionId: "in-1",
      focusSessionId: "in-1",
      focusReason: "active",
      establishedCount: 1,
      establishedSessionIds: ["in-1"],
      focusedIsMuted: false,
      focusedIsOnHold: false,
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "answer" },
    ]);
  });

  it("does not clear incoming LED when caller identity resolves", () => {
    const previous = snapshot({
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      focusSessionId: "in-1",
      focusReason: "incoming",
    });
    const next = snapshot({
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      focusSessionId: "in-1",
      focusReason: "incoming",
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([]);
  });

  it("signals incoming and ignores other LED while waiting", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });
    const next = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "in-1",
      focusReason: "incoming",
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      operatorSelectedCallId: "active-1",
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "signalIncoming" },
    ]);
  });

  it("switches to hold LED when operator selects held session", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: false,
      focusedIsOnHold: false,
      establishedCount: 2,
      establishedSessionIds: ["held-1", "active-1"],
      heldSessionIds: ["held-1"],
      operatorSelectedCallId: undefined,
    });
    const next = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "held-1",
      focusReason: "selected",
      focusedIsMuted: true,
      focusedIsOnHold: true,
      establishedCount: 2,
      establishedSessionIds: ["held-1", "active-1"],
      heldSessionIds: ["held-1"],
      operatorSelectedCallId: "held-1",
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "setHoldIndicator", muted: false },
    ]);
  });

  it("does not drive mute LED while selected held session mute toggles", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "held-1",
      focusReason: "selected",
      focusedIsMuted: false,
      focusedIsOnHold: true,
      establishedCount: 2,
      establishedSessionIds: ["held-1", "active-1"],
      heldSessionIds: ["held-1"],
      operatorSelectedCallId: "held-1",
    });
    const next = {
      ...previous,
      focusedIsMuted: true,
    };

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([]);
  });

  it("restores active LED and mute when focus returns from held", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "held-1",
      focusReason: "selected",
      focusedIsMuted: true,
      focusedIsOnHold: true,
      establishedCount: 2,
      establishedSessionIds: ["held-1", "active-1"],
      heldSessionIds: ["held-1"],
      operatorSelectedCallId: "held-1",
    });
    const next = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "selected",
      focusedIsMuted: true,
      focusedIsOnHold: false,
      establishedCount: 2,
      establishedSessionIds: ["held-1", "active-1"],
      heldSessionIds: ["held-1"],
      operatorSelectedCallId: "active-1",
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "answer" },
      { type: "setMute", muted: true },
    ]);
  });

  it("switches to outgoing LED when outgoing captures focus over held", () => {
    const previous = snapshot({
      focusSessionId: "held-1",
      focusReason: "selected",
      focusedIsOnHold: true,
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
      operatorSelectedCallId: "held-1",
    });
    const next = snapshot({
      focusSessionId: "out-1",
      focusReason: "outgoing",
      focusedIsOnHold: false,
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
      outgoingInProgressIds: ["out-1"],
      operatorSelectedCallId: "held-1",
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "signalOutgoing" },
    ]);
  });

  it("signals outgoing when focus is on dialing session", () => {
    const previous = snapshot();
    const next = snapshot({
      focusSessionId: "out-1",
      focusReason: "outgoing",
      outgoingInProgressIds: ["out-1"],
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "signalOutgoing" },
    ]);
  });

  it("syncs mute changes on focused active session", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });
    const next = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: true,
      activeIsMuted: true,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "setMute", muted: true },
    ]);
  });

  it("keeps answered call LED after incoming answer (Q6=A)", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "in-1",
      focusReason: "incoming",
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      operatorSelectedCallId: "active-1",
    });
    const next = snapshot({
      activeSessionId: "in-1",
      focusSessionId: "in-1",
      focusReason: "selected",
      focusedIsOnHold: false,
      focusedIsMuted: false,
      establishedCount: 2,
      establishedSessionIds: ["active-1", "in-1"],
      heldSessionIds: ["active-1"],
      operatorSelectedCallId: "in-1",
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "answer" },
    ]);
  });

  it("restores previous held LED after incoming reject/miss", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "in-1",
      focusReason: "incoming",
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      operatorSelectedCallId: "held-1",
      heldSessionIds: ["held-1"],
    });
    const next = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "held-1",
      focusReason: "selected",
      focusedIsOnHold: true,
      focusedIsMuted: false,
      establishedCount: 2,
      establishedSessionIds: ["held-1", "active-1"],
      heldSessionIds: ["held-1"],
      operatorSelectedCallId: "held-1",
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "setHoldIndicator", muted: false },
    ]);
  });

  it("clears LED when all sessions end", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });
    const next = snapshot();

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "hangup" },
      { type: "clearSignal" },
    ]);
  });

  it("clears mute LED when active muted session goes on hold", () => {
    const previous = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusReason: "active",
      focusedIsMuted: true,
      focusedIsOnHold: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });
    const next = snapshot({
      focusSessionId: "active-1",
      focusReason: "held",
      focusedIsMuted: true,
      focusedIsOnHold: true,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
      heldSessionIds: ["active-1"],
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "setHoldIndicator", muted: false },
    ]);
  });

  it("keeps mute after resume when session was muted on hold", () => {
    const previous = snapshot({
      focusSessionId: "held-1",
      focusedIsOnHold: true,
      focusedIsMuted: true,
      focusReason: "held",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
    });
    const next = snapshot({
      activeSessionId: "held-1",
      focusSessionId: "held-1",
      focusedIsOnHold: false,
      focusedIsMuted: true,
      focusReason: "active",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "answer" },
      { type: "setMute", muted: true },
    ]);
  });

  it("sends answer LED when focused session resumes from hold", () => {
    const previous = snapshot({
      focusSessionId: "held-1",
      focusedIsOnHold: true,
      focusReason: "held",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
    });
    const next = snapshot({
      activeSessionId: "held-1",
      focusSessionId: "held-1",
      focusedIsOnHold: false,
      focusReason: "active",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
    });

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "answer" },
      { type: "setMute", muted: false },
    ]);
  });

  it("clears LED when held call ends with no remaining sessions", () => {
    const previous = snapshot({
      focusSessionId: "held-1",
      focusedIsOnHold: true,
      focusReason: "held",
      establishedCount: 1,
      establishedSessionIds: ["held-1"],
      heldSessionIds: ["held-1"],
    });
    const next = snapshot();

    expect(resolveDeviceCommandsFromSnapshot(previous, next)).toEqual([
      { type: "hangup" },
      { type: "clearSignal" },
    ]);
  });
});

describe("resolveInitialConnectCommands", () => {
  it("prioritizes incoming then focused hold then active mute", () => {
    expect(
      resolveInitialConnectCommands(
        snapshot({
          incomingWaitingCount: 1,
          firstIncomingCallId: "in-1",
          focusSessionId: "in-1",
          focusReason: "incoming",
        }),
      ),
    ).toEqual([{ type: "signalIncoming" }]);

    expect(
      resolveInitialConnectCommands(
        snapshot({
          focusSessionId: "held-1",
          focusReason: "selected",
          focusedIsOnHold: true,
          heldSessionIds: ["held-1"],
          establishedCount: 1,
          establishedSessionIds: ["held-1"],
        }),
      ),
    ).toEqual([{ type: "setHoldIndicator", muted: false }]);

    expect(
      resolveInitialConnectCommands(
        snapshot({
          focusSessionId: "active-1",
          focusReason: "active",
          focusedIsMuted: true,
          activeSessionId: "active-1",
          establishedCount: 1,
          establishedSessionIds: ["active-1"],
        }),
      ),
    ).toEqual([{ type: "answer" }, { type: "setMute", muted: true }]);

    expect(
      resolveInitialConnectCommands(
        snapshot({
          focusSessionId: "active-1",
          focusReason: "active",
          focusedIsMuted: false,
          activeSessionId: "active-1",
          establishedCount: 1,
          establishedSessionIds: ["active-1"],
        }),
      ),
    ).toEqual([{ type: "answer" }, { type: "setMute", muted: false }]);
  });
});
