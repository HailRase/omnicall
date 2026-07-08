import { describe, expect, it } from "vitest";
import {
  initialIncomingCallProjection,
  type IncomingCallProjection,
} from "./incomingCallProjection.js";
import { deriveIncomingCallGlobalOverlayVisible } from "./deriveIncomingCallGlobalOverlayVisible.js";
import { deriveIncomingCallSessionCardVisible } from "./deriveIncomingCallSessionCardVisible.js";

function ringingProjection(callId: string): IncomingCallProjection {
  return {
    ...initialIncomingCallProjection(),
    visible: true,
    callId,
    callerNumber: "+12025550100",
    uiState: "incomingRinging",
    ringingIndicator: "ringing",
  };
}

const baseSessionCardInput = {
  incomingCallId: "call-a",
  transferPanelVisible: false,
  transferSuccessCelebrationVisible: false,
  dialpadMode: "number" as const,
  dtmfPanelCallId: null,
  numberEntryOverlayOpen: false,
};

describe("deriveIncomingCallSessionCardVisible", () => {
  it("is true for incoming call on default dialpad surface", () => {
    expect(deriveIncomingCallSessionCardVisible(baseSessionCardInput)).toBe(true);
  });

  it("is false during DTMF mode", () => {
    expect(
      deriveIncomingCallSessionCardVisible({
        ...baseSessionCardInput,
        dialpadMode: "dtmf",
        dtmfPanelCallId: "held-1",
      }),
    ).toBe(false);
  });

  it("is false during transfer panel", () => {
    expect(
      deriveIncomingCallSessionCardVisible({
        ...baseSessionCardInput,
        transferPanelVisible: true,
      }),
    ).toBe(false);
  });

  it("is false during number entry overlay", () => {
    expect(
      deriveIncomingCallSessionCardVisible({
        ...baseSessionCardInput,
        numberEntryOverlayOpen: true,
      }),
    ).toBe(false);
  });
});

describe("deriveIncomingCallGlobalOverlayVisible", () => {
  it("hides overlay on dialpad when session card is visible", () => {
    expect(
      deriveIncomingCallGlobalOverlayVisible({
        incomingCallProjection: ringingProjection("call-a"),
        dismissedCallId: null,
        shellRouteName: "dialpad",
        incomingSessionCardVisible: true,
      }),
    ).toBe(false);
  });

  it("shows overlay on dialpad when session card is hidden by DTMF", () => {
    expect(
      deriveIncomingCallGlobalOverlayVisible({
        incomingCallProjection: ringingProjection("call-a"),
        dismissedCallId: null,
        shellRouteName: "dialpad",
        incomingSessionCardVisible: false,
      }),
    ).toBe(true);
  });

  it("shows overlay on history even when session card would render behind the panel", () => {
    expect(
      deriveIncomingCallGlobalOverlayVisible({
        incomingCallProjection: ringingProjection("call-a"),
        dismissedCallId: null,
        shellRouteName: "history",
        incomingSessionCardVisible: true,
      }),
    ).toBe(true);
  });

  it("respects dismiss state per callId", () => {
    expect(
      deriveIncomingCallGlobalOverlayVisible({
        incomingCallProjection: ringingProjection("call-a"),
        dismissedCallId: "call-a",
        shellRouteName: "history",
        incomingSessionCardVisible: false,
      }),
    ).toBe(false);
  });
});
