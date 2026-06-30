import { applyCallTransition, createIncomingCall, createOutgoingCall } from "./Call.js";
import { createCallId } from "./CallId.js";
import { createPhoneNumber } from "./PhoneNumber.js";
import { describe, expect, it } from "vitest";
import {
  countOtherSessionsForAutoAnswer,
  evaluateAutoAnswerGlobalBlock,
  evaluateIncomingAutoAnswerSchedule,
  resolveAutoAnswerSchedule,
  shouldScheduleAutoAnswer,
} from "./resolveAutoAnswerSchedule.js";

function ringingIncoming(id: string) {
  const base = createIncomingCall(createCallId(id), createPhoneNumber("+12025550000"));
  const transitioned = applyCallTransition(base, "incoming_received");
  if (!transitioned.transition.ok) {
    throw new Error("test_setup_failed");
  }
  return transitioned.call;
}

function activeOutgoing(id: string) {
  const base = createOutgoingCall(createCallId(id), createPhoneNumber("+12025550001"));
  const connecting = applyCallTransition(base, "outgoing_requested");
  const answered = applyCallTransition(connecting.call, "answered");
  if (!answered.transition.ok) {
    throw new Error("test_setup_failed");
  }
  return answered.call;
}

function connectingOutgoing(id: string) {
  const base = createOutgoingCall(createCallId(id), createPhoneNumber("+12025550002"));
  const connecting = applyCallTransition(base, "outgoing_requested");
  if (!connecting.transition.ok) {
    throw new Error("test_setup_failed");
  }
  return connecting.call;
}

describe("resolveAutoAnswerSchedule", () => {
  it("returns null when auto-answer is disabled", () => {
    expect(resolveAutoAnswerSchedule(null)).toBeNull();
  });

  it("accepts zero-second immediate auto-answer", () => {
    expect(resolveAutoAnswerSchedule(0)).toEqual({ timeoutSec: 0 });
  });

  it("accepts positive timeout within range", () => {
    expect(resolveAutoAnswerSchedule(15)).toEqual({ timeoutSec: 15 });
  });

  it("rejects negative and out-of-range values", () => {
    expect(resolveAutoAnswerSchedule(-1)).toBeNull();
    expect(resolveAutoAnswerSchedule(301)).toBeNull();
    expect(resolveAutoAnswerSchedule(1.5)).toBeNull();
  });
});

describe("countOtherSessionsForAutoAnswer", () => {
  it("counts ringing and connecting sessions as peer sessions", () => {
    const target = createCallId("incoming-target");
    const calls = [
      ringingIncoming("incoming-peer"),
      connectingOutgoing("outgoing-connecting"),
      ringingIncoming("incoming-target"),
    ];
    expect(countOtherSessionsForAutoAnswer(calls, target)).toBe(2);
  });
});

describe("shouldScheduleAutoAnswer", () => {
  it("allows scheduling when no peer sessions exist", () => {
    expect(shouldScheduleAutoAnswer(0, false)).toBe(true);
    expect(shouldScheduleAutoAnswer(0, true)).toBe(true);
  });

  it("blocks scheduling during peer sessions unless policy allows", () => {
    expect(shouldScheduleAutoAnswer(1, false)).toBe(false);
    expect(shouldScheduleAutoAnswer(2, false)).toBe(false);
    expect(shouldScheduleAutoAnswer(1, true)).toBe(true);
  });
});

describe("evaluateAutoAnswerGlobalBlock", () => {
  it("blocks while outgoing call is connecting", () => {
    const calls = [connectingOutgoing("outgoing")];
    expect(evaluateAutoAnswerGlobalBlock(calls, null, false)).toBe("outgoing_connecting");
  });

  it("blocks during transfer mode or transferring call state", () => {
    const transferring = applyCallTransition(activeOutgoing("transferring"), "transfer_requested").call;
    expect(evaluateAutoAnswerGlobalBlock([transferring], null, false)).toBe(
      "transfer_in_progress",
    );
    expect(evaluateAutoAnswerGlobalBlock([], null, true)).toBe("transfer_in_progress");
  });
});

describe("evaluateIncomingAutoAnswerSchedule", () => {
  it("blocks second incoming when busy policy is disabled and peer is ringing", () => {
    const target = createCallId("incoming-2");
    const decision = evaluateIncomingAutoAnswerSchedule({
      calls: [ringingIncoming("incoming-1"), ringingIncoming("incoming-2")],
      targetIncomingCallId: target,
      autoAnswerDuringActiveSessionEnabled: false,
      transferSession: null,
      transferModeActive: false,
      timeoutSec: 5,
    });
    expect(decision).toEqual({
      action: "blocked",
      reason: "other_session_busy_policy",
    });
  });

  it("schedules when busy policy allows peer sessions", () => {
    const target = createCallId("incoming-2");
    const decision = evaluateIncomingAutoAnswerSchedule({
      calls: [activeOutgoing("active"), ringingIncoming("incoming-2")],
      targetIncomingCallId: target,
      autoAnswerDuringActiveSessionEnabled: true,
      transferSession: null,
      transferModeActive: false,
      timeoutSec: 3,
    });
    expect(decision).toEqual({ action: "schedule", timeoutSec: 3 });
  });
});
