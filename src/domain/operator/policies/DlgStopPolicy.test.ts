import { describe, expect, it } from "vitest";
import { createCallId } from "@domain/telephony/CallId.js";
import {
  canRequestDlgStop,
  initialDlgStopPolicyState,
  markDlgStopSent,
} from "./DlgStopPolicy.js";

describe("DlgStopPolicy", () => {
  const callId = createCallId("call-policy-1");

  it("allows first dlg_stop request per callId", () => {
    const state = initialDlgStopPolicyState();
    expect(canRequestDlgStop(state, callId)).toBe(true);
  });

  it("blocks duplicate dlg_stop for same callId", () => {
    const state = markDlgStopSent(initialDlgStopPolicyState(), callId);
    expect(canRequestDlgStop(state, callId)).toBe(false);
  });

  it("tracks different callIds independently", () => {
    const otherCallId = createCallId("call-policy-2");
    const state = markDlgStopSent(initialDlgStopPolicyState(), callId);
    expect(canRequestDlgStop(state, otherCallId)).toBe(true);
  });
});
