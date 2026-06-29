import { describe, expect, it } from "vitest";
import { initialCallState } from "./CallState.js";
import { transitionCallState } from "./CallStateMachine.js";

describe("CallStateMachine", () => {
  it("moves incoming call from Idle to Ringing", () => {
    const incoming = transitionCallState("Idle", "incoming_received");
    expect(incoming).toEqual({ ok: true, state: "Ringing" });
  });

  it("starts from Idle", () => {
    expect(initialCallState()).toBe("Idle");
  });

  it("moves outgoing flow to Active", () => {
    const requested = transitionCallState("Idle", "outgoing_requested");
    expect(requested).toEqual({ ok: true, state: "Connecting" });
    if (!requested.ok) {
      return;
    }

    const progress = transitionCallState(requested.state, "progress_received");
    expect(progress).toEqual({ ok: true, state: "Ringing" });
    if (!progress.ok) {
      return;
    }

    const answered = transitionCallState(progress.state, "answered");
    expect(answered).toEqual({ ok: true, state: "Active" });
  });

  it("rejects invalid transition from Idle to answered", () => {
    const transition = transitionCallState("Idle", "answered");
    expect(transition.ok).toBe(false);
    if (transition.ok) {
      return;
    }
    expect(transition.reason).toBe("answer_requires_connecting_or_ringing");
  });

  it("moves active call to held and back", () => {
    const held = transitionCallState("Active", "hold_requested");
    expect(held).toEqual({ ok: true, state: "Held" });
    if (!held.ok) {
      return;
    }

    const resumed = transitionCallState(held.state, "resumed");
    expect(resumed).toEqual({ ok: true, state: "Active" });
  });

  it("rejects hold from non-active state", () => {
    const invalidHold = transitionCallState("Ringing", "hold_requested");
    expect(invalidHold.ok).toBe(false);
    if (invalidHold.ok) {
      return;
    }
    expect(invalidHold.reason).toBe("hold_requires_active");
  });

  it("rejects resume from non-held state", () => {
    const invalidResume = transitionCallState("Active", "resumed");
    expect(invalidResume.ok).toBe(false);
    if (invalidResume.ok) {
      return;
    }
    expect(invalidResume.reason).toBe("resume_requires_held");
  });

  it("rejects hangup completion when call is not ending", () => {
    const invalidHangup = transitionCallState("Active", "hangup_completed");
    expect(invalidHangup.ok).toBe(false);
    if (invalidHangup.ok) {
      return;
    }
    expect(invalidHangup.reason).toBe("hangup_complete_requires_ending");
  });

  it("moves to Failed from ringing", () => {
    const failed = transitionCallState("Ringing", "failed");
    expect(failed).toEqual({ ok: true, state: "Failed" });
  });

  it("allows active call to end", () => {
    const ended = transitionCallState("Active", "ended");
    expect(ended).toEqual({ ok: true, state: "Ended" });
  });

  it("allows held call to end on remote hangup", () => {
    const ended = transitionCallState("Held", "ended");
    expect(ended).toEqual({ ok: true, state: "Ended" });
  });

  it("allows conference call to end on remote hangup", () => {
    const ended = transitionCallState("Conference", "ended");
    expect(ended).toEqual({ ok: true, state: "Ended" });
  });

  it("moves ringing call to Ending and Ended on reject", () => {
    const ending = transitionCallState("Ringing", "reject_requested");
    expect(ending).toEqual({ ok: true, state: "Ending" });
    if (!ending.ok) {
      return;
    }

    const ended = transitionCallState(ending.state, "reject_completed");
    expect(ended).toEqual({ ok: true, state: "Ended" });
  });

  it("allows ringing call to end before answer", () => {
    const ended = transitionCallState("Ringing", "ended");
    expect(ended).toEqual({ ok: true, state: "Ended" });
  });

  it("allows reset from terminal states", () => {
    const fromFailed = transitionCallState("Failed", "reset");
    expect(fromFailed).toEqual({ ok: true, state: "Idle" });
    const fromEnded = transitionCallState("Ended", "reset");
    expect(fromEnded).toEqual({ ok: true, state: "Idle" });
  });

  it("rejects invalid outgoing transition", () => {
    const invalid = transitionCallState("Active", "outgoing_requested");
    expect(invalid.ok).toBe(false);
  });

  it("moves active call to Transferring on transfer_requested", () => {
    const transferring = transitionCallState("Active", "transfer_requested");
    expect(transferring).toEqual({ ok: true, state: "Transferring" });
  });

  it("moves held call to Transferring on transfer_requested", () => {
    const transferring = transitionCallState("Held", "transfer_requested");
    expect(transferring).toEqual({ ok: true, state: "Transferring" });
  });

  it("rejects transfer_requested from Ringing", () => {
    const invalid = transitionCallState("Ringing", "transfer_requested");
    expect(invalid.ok).toBe(false);
    if (invalid.ok) {
      return;
    }
    expect(invalid.reason).toBe("transfer_requires_active_or_held");
  });

  it("completes blind transfer to Ended", () => {
    const completed = transitionCallState("Transferring", "transfer_completed");
    expect(completed).toEqual({ ok: true, state: "Ended" });
  });

  it("rejects transfer_completed from Active", () => {
    const invalid = transitionCallState("Active", "transfer_completed");
    expect(invalid.ok).toBe(false);
    if (invalid.ok) {
      return;
    }
    expect(invalid.reason).toBe("transfer_complete_requires_transferring");
  });

  it("restores Active on transfer_failed from Transferring", () => {
    const restored = transitionCallState("Transferring", "transfer_failed");
    expect(restored).toEqual({ ok: true, state: "Active" });
  });

  it("ends call on ended from Transferring", () => {
    const ended = transitionCallState("Transferring", "ended");
    expect(ended).toEqual({ ok: true, state: "Ended" });
  });

  it("rejects transfer_failed from non-transferring state", () => {
    const invalid = transitionCallState("Active", "transfer_failed");
    expect(invalid.ok).toBe(false);
    if (invalid.ok) {
      return;
    }
    expect(invalid.reason).toBe("transfer_failed_requires_transferring");
  });
});

