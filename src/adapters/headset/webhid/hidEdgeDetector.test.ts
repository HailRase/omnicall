import { describe, expect, it } from "vitest";
import {
  createHidEdgeDetector,
  mapHidPhoneActionToHardwareEvent,
} from "./hidEdgeDetector.js";

describe("mapHidPhoneActionToHardwareEvent", () => {
  it("maps both mute edges to absolute muteChanged", () => {
    expect(mapHidPhoneActionToHardwareEvent({ type: "mute", state: "muted" })).toEqual({
      type: "muteChanged",
      muted: true,
    });
    expect(mapHidPhoneActionToHardwareEvent({ type: "mute", state: "unmuted" })).toEqual({
      type: "muteChanged",
      muted: false,
    });
  });
});

describe("createHidEdgeDetector", () => {
  it("emits unmuted after muted", () => {
    const detector = createHidEdgeDetector(false);
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
});
