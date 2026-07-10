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
    expect(snapshot.focusSessionId).toBe("call-in-1");
    expect(snapshot.focusReason).toBe("incoming");
  });

  it("keeps incoming waiting across caller identity ui states", () => {
    const snapshot = buildHeadsetCallSnapshot(initialMultiLineCallProjection(), {
      ...initialIncomingCallProjection(),
      visible: true,
      callId: "call-in-1",
      uiState: "callerIdentityResolved",
      ringingIndicator: "ringing",
    });

    expect(snapshot.incomingWaitingCount).toBe(1);
    expect(snapshot.focusReason).toBe("incoming");
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
    expect(snapshot.focusSessionId).toBe("active-1");
    expect(snapshot.focusReason).toBe("primary");
  });

  it("binds focus to operator-selected held session", () => {
    const snapshot = buildHeadsetCallSnapshot(
      {
        ...initialMultiLineCallProjection(),
        lines: [
          {
            callId: "held-1",
            role: "primary",
            state: "Held",
            muted: true,
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
            muted: false,
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
      { selectedCallId: "held-1" },
    );

    expect(snapshot.focusSessionId).toBe("held-1");
    expect(snapshot.focusedIsMuted).toBe(true);
    expect(snapshot.focusedIsOnHold).toBe(true);
    expect(snapshot.focusReason).toBe("selected");
    expect(snapshot.operatorSelectedCallId).toBe("held-1");
    expect(snapshot.activeSessionId).toBe("active-1");
  });

  it("keeps operator selection under incoming focus priority", () => {
    const snapshot = buildHeadsetCallSnapshot(
      {
        ...initialMultiLineCallProjection(),
        lines: [
          {
            callId: "active-1",
            role: "primary",
            state: "Active",
            muted: false,
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
      {
        ...initialIncomingCallProjection(),
        visible: true,
        callId: "in-1",
        uiState: "incomingRinging",
        ringingIndicator: "ringing",
      },
      { selectedCallId: "active-1" },
    );

    expect(snapshot.focusReason).toBe("incoming");
    expect(snapshot.focusSessionId).toBe("in-1");
    expect(snapshot.operatorSelectedCallId).toBe("active-1");
  });

  it("outgoing dial captures focus over selected held", () => {
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
            activeSinceMs: 100,
            isRemoteHold: false,
            dtmfHistory: "",
            lastDtmfTone: null,
          },
          {
            callId: "out-1",
            role: "secondary",
            state: "Connecting",
            muted: false,
            displayLabel: null,
            remoteNumber: "100",
            activeSinceMs: null,
            isRemoteHold: false,
            dtmfHistory: "",
            lastDtmfTone: null,
          },
        ],
        primaryCallId: "held-1",
      },
      initialIncomingCallProjection(),
      { selectedCallId: "held-1" },
    );

    expect(snapshot.focusSessionId).toBe("out-1");
    expect(snapshot.focusReason).toBe("outgoing");
    expect(snapshot.operatorSelectedCallId).toBe("held-1");
  });
});
