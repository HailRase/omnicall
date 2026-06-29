import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "./multiLineCallProjection.js";

describe("multiLineCallProjection", () => {
  it("marks selected line as source on TransferModeStarted with two active lines", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let projection = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "OutgoingCallRequested",
      correlationId,
      occurredAt,
      callId: "call-a",
      phoneNumber: "+12025550101",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallAnswered",
      correlationId,
      occurredAt,
      callId: "call-a",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "OutgoingCallRequested",
      correlationId,
      occurredAt,
      callId: "call-b",
      phoneNumber: "+12025550102",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallAnswered",
      correlationId,
      occurredAt,
      callId: "call-b",
    });

    const transferMode = reduceMultiLineCallProjection(projection, {
      type: "TransferModeStarted",
      correlationId,
      occurredAt,
      callId: "call-b",
    });

    expect(transferMode.sourceCallId).toBe("call-b");
    const sourceLine = transferMode.lines.find((line) => line.callId === "call-b");
    const otherLine = transferMode.lines.find((line) => line.callId === "call-a");
    expect(sourceLine?.role).toBe("source");
    expect(otherLine?.role).toBe("primary");
  });

  it("clears source role on TransferModeCancelled without consultation", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let projection = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "OutgoingCallRequested",
      correlationId,
      occurredAt,
      callId: "call-a",
      phoneNumber: "+12025550101",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallAnswered",
      correlationId,
      occurredAt,
      callId: "call-a",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "TransferModeStarted",
      correlationId,
      occurredAt,
      callId: "call-a",
    });
    const cancelled = reduceMultiLineCallProjection(projection, {
      type: "TransferModeCancelled",
      correlationId,
      occurredAt,
      callId: "call-a",
    });

    expect(cancelled.sourceCallId).toBeNull();
    expect(cancelled.lines[0]?.role).toBe("primary");
  });

  it("clears blind transfer failure on CallTransferRequested retry", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let projection = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "OutgoingCallRequested",
      correlationId,
      occurredAt,
      callId: "call-retry",
      phoneNumber: "+12025550111",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallAnswered",
      correlationId,
      occurredAt,
      callId: "call-retry",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallTransferRequested",
      correlationId,
      occurredAt,
      callId: "call-retry",
      targetNumber: "401",
      transferType: "blind",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallTransferFailed",
      correlationId,
      occurredAt,
      callId: "call-retry",
      targetNumber: "401",
      transferType: "blind",
      reason: "Transfer target canceled or did not answer",
      restoredSourceState: "Active",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallTransferRequested",
      correlationId,
      occurredAt,
      callId: "call-retry",
      targetNumber: "402",
      transferType: "blind",
    });

    expect(projection.lastFailureReason).toBeNull();
  });

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

  it("accumulates dtmf history per call line", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let projection = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "OutgoingCallRequested",
      correlationId,
      occurredAt,
      callId: "call-dtmf",
      phoneNumber: "+12025550999",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallAnswered",
      correlationId,
      occurredAt,
      callId: "call-dtmf",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "DtmfSent",
      correlationId,
      occurredAt,
      callId: "call-dtmf",
      tone: "1",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "DtmfSent",
      correlationId,
      occurredAt,
      callId: "call-dtmf",
      tone: "2",
    });

    const line = projection.lines.find((entry) => entry.callId === "call-dtmf");
    expect(line?.dtmfHistory).toBe("12");
    expect(line?.lastDtmfTone).toBe("2");
  });

  it("restores source line state on CallTransferFailed", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let projection = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "OutgoingCallRequested",
      correlationId,
      occurredAt,
      callId: "call-7",
      phoneNumber: "+12025550804",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallAnswered",
      correlationId,
      occurredAt,
      callId: "call-7",
    });
    projection = reduceMultiLineCallProjection(projection, {
      type: "CallTransferRequested",
      correlationId,
      occurredAt,
      callId: "call-7",
      targetNumber: "+12025550805",
      transferType: "blind",
    });
    const failed = reduceMultiLineCallProjection(projection, {
      type: "CallTransferFailed",
      correlationId,
      occurredAt,
      callId: "call-7",
      targetNumber: "+12025550805",
      transferType: "blind",
      reason: "Transfer target canceled or did not answer",
      restoredSourceState: "Active",
    });

    const line = failed.lines.find((entry) => entry.callId === "call-7");
    expect(line?.state).toBe("Active");
    expect(failed.lastFailureReason).toBe("Transfer target canceled or did not answer");
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

  it("resets attended phase when consultation line is removed by CallFailed", () => {
    const dialing = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallRequested",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-7",
      consultationCallId: "consult-7",
      targetNumber: "+12025550804",
    });
    const failed = reduceMultiLineCallProjection(dialing, {
      type: "CallFailed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "consult-7",
      reason: "busy",
      details: "busy",
    });

    expect(failed.attendedPhase).toBe("idle");
    expect(failed.consultationCallId).toBeNull();
    expect(failed.sourceCallId).toBe("src-7");
    expect(failed.lines.some((line) => line.callId === "consult-7")).toBe(false);
  });
});
