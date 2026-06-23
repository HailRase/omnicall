import { describe, expect, it } from "vitest";
import {
  countEstablishedCalls,
  createIncomingCall,
  createOutgoingCall,
  createCallId,
  createPhoneNumber,
  deriveSecondSessionDialpadDisabled,
  evaluateSecondSessionBlock,
  getCallsToHoldBeforeOutgoing,
  getCallsToHoldForExclusiveResume,
  shouldHoldAllBeforeOutgoing,
} from "@domain/index.js";

describe("MultiCallPolicy", () => {
  const settingsEnabled = { multiSessionsEnabled: true } as const;
  const settingsDisabled = { multiSessionsEnabled: false } as const;

  it("LF-032 blocks second session when multi-sessions disabled", () => {
    const decision = evaluateSecondSessionBlock(1, settingsDisabled);
    expect(decision).toEqual({ blocked: true, reason: "multi_sessions_disabled" });
  });

  it("LF-032 allows second session when multi-sessions enabled", () => {
    expect(evaluateSecondSessionBlock(1, settingsEnabled)).toEqual({ blocked: false });
    expect(evaluateSecondSessionBlock(0, settingsDisabled)).toEqual({ blocked: false });
  });

  it("LF-021 identifies established calls to hold before outgoing", () => {
    const active = createOutgoingCall(createCallId("a"), createPhoneNumber("+1"));
    const held = { ...active, id: createCallId("b"), state: "Held" as const };
    const ended = { ...active, id: createCallId("c"), state: "Ended" as const };
    const calls = [
      { ...active, state: "Active" as const },
      held,
      ended,
    ];
    expect(shouldHoldAllBeforeOutgoing(calls)).toBe(true);
    expect(getCallsToHoldBeforeOutgoing(calls).map((call) => call.id)).toEqual([
      "a",
      "b",
    ]);
    expect(countEstablishedCalls(calls)).toBe(2);
  });

  it("LF-023 returns other active calls to hold before exclusive resume", () => {
    const callA = {
      ...createOutgoingCall(createCallId("a"), createPhoneNumber("+1")),
      state: "Active" as const,
    };
    const callB = {
      ...createIncomingCall(createCallId("b"), createPhoneNumber("+2")),
      state: "Held" as const,
    };
    const callC = {
      ...createOutgoingCall(createCallId("c"), createPhoneNumber("+3")),
      state: "Active" as const,
    };
    expect(getCallsToHoldForExclusiveResume([callA, callB, callC], callB.id)).toEqual([
      callA,
      callC,
    ]);
  });

  it("derives dialpad disabled state from projection inputs", () => {
    expect(
      deriveSecondSessionDialpadDisabled(false, false, false, settingsDisabled),
    ).toEqual({ disabled: false, reason: null });
    expect(
      deriveSecondSessionDialpadDisabled(true, false, false, settingsDisabled),
    ).toEqual({ disabled: true, reason: "second_session_disabled" });
    expect(
      deriveSecondSessionDialpadDisabled(true, false, false, settingsEnabled),
    ).toEqual({ disabled: false, reason: null });
    expect(
      deriveSecondSessionDialpadDisabled(false, true, false, settingsEnabled),
    ).toEqual({ disabled: true, reason: "second_session_disabled" });
    expect(
      deriveSecondSessionDialpadDisabled(true, false, true, settingsEnabled),
    ).toEqual({ disabled: true, reason: "hold_all_in_progress" });
  });
});
