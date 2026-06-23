import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "./multiLineCallProjection.js";

describe("multiLineCallProjection", () => {
  it("tracks source and consultation lines on ConsultationCallRequested", () => {
    const projection = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallRequested",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-1",
      consultationCallId: "consult-1",
      targetNumber: "+12025550800",
    });

    expect(projection.attendedPhase).toBe("consultation_dialing");
    expect(projection.sourceCallId).toBe("src-1");
    expect(projection.consultationCallId).toBe("consult-1");
    expect(projection.lines).toHaveLength(2);
  });

  it("marks consultation active on ConsultationCallStarted", () => {
    const dialing = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallRequested",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-2",
      consultationCallId: "consult-2",
      targetNumber: "+12025550801",
    });
    const active = reduceMultiLineCallProjection(dialing, {
      type: "ConsultationCallStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-2",
      consultationCallId: "consult-2",
    });

    expect(active.attendedPhase).toBe("consultation_active");
    expect(active.primaryCallId).toBe("consult-2");
    const consultationLine = active.lines.find((line) => line.callId === "consult-2");
    expect(consultationLine?.state).toBe("Active");
  });

  it("resets on AttendedTransferCompleted", () => {
    const active = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-3",
      consultationCallId: "consult-3",
    });
    const completed = reduceMultiLineCallProjection(active, {
      type: "AttendedTransferCompleted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-3",
      consultationCallId: "consult-3",
    });

    expect(completed).toEqual(initialMultiLineCallProjection());
  });

  it("records failure on AttendedTransferFailed", () => {
    const active = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-4",
      consultationCallId: "consult-4",
    });
    const failed = reduceMultiLineCallProjection(active, {
      type: "AttendedTransferFailed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-4",
      consultationCallId: "consult-4",
      reason: "REFER rejected",
      restoredSourceState: "Held",
    });

    expect(failed.attendedPhase).toBe("attended_transfer_failed");
    expect(failed.lastFailureReason).toBe("REFER rejected");
  });

  it("rolls back to source-only idle on ConsultationCallFailed", () => {
    const dialing = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallRequested",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-5",
      consultationCallId: "consult-5",
      targetNumber: "+12025550802",
    });
    const failed = reduceMultiLineCallProjection(dialing, {
      type: "ConsultationCallFailed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-5",
      consultationCallId: "consult-5",
      reason: "busy",
      restoredSourceState: "Held",
    });

    expect(failed.attendedPhase).toBe("idle");
    expect(failed.consultationCallId).toBeNull();
    expect(failed.sourceCallId).toBe("src-5");
    expect(failed.primaryCallId).toBe("src-5");
    expect(failed.lines).toHaveLength(1);
    expect(failed.lines[0]?.callId).toBe("src-5");
    expect(failed.lines[0]?.role).toBe("primary");
    expect(failed.lines[0]?.state).toBe("Held");
    expect(failed.lastFailureReason).toBe("busy");
  });

  it("clears consultation state on TransferModeCancelled without failure", () => {
    const dialing = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallRequested",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-6",
      consultationCallId: "consult-6",
      targetNumber: "+12025550803",
    });
    const active = reduceMultiLineCallProjection(dialing, {
      type: "ConsultationCallStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-6",
      consultationCallId: "consult-6",
    });
    const cancelled = reduceMultiLineCallProjection(active, {
      type: "TransferModeCancelled",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "src-6",
      consultationCallId: "consult-6",
      restoredSourceState: "Held",
    });

    expect(cancelled.attendedPhase).toBe("idle");
    expect(cancelled.consultationCallId).toBeNull();
    expect(cancelled.lastFailureReason).toBeNull();
    expect(cancelled.lines).toHaveLength(1);
    expect(cancelled.lines[0]?.role).toBe("primary");
  });
});
