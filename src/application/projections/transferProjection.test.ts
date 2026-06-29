import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialTransferProjection,
  reduceTransferProjection,
} from "./transferProjection.js";

describe("transferProjection", () => {
  it("moves to transferring on CallTransferRequested", () => {
    const projection = reduceTransferProjection(initialTransferProjection(), {
      type: "CallTransferRequested",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-1",
      targetNumber: "+12025550400",
      transferType: "blind",
    });

    expect(projection.phase).toBe("transferring");
    expect(projection.transferModeActive).toBe(true);
    expect(projection.callId).toBe("call-1");
    expect(projection.targetNumber).toBe("+12025550400");
    expect(projection.transferType).toBe("blind");
  });

  it("moves to transferred on CallTransferred", () => {
    const projection = reduceTransferProjection(initialTransferProjection(), {
      type: "CallTransferred",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-2",
      targetNumber: "+12025550401",
      transferType: "blind",
    });

    expect(projection.phase).toBe("transferred");
  });

  it("records failure reason on CallTransferFailed", () => {
    const projection = reduceTransferProjection(initialTransferProjection(), {
      type: "CallTransferFailed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-3",
      targetNumber: "+12025550402",
      transferType: "blind",
      reason: "REFER rejected",
    });

    expect(projection.phase).toBe("transfer_failed");
    expect(projection.lastFailureReason).toBe("REFER rejected");
  });

  it("rolls back consultation dialing on consultation CallFailed", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let projection = reduceTransferProjection(initialTransferProjection(), {
      type: "TransferModeStarted",
      correlationId,
      occurredAt,
      callId: "src-consult-fail",
    });
    projection = reduceTransferProjection(projection, {
      type: "ConsultationCallRequested",
      correlationId,
      occurredAt,
      sourceCallId: "src-consult-fail",
      consultationCallId: "consult-fail-1",
      targetNumber: "+12025550411",
    });
    const failed = reduceTransferProjection(projection, {
      type: "CallFailed",
      correlationId,
      occurredAt,
      callId: "consult-fail-1",
      reason: "busy",
      details: "busy",
    });

    expect(failed.phase).toBe("idle");
    expect(failed.consultationCallId).toBeNull();
    expect(failed.sourceCallId).toBe("src-consult-fail");
    expect(failed.lastFailureReason).toBe("busy");
  });

  it("resets to idle when source call ends during attended transfer", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let projection = reduceTransferProjection(initialTransferProjection(), {
      type: "TransferModeStarted",
      correlationId,
      occurredAt,
      callId: "src-att-1",
    });
    projection = reduceTransferProjection(projection, {
      type: "ConsultationCallRequested",
      correlationId,
      occurredAt,
      sourceCallId: "src-att-1",
      consultationCallId: "consult-att-1",
      targetNumber: "+12025550410",
    });
    projection = reduceTransferProjection(projection, {
      type: "ConsultationCallStarted",
      correlationId,
      occurredAt,
      sourceCallId: "src-att-1",
      consultationCallId: "consult-att-1",
    });

    const reset = reduceTransferProjection(projection, {
      type: "CallEnded",
      correlationId,
      occurredAt,
      callId: "src-att-1",
    });

    expect(reset).toEqual(initialTransferProjection());
  });

  it("resets to idle after transferred call ends", () => {
    const transferred = reduceTransferProjection(initialTransferProjection(), {
      type: "CallTransferred",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-4",
      targetNumber: "+12025550403",
      transferType: "blind",
    });
    const reset = reduceTransferProjection(transferred, {
      type: "CallEnded",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-4",
    });

    expect(reset).toEqual(initialTransferProjection());
  });
});
