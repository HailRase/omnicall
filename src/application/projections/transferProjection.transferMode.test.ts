import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  deriveAttendedTransferDisabledReason,
  deriveBlindTransferDisabledReason,
  deriveStartConsultationDisabledReason,
  initialTransferProjection,
  reduceTransferProjection,
} from "./transferProjection.js";

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
});
