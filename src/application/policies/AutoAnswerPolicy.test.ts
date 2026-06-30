import { describe, expect, it } from "vitest";
import { createBreakReason } from "@domain/index.js";
import { decideAutoAnswer } from "./AutoAnswerPolicy.js";

describe("AutoAnswerPolicy", () => {
  it("returns null when auto answer is disabled", () => {
    const decision = decideAutoAnswer({
      autoAnswerTimeoutSec: null,
      autoAnswerDuringActiveSessionEnabled: false,
      rejectReasonRequired: false,
      allowedBreakReasons: [createBreakReason("break")],
    });
    expect(decision).toBeNull();
  });

  it("returns timeout when enabled", () => {
    const decision = decideAutoAnswer({
      autoAnswerTimeoutSec: 3,
      autoAnswerDuringActiveSessionEnabled: false,
      rejectReasonRequired: false,
      allowedBreakReasons: [createBreakReason("break")],
    });
    expect(decision).toEqual({
      enabled: true,
      timeoutSec: 3,
    });
  });

  it("accepts zero-second immediate auto-answer", () => {
    const decision = decideAutoAnswer({
      autoAnswerTimeoutSec: 0,
      autoAnswerDuringActiveSessionEnabled: false,
      rejectReasonRequired: false,
      allowedBreakReasons: [createBreakReason("break")],
    });
    expect(decision).toEqual({
      enabled: true,
      timeoutSec: 0,
    });
  });
});
