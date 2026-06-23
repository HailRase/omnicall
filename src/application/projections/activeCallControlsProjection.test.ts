import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialActiveCallControlsProjection,
  reduceActiveCallControlsProjection,
} from "./activeCallControlsProjection.js";

describe("activeCallControlsProjection", () => {
  it("enables hold and mute on active call", () => {
    const base = reduceActiveCallControlsProjection(
      initialActiveCallControlsProjection(),
      {
        type: "CallAnswered",
        callId: "call-1",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );

    expect(base.holdDisabledReason).toBeNull();
    expect(base.muteDisabledReason).toBeNull();
    expect(base.resumeDisabledReason).toBe("resume_requires_held");
  });

  it("switches disabled reasons when call is held and muted", () => {
    const held = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "CallAnswered",
        callId: "call-2",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "CallHeld",
        callId: "call-2",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const muted = reduceActiveCallControlsProjection(held, {
      type: "CallMuted",
      callId: "call-2",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(muted.resumeDisabledReason).toBeNull();
    expect(muted.holdDisabledReason).toBe("hold_requires_active");
    expect(muted.unmuteDisabledReason).toBeNull();
    expect(muted.muteDisabledReason).toBe("already_muted");
  });

  it("stores last operation error from ActiveCallControlFailed", () => {
    const active = reduceActiveCallControlsProjection(
      initialActiveCallControlsProjection(),
      {
        type: "CallAnswered",
        callId: "call-3",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const failed = reduceActiveCallControlsProjection(active, {
      type: "ActiveCallControlFailed",
      callId: "call-3",
      operation: "hold",
      reason: "Hold failed for call-3",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(failed.lastOperationError).toEqual({
      operation: "hold",
      message: "Hold failed for call-3",
    });
    expect(failed.callState).toBe("Active");
    expect(failed.holdDisabledReason).toBeNull();
  });

  it("clears last operation error after successful hold", () => {
    const failed = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "CallAnswered",
        callId: "call-4",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "ActiveCallControlFailed",
        callId: "call-4",
        operation: "resume",
        reason: "Resume failed",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const held = reduceActiveCallControlsProjection(failed, {
      type: "CallHeld",
      callId: "call-4",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(held.lastOperationError).toBeNull();
    expect(held.callState).toBe("Held");
  });

  it("ignores ActiveCallControlFailed with invalid operation payload", () => {
    const active = reduceActiveCallControlsProjection(
      initialActiveCallControlsProjection(),
      {
        type: "CallAnswered",
        callId: "call-5",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const failed = reduceActiveCallControlsProjection(active, {
      type: "ActiveCallControlFailed",
      callId: "call-5",
      operation: "invalid-operation",
      reason: "Should not map to hold",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(failed.lastOperationError).toBeNull();
    expect(failed.callState).toBe("Active");
  });
});
