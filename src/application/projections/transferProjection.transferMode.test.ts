import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  deriveAttendedTransferDisabledReason,
  deriveBlindTransferDisabledReason,
  deriveStartConsultationDisabledReason,
  initialTransferProjection,
  reduceTransferProjection,
} from "./transferProjection.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "./multiLineCallProjection.js";

describe("transferProjection transfer mode", () => {
  it("activates transfer mode on TransferModeStarted", () => {
    const projection = reduceTransferProjection(initialTransferProjection(), {
      type: "TransferModeStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-1",
    });

    expect(projection.transferModeActive).toBe(true);
    expect(projection.sourceCallId).toBe("call-1");
  });

  it("deactivates transfer mode on TransferModeCancelled", () => {
    const active = reduceTransferProjection(initialTransferProjection(), {
      type: "TransferModeStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-2",
    });
    const cancelled = reduceTransferProjection(active, {
      type: "TransferModeCancelled",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "call-2",
    });

    expect(cancelled.transferModeActive).toBe(false);
  });
});

describe("transferProjection disabled reasons", () => {
  it("blocks blind transfer for invalid target", () => {
    const reason = deriveBlindTransferDisabledReason({
      callId: "call-1",
      callState: "Active",
      targetNumber: "",
      transferInProgress: false,
    });

    expect(reason).toBe("invalid_target");
  });

  it("blocks consultation when second session disabled", () => {
    const reason = deriveStartConsultationDisabledReason({
      sourceCallId: "call-1",
      sourceCallState: "Active",
      consultationCallId: null,
      targetNumber: "+12025550100",
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
      attendedPhase: "idle",
      transferInProgress: false,
    });

    expect(reason).toBe("second_session_disabled");
  });

  it("blocks attended transfer before consultation is active", () => {
    const reason = deriveAttendedTransferDisabledReason({
      sourceCallId: "call-1",
      consultationCallId: "call-2",
      sourceCallState: "Held",
      consultationCallState: "Connecting",
      attendedPhase: "consultation_dialing",
      transferInProgress: false,
    });

    expect(reason).toBe("consultation_not_active");
  });

  it("allows blind transfer retry after CallTransferFailed restores line state", () => {
    const correlationId = createCorrelationId();
    const occurredAt = new Date().toISOString();
    let multiLine = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "OutgoingCallRequested",
      correlationId,
      occurredAt,
      callId: "call-retry",
      phoneNumber: "+12025550111",
    });
    multiLine = reduceMultiLineCallProjection(multiLine, {
      type: "CallAnswered",
      correlationId,
      occurredAt,
      callId: "call-retry",
    });
    multiLine = reduceMultiLineCallProjection(multiLine, {
      type: "CallTransferRequested",
      correlationId,
      occurredAt,
      callId: "call-retry",
      targetNumber: "+12025550222",
      transferType: "blind",
    });
    multiLine = reduceMultiLineCallProjection(multiLine, {
      type: "CallTransferFailed",
      correlationId,
      occurredAt,
      callId: "call-retry",
      targetNumber: "+12025550222",
      transferType: "blind",
      reason: "Transfer target canceled or did not answer",
      restoredSourceState: "Active",
    });

    const reason = deriveBlindTransferDisabledReason({
      callId: "call-retry",
      callState: multiLine.lines.find((line) => line.callId === "call-retry")?.state ?? "Idle",
      targetNumber: "+12025550222",
      transferInProgress: false,
    });

    expect(reason).toBeNull();
  });
});
