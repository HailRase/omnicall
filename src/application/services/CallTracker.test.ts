import { describe, expect, it } from "vitest";
import { createCallId, createOutgoingCall, createPhoneNumber, createTransferSession } from "@domain/index.js";
import { CallTracker } from "./CallTracker.js";
import { reconcileCallTracker } from "./callTrackerReconciliation.js";

describe("CallTracker", () => {
  it("untracks terminal calls on trackCall", () => {
    const tracker = new CallTracker();
    const callId = createCallId("ended-1");
    const active = createOutgoingCall(callId, createPhoneNumber("+12025550100"));
    tracker.trackCall({ ...active, state: "Active" });
    expect(tracker.getAllTrackedCalls()).toHaveLength(1);

    tracker.trackCall({ ...active, state: "Ended" });
    expect(tracker.getAllTrackedCalls()).toHaveLength(0);
  });

  it("clears transfer session when consultation leg is untracked", () => {
    const tracker = new CallTracker();
    const sourceCallId = createCallId("src-1");
    const consultationCallId = createCallId("consult-1");
    const source = createOutgoingCall(sourceCallId, createPhoneNumber("+12025550101"));
    const consultation = createOutgoingCall(
      consultationCallId,
      createPhoneNumber("+12025550102"),
    );
    tracker.trackCall({ ...source, state: "Held" });
    tracker.trackCall({ ...consultation, state: "Active" });
    tracker.setTransferSession(
      createTransferSession(sourceCallId, createPhoneNumber("+12025550102"), consultationCallId),
    );

    tracker.untrackCall(consultationCallId);

    expect(tracker.getTransferSession()).toBeNull();
    expect(tracker.getAllTrackedCalls()).toHaveLength(1);
  });
});

describe("reconcileCallTracker", () => {
  it("removes orphaned transfer mode source and stale transfer session", () => {
    const tracker = new CallTracker();
    const sourceCallId = createCallId("src-orphan");
    tracker.setTransferModeSourceCallId(sourceCallId);
    tracker.setTransferSession(
      createTransferSession(
        sourceCallId,
        createPhoneNumber("+12025550103"),
        createCallId("consult-orphan"),
      ),
    );

    reconcileCallTracker(tracker);

    expect(tracker.getTransferModeSourceCallId()).toBeNull();
    expect(tracker.getTransferSession()).toBeNull();
  });

  it("keeps consultation_dialing session before consultation leg is tracked", () => {
    const tracker = new CallTracker();
    const sourceCallId = createCallId("src-dialing");
    const consultationCallId = createCallId("consult-dialing");
    const source = createOutgoingCall(sourceCallId, createPhoneNumber("+12025550104"));
    tracker.trackCall({ ...source, state: "Held" });
    tracker.setTransferSession(
      createTransferSession(
        sourceCallId,
        createPhoneNumber("+12025550105"),
        consultationCallId,
      ),
    );

    reconcileCallTracker(tracker);

    expect(tracker.getTransferSession()?.consultationCallId).toBe(consultationCallId);
  });
});
