import { describe, expect, it, vi } from "vitest";
import {
  initialHeadsetCallSnapshot,
  type HeadsetCallSnapshot,
} from "./buildHeadsetCallSnapshot.js";
import { forwardHeadsetHardwareEvent } from "./forwardHeadsetHardwareEvent.js";
import { HeadsetSyncQueue } from "./HeadsetSyncQueue.js";
import { resolveHangupTargetId } from "./resolveHangupTargetId.js";

function snapshot(partial: Partial<HeadsetCallSnapshot>): HeadsetCallSnapshot {
  return {
    ...initialHeadsetCallSnapshot(),
    ...partial,
  };
}

function createContext(
  muteInputMode: "pulse" | "latch" = "latch",
): {
  hookGuard: { suppressedUntil: number };
  acceptGuard: { suppressedUntil: number };
  queue: HeadsetSyncQueue;
  muteInputMode: "pulse" | "latch";
} {
  return {
    hookGuard: { suppressedUntil: 0 },
    acceptGuard: { suppressedUntil: 0 },
    queue: new HeadsetSyncQueue(),
    muteInputMode,
  };
}

function callbacks(overrides: Partial<{
  onAnswer: ReturnType<typeof vi.fn>;
  onReject: ReturnType<typeof vi.fn>;
  onHangup: ReturnType<typeof vi.fn>;
  onToggleHold: ReturnType<typeof vi.fn>;
  onSetMute: ReturnType<typeof vi.fn>;
}> = {}) {
  return {
    onAnswer: overrides.onAnswer ?? vi.fn(),
    onReject: overrides.onReject ?? vi.fn(),
    onHangup: overrides.onHangup ?? vi.fn(),
    onToggleHold: overrides.onToggleHold ?? vi.fn(),
    onSetMute: overrides.onSetMute ?? vi.fn(),
  };
}

describe("resolveHangupTargetId (focus hangup Q1=B)", () => {
  it("hangs up focused active session", () => {
    expect(
      resolveHangupTargetId(
        snapshot({
          activeSessionId: "active-1",
          focusSessionId: "active-1",
          establishedCount: 1,
          establishedSessionIds: ["active-1"],
        }),
      ),
    ).toBe("active-1");
  });

  it("hangs up focused held even when another line is active", () => {
    expect(
      resolveHangupTargetId(
        snapshot({
          activeSessionId: "active-1",
          focusSessionId: "held-1",
          focusedIsOnHold: true,
          establishedCount: 2,
          establishedSessionIds: ["held-1", "active-1"],
          heldSessionIds: ["held-1"],
        }),
      ),
    ).toBe("held-1");
  });

  it("hangs up focused held-only session", () => {
    expect(
      resolveHangupTargetId(
        snapshot({
          focusSessionId: "held-1",
          focusedIsOnHold: true,
          establishedCount: 1,
          establishedSessionIds: ["held-1"],
          heldSessionIds: ["held-1"],
        }),
      ),
    ).toBe("held-1");
  });

  it("cancels focused outgoing dial", () => {
    expect(
      resolveHangupTargetId(
        snapshot({
          focusSessionId: "out-1",
          outgoingInProgressIds: ["out-1"],
        }),
      ),
    ).toBe("out-1");
  });
});

