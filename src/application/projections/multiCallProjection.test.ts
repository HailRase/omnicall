import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  deriveIncomingAnswerDisabledReason,
  initialMultiCallProjection,
  reduceMultiCallProjection,
  setMultiCallSettings,
} from "./multiCallProjection.js";

describe("multiCallProjection", () => {
  it("tracks hold-all in progress and completion", () => {
    const correlationId = createCorrelationId();
    const inProgress = reduceMultiCallProjection(initialMultiCallProjection(), {
      type: "AllOtherCallsHeld",
      correlationId,
      occurredAt: new Date().toISOString(),
      heldCallIds: ["call-a"],
      trigger: "before_outgoing",
      phase: "in_progress",
    });
    expect(inProgress.holdAllInProgress).toBe(true);
    expect(inProgress.isSecondSessionDisabled).toBe(true);
    expect(inProgress.secondSessionDisabledReason).toBe("hold_all_in_progress");

    const completed = reduceMultiCallProjection(inProgress, {
      type: "AllOtherCallsHeld",
      correlationId,
      occurredAt: new Date().toISOString(),
      heldCallIds: ["call-a"],
      trigger: "before_outgoing",
      phase: "completed",
    });
    expect(completed.holdAllInProgress).toBe(false);
  });

  it("clears hold-all in progress on failed rollback phase", () => {
    const correlationId = createCorrelationId();
    const inProgress = reduceMultiCallProjection(initialMultiCallProjection(), {
      type: "AllOtherCallsHeld",
      correlationId,
      occurredAt: new Date().toISOString(),
      heldCallIds: ["call-a"],
      trigger: "before_outgoing",
      phase: "in_progress",
    });

    const failed = reduceMultiCallProjection(inProgress, {
      type: "AllOtherCallsHeld",
      correlationId,
      occurredAt: new Date().toISOString(),
      heldCallIds: [],
      trigger: "before_outgoing",
      phase: "failed",
    });

    expect(failed.holdAllInProgress).toBe(false);
    expect(failed.isSecondSessionDisabled).toBe(false);
    expect(failed.secondSessionDisabledReason).toBeNull();
  });

  it("maps second session blocked for dialpad and incoming answer", () => {
    const blocked = reduceMultiCallProjection(
      setMultiCallSettings(initialMultiCallProjection(), {
        multiSessionsEnabled: false,
      }),
      {
        type: "SecondSessionBlocked",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
        direction: "incoming_answer",
        reason: "multi_sessions_disabled",
        blockingCallIds: ["call-a"],
      },
    );
    expect(blocked.isSecondSessionDisabled).toBe(true);
    expect(blocked.lastBlockedDirection).toBe("incoming_answer");
    expect(deriveIncomingAnswerDisabledReason(blocked)).toBe("Second session disabled");
  });

  it("derives incoming answer disabled from established call and settings", () => {
    const projection = reduceMultiCallProjection(
      setMultiCallSettings(initialMultiCallProjection(), {
        multiSessionsEnabled: false,
      }),
      {
        type: "CallAnswered",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
        callId: "call-a",
      },
    );
    expect(deriveIncomingAnswerDisabledReason(projection)).toBe("Second session disabled");
  });

  it("stores autoUnholdOnTransferFailure from settings", () => {
    const projection = setMultiCallSettings(initialMultiCallProjection(), {
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: false,
    });

    expect(projection.autoUnholdOnTransferFailure).toBe(false);
  });
});
