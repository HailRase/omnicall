import { describe, expect, it } from "vitest";
import {
  createHidEdgeDetector,
  mapHidPhoneActionToHardwareEvent,
} from "./hidEdgeDetector.js";

describe("hidEdgeDetector mute edges", () => {
  it("maps both mute edges to absolute muteChanged in latch mode", () => {
    expect(mapHidPhoneActionToHardwareEvent({ type: "mute", state: "muted" })).toEqual({
      type: "muteChanged",
      muted: true,
    });
    expect(mapHidPhoneActionToHardwareEvent({ type: "mute", state: "unmuted" })).toEqual({
      type: "muteChanged",
      muted: false,
    });
  });

  it("emits unmuted after muted in latch mode", () => {
    const detector = createHidEdgeDetector(false, "latch");
    detector.syncState({ hookSwitch: true, phoneMute: false });

    expect(detector.detect({ phoneMute: true })).toEqual({
      type: "mute",
      state: "muted",
    });
    expect(detector.detect({ phoneMute: false })).toEqual({
      type: "mute",
      state: "unmuted",
    });
  });

  it("pulse mode collapses unmute release so next press can rise again", () => {
    const detector = createHidEdgeDetector(false, "pulse");
    detector.syncState({ hookSwitch: true, phoneMute: false });

    expect(detector.detect({ phoneMute: true })).toEqual({
      type: "mute",
      state: "muted",
    });
    expect(detector.detect({ phoneMute: false })).toBeNull();
    expect(detector.getState().phoneMute).toBe(false);

    expect(detector.detect({ phoneMute: true })).toEqual({
      type: "mute",
      state: "muted",
    });
  });
});