describe("forwardHeadsetHardwareEvent (jssip-phone parity)", () => {
  it("resumes focused held on hookOff (hold LED offHook:false → green press)", () => {
    const onToggleHold = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "hookOff" },
      snapshot({
        focusSessionId: "held-1",
        focusedIsOnHold: true,
        heldSessionIds: ["held-1"],
        establishedCount: 1,
        establishedSessionIds: ["held-1"],
      }),
      undefined,
      callbacks({ onToggleHold }),
      createContext(),
    );
    expect(onToggleHold).toHaveBeenCalledWith("held-1");
  });

  it("hangs up focused held on hookOn (resume remains hookOff)", () => {
    const onToggleHold = vi.fn();
    const onHangup = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "hookOn" },
      snapshot({
        focusSessionId: "held-1",
        focusedIsOnHold: true,
        heldSessionIds: ["held-1"],
        establishedCount: 1,
        establishedSessionIds: ["held-1"],
      }),
      undefined,
      callbacks({ onToggleHold, onHangup }),
      createContext(),
    );
    expect(onToggleHold).not.toHaveBeenCalled();
    expect(onHangup).toHaveBeenCalledWith("held-1");
  });

  it("toggles mute on focused held session", () => {
    const onSetMute = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: true },
      snapshot({
        focusSessionId: "held-1",
        focusedIsOnHold: true,
        focusedIsMuted: false,
        heldSessionIds: ["held-1"],
        establishedCount: 1,
        establishedSessionIds: ["held-1"],
      }),
      undefined,
      callbacks({ onSetMute }),
      createContext(),
    );
    expect(onSetMute).toHaveBeenCalledWith("held-1", true);
  });

  it("hangs up active on hookOn", () => {
    const onHangup = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "hookOn" },
      snapshot({
        activeSessionId: "active-1",
        focusSessionId: "active-1",
        establishedCount: 1,
        establishedSessionIds: ["active-1"],
      }),
      undefined,
      callbacks({ onHangup }),
      createContext(),
    );
    expect(onHangup).toHaveBeenCalledWith("active-1");
  });

  it("applies absolute mute on muted:true and muted:false for latch mode", () => {
    const onSetMute = vi.fn();
    const context = createContext("latch");
    const active = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusedIsMuted: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });

    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: true },
      active,
      undefined,
      callbacks({ onSetMute }),
      context,
    );
    expect(onSetMute).toHaveBeenCalledWith("active-1", true);

    context.queue.abortMuteSync("active-1");
    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: false },
      { ...active, focusedIsMuted: true },
      undefined,
      callbacks({ onSetMute }),
      context,
    );
    expect(onSetMute).toHaveBeenCalledWith("active-1", false);
    expect(onSetMute).toHaveBeenCalledTimes(2);
  });

  it("pulse mode toggles on muted:true and ignores muted:false", () => {
    const onSetMute = vi.fn();
    const context = createContext("pulse");
    const active = snapshot({
      activeSessionId: "active-1",
      focusSessionId: "active-1",
      focusedIsMuted: false,
      establishedCount: 1,
      establishedSessionIds: ["active-1"],
    });

    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: true },
      active,
      undefined,
      callbacks({ onSetMute }),
      context,
    );
    expect(onSetMute).toHaveBeenCalledWith("active-1", true);

    context.queue.abortMuteSync("active-1");
    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: false },
      { ...active, focusedIsMuted: true },
      undefined,
      callbacks({ onSetMute }),
      context,
    );
    expect(onSetMute).toHaveBeenCalledTimes(1);

    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: true },
      { ...active, focusedIsMuted: true },
      undefined,
      callbacks({ onSetMute }),
      context,
    );
    expect(onSetMute).toHaveBeenCalledWith("active-1", false);
    expect(onSetMute).toHaveBeenCalledTimes(2);
  });

  it("ignores mute while mute sync intent is pending", () => {
    const onSetMute = vi.fn();
    const context = createContext("latch");
    expect(context.queue.beginMuteSessionSync("active-1", true)).toBe(true);

    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: true },
      snapshot({
        activeSessionId: "active-1",
        focusSessionId: "active-1",
        focusedIsMuted: false,
        establishedCount: 1,
        establishedSessionIds: ["active-1"],
      }),
      undefined,
      callbacks({ onSetMute }),
      context,
    );
    expect(onSetMute).not.toHaveBeenCalled();
  });

  it("rejects second mute begin while sync intent is pending", () => {
    const queue = new HeadsetSyncQueue();
    expect(queue.beginMuteSessionSync("active-1", true)).toBe(true);
    expect(queue.beginMuteSessionSync("active-1", false)).toBe(false);
    expect(queue.beginHoldSessionSync("active-1", "hold")).toBe(false);
    expect(queue.getBusyState()).toEqual({
      muteSessionId: "active-1",
      holdSessionId: null,
      isBusy: true,
    });
  });

  it("ignores mute while focus is outgoing connecting", () => {
    const onSetMute = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: true },
      snapshot({
        focusSessionId: "out-1",
        focusReason: "outgoing",
        outgoingInProgressIds: ["out-1"],
      }),
      undefined,
      callbacks({ onSetMute }),
      createContext(),
    );
    expect(onSetMute).not.toHaveBeenCalled();
  });

  it("ignores mute while any outgoing dial is pending even if focus elsewhere", () => {
    const onSetMute = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "muteChanged", muted: true },
      snapshot({
        focusSessionId: "held-1",
        focusReason: "held",
        focusedIsOnHold: true,
        establishedCount: 1,
        establishedSessionIds: ["held-1"],
        heldSessionIds: ["held-1"],
        outgoingInProgressIds: ["out-1"],
      }),
      undefined,
      callbacks({ onSetMute }),
      createContext(),
    );
    expect(onSetMute).not.toHaveBeenCalled();
  });

  it("answers incoming on hookOff", () => {
    const onAnswer = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "hookOff" },
      snapshot({
        focusSessionId: "in-1",
        incomingWaitingCount: 1,
        firstIncomingCallId: "in-1",
        activeSessionId: "active-1",
        establishedCount: 1,
        establishedSessionIds: ["active-1"],
      }),
      "in-1",
      callbacks({ onAnswer }),
      createContext(),
    );
    expect(onAnswer).toHaveBeenCalledWith("in-1");
  });

  it("cancels focused outgoing on hookOn", () => {
    const onHangup = vi.fn();
    forwardHeadsetHardwareEvent(
      { type: "hookOn" },
      snapshot({
        focusSessionId: "out-1",
        outgoingInProgressIds: ["out-1"],
      }),
      undefined,
      callbacks({ onHangup }),
      createContext(),
    );
    expect(onHangup).toHaveBeenCalledWith("out-1");
  });
});
