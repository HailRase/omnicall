import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { isTransferSuccessCelebrationEvent } from "./transferSuccessCelebration.js";

describe("transferSuccessCelebration", () => {
  it("recognizes blind and attended transfer success events", () => {
    const correlationId = createCorrelationId();

    expect(
      isTransferSuccessCelebrationEvent({
        type: "CallTransferred",
        correlationId,
        occurredAt: new Date().toISOString(),
        callId: "call-1",
        targetNumber: "+12025550100",
        transferType: "blind",
      }),
    ).toBe(true);

    expect(
      isTransferSuccessCelebrationEvent({
        type: "AttendedTransferCompleted",
        correlationId,
        occurredAt: new Date().toISOString(),
        sourceCallId: "src-1",
        consultationCallId: "consult-1",
      }),
    ).toBe(true);
  });

  it("ignores non-success transfer events", () => {
    expect(
      isTransferSuccessCelebrationEvent({
        type: "CallTransferFailed",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
        callId: "call-1",
        targetNumber: "+12025550100",
        transferType: "blind",
        reason: "busy",
      }),
    ).toBe(false);
  });
});
