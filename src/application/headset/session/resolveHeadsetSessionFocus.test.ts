import { describe, expect, it } from "vitest";
import { resolveHeadsetSessionFocus } from "./resolveHeadsetSessionFocus.js";

describe("resolveHeadsetSessionFocus", () => {
  it("prefers incoming waiting over operator selection", () => {
    const focus = resolveHeadsetSessionFocus({
      selectedCallId: "active-1",
      primarySessionId: "active-1",
      activeSessionId: "active-1",
      heldSessionIds: [],
      outgoingInProgressIds: [],
      establishedSessionIds: ["active-1"],
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      sessionById: {
        "active-1": { muted: true, isOnHold: false },
      },
    });

    expect(focus).toEqual({
      focusSessionId: "in-1",
      focusedIsMuted: false,
      focusedIsOnHold: false,
      focusReason: "incoming",
    });
  });

  it("uses operator selected held session while another is active", () => {
    const focus = resolveHeadsetSessionFocus({
      selectedCallId: "held-1",
      primarySessionId: "active-1",
      activeSessionId: "active-1",
      heldSessionIds: ["held-1"],
      outgoingInProgressIds: [],
      establishedSessionIds: ["held-1", "active-1"],
      incomingWaitingCount: 0,
      firstIncomingCallId: undefined,
      sessionById: {
        "held-1": { muted: true, isOnHold: true },
        "active-1": { muted: false, isOnHold: false },
      },
    });

    expect(focus).toEqual({
      focusSessionId: "held-1",
      focusedIsMuted: true,
      focusedIsOnHold: true,
      focusReason: "selected",
    });
  });

  it("falls back to primary when selection is stale", () => {
    const focus = resolveHeadsetSessionFocus({
      selectedCallId: "gone",
      primarySessionId: "consult-1",
      activeSessionId: "active-1",
      heldSessionIds: [],
      outgoingInProgressIds: [],
      establishedSessionIds: ["consult-1", "active-1"],
      incomingWaitingCount: 0,
      firstIncomingCallId: undefined,
      sessionById: {
        "consult-1": { muted: false, isOnHold: false },
        "active-1": { muted: true, isOnHold: false },
      },
    });

    expect(focus.focusSessionId).toBe("consult-1");
    expect(focus.focusReason).toBe("primary");
  });

  it("falls back to active then outgoing then held", () => {
    expect(
      resolveHeadsetSessionFocus({
        selectedCallId: undefined,
        primarySessionId: undefined,
        activeSessionId: "active-1",
        heldSessionIds: ["held-1"],
        outgoingInProgressIds: [],
        establishedSessionIds: ["active-1", "held-1"],
        incomingWaitingCount: 0,
        firstIncomingCallId: undefined,
        sessionById: {
          "active-1": { muted: false, isOnHold: false },
          "held-1": { muted: false, isOnHold: true },
        },
      }).focusReason,
    ).toBe("active");

    expect(
      resolveHeadsetSessionFocus({
        selectedCallId: undefined,
        primarySessionId: undefined,
        activeSessionId: undefined,
        heldSessionIds: ["held-1"],
        outgoingInProgressIds: ["out-1"],
        establishedSessionIds: ["held-1"],
        incomingWaitingCount: 0,
        firstIncomingCallId: undefined,
        sessionById: {
          "out-1": { muted: false, isOnHold: false },
          "held-1": { muted: false, isOnHold: true },
        },
      }).focusReason,
    ).toBe("outgoing");

    expect(
      resolveHeadsetSessionFocus({
        selectedCallId: undefined,
        primarySessionId: undefined,
        activeSessionId: undefined,
        heldSessionIds: ["held-1"],
        outgoingInProgressIds: [],
        establishedSessionIds: ["held-1"],
        incomingWaitingCount: 0,
        firstIncomingCallId: undefined,
        sessionById: {
          "held-1": { muted: false, isOnHold: true },
        },
      }).focusReason,
    ).toBe("held");
  });

  it("outgoing dial captures focus over operator selected held", () => {
    const focus = resolveHeadsetSessionFocus({
      selectedCallId: "held-1",
      primarySessionId: undefined,
      activeSessionId: undefined,
      heldSessionIds: ["held-1"],
      outgoingInProgressIds: ["out-1"],
      establishedSessionIds: ["held-1"],
      incomingWaitingCount: 0,
      firstIncomingCallId: undefined,
      sessionById: {
        "held-1": { muted: false, isOnHold: true },
        "out-1": { muted: false, isOnHold: false },
      },
    });

    expect(focus.focusSessionId).toBe("out-1");
    expect(focus.focusedIsOnHold).toBe(false);
    expect(focus.focusReason).toBe("outgoing");
  });

  it("incoming still wins over outgoing dial", () => {
    const focus = resolveHeadsetSessionFocus({
      selectedCallId: "held-1",
      primarySessionId: undefined,
      activeSessionId: undefined,
      heldSessionIds: ["held-1"],
      outgoingInProgressIds: ["out-1"],
      establishedSessionIds: ["held-1"],
      incomingWaitingCount: 1,
      firstIncomingCallId: "in-1",
      sessionById: {
        "held-1": { muted: false, isOnHold: true },
        "out-1": { muted: false, isOnHold: false },
      },
    });

    expect(focus.focusSessionId).toBe("in-1");
    expect(focus.focusReason).toBe("incoming");
  });

  it("returns idle when no sessions exist", () => {
    expect(
      resolveHeadsetSessionFocus({
        selectedCallId: undefined,
        primarySessionId: undefined,
        activeSessionId: undefined,
        heldSessionIds: [],
        outgoingInProgressIds: [],
        establishedSessionIds: [],
        incomingWaitingCount: 0,
        firstIncomingCallId: undefined,
        sessionById: {},
      }),
    ).toEqual({
      focusSessionId: undefined,
      focusedIsMuted: false,
      focusedIsOnHold: false,
      focusReason: "idle",
    });
  });
});
