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

  it("moves to Failed from ringing", () => {
    const failed = transitionCallState("Ringing", "failed");
    expect(failed).toEqual({ ok: true, state: "Failed" });
  });

  it("allows active call to end", () => {
    const ended = transitionCallState("Active", "ended");
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
});

