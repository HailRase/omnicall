import { describe, expect, it } from "vitest";
import {
  resolveNextMutedForHardwareEvent,
  shouldApplyHardwareMuteChange,
} from "./headsetMutePolicy.js";
import { resolveHoldActionFromHookOff } from "./headsetHoldPolicy.js";

describe("shouldApplyHardwareMuteChange", () => {
  it("absolute applies only when event differs from focused mute", () => {
    expect(shouldApplyHardwareMuteChange("absolute", true, false)).toBe(true);
    expect(shouldApplyHardwareMuteChange("absolute", true, true)).toBe(false);
    expect(shouldApplyHardwareMuteChange("absolute", false, true)).toBe(true);
  });

  it("toggle always applies", () => {
    expect(shouldApplyHardwareMuteChange("toggle", true, true)).toBe(true);
    expect(shouldApplyHardwareMuteChange("toggle", false, false)).toBe(true);
  });
});

describe("resolveNextMutedForHardwareEvent", () => {
  it("absolute uses event muted bit", () => {
    expect(resolveNextMutedForHardwareEvent("absolute", true, false)).toBe(true);
    expect(resolveNextMutedForHardwareEvent("absolute", false, true)).toBe(false);
  });

  it("toggle inverts focused mute", () => {
    expect(resolveNextMutedForHardwareEvent("toggle", true, true)).toBe(false);
    expect(resolveNextMutedForHardwareEvent("toggle", false, false)).toBe(true);
  });
});

describe("resolveHoldActionFromHookOff", () => {
  it("resumes when hold LED semantics and focused held", () => {
    expect(
      resolveHoldActionFromHookOff({
        holdSemantics: "hookOffResumesWhenHoldLed",
        focusedIsOnHold: true,
        hardwareHoldLocked: false,
      }),
    ).toBe("resume");
  });

  it("returns null for dedicatedHoldButton", () => {
    expect(
      resolveHoldActionFromHookOff({
        holdSemantics: "dedicatedHoldButton",
        focusedIsOnHold: true,
        hardwareHoldLocked: false,
      }),
    ).toBeNull();
  });

  it("returns null when not held or hold-locked", () => {
    expect(
      resolveHoldActionFromHookOff({
        holdSemantics: "hookOffResumesWhenHoldLed",
        focusedIsOnHold: false,
        hardwareHoldLocked: false,
      }),
    ).toBeNull();
    expect(
      resolveHoldActionFromHookOff({
        holdSemantics: "hookOffResumesWhenHoldLed",
        focusedIsOnHold: true,
        hardwareHoldLocked: true,
      }),
    ).toBeNull();
  });
});
