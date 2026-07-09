import { describe, expect, it } from "vitest";
import { buildHeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";
import { initialIncomingCallProjection } from "../projections/telephony/incomingCallProjection.js";
import { initialMultiLineCallProjection } from "../projections/telephony/multiLineCallProjection.js";

describe("buildHeadsetCallSnapshot", () => {
  it("maps incoming ringing call to waiting snapshot", () => {
    const snapshot = buildHeadsetCallSnapshot(initialMultiLineCallProjection(), {
      ...initialIncomingCallProjection(),
      visible: true,
      callId: "call-in-1",
      uiState: "incomingRinging",
      ringingIndicator: "ringing",
    });

    expect(snapshot.incomingWaitingCount).toBe(1);
    expect(snapshot.firstIncomingCallId).toBe("call-in-1");
  });

  it("maps active and held established lines", () => {
    const snapshot = buildHeadsetCallSnapshot(
      {
        ...initialMultiLineCallProjection(),
        lines: [
          {
            callId: "held-1",
            role: "primary",
            state: "Held",
            muted: false,
            displayLabel: null,
            remoteNumber: null,
            activeSinceMs: null,
            isRemoteHold: false,
            dtmfHistory: "",
            lastDtmfTone: null,
          },
          {
            callId: "active-1",
            role: "primary",
            state: "Active",
            muted: true,
            displayLabel: null,
            remoteNumber: null,
            activeSinceMs: 100,
            isRemoteHold: false,
            dtmfHistory: "",
            lastDtmfTone: null,
          },
        ],
        primaryCallId: "active-1",
      },
      initialIncomingCallProjection(),
    );

    expect(snapshot.establishedCount).toBe(2);
    expect(snapshot.activeSessionId).toBe("active-1");
    expect(snapshot.activeIsMuted).toBe(true);
    expect(snapshot.heldSessionIds).toEqual(["held-1"]);
  });
});
