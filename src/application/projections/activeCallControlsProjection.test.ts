import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialActiveCallControlsProjection,
  reduceActiveCallControlsProjection,
} from "./activeCallControlsProjection.js";

describe("activeCallControlsProjection", () => {
  it("disables mute during outgoing connecting state", () => {
    const connecting = reduceActiveCallControlsProjection(
      initialActiveCallControlsProjection(),
      {
        type: "OutgoingCallRequested",
        callId: "call-out-1",
        phoneNumber: "+12025550100",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );

    expect(connecting.callState).toBe("Connecting");
    expect(connecting.muteDisabledReason).toBe("mute_requires_active_or_held");
    expect(connecting.hangupDisabledReason).toBeNull();
    expect(connecting.holdDisabledReason).toBe("hold_requires_active");
  });

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

  it("disables hold, resume, mute, and unmute during blind transfer", () => {
    const active = reduceActiveCallControlsProjection(
      initialActiveCallControlsProjection(),
      {
        type: "CallAnswered",
        callId: "call-xfer-1",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const transferring = reduceActiveCallControlsProjection(active, {
      type: "CallTransferRequested",
      callId: "call-xfer-1",
      targetNumber: "+12025550500",
      transferType: "blind",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(transferring.callState).toBe("Transferring");
    expect(transferring.holdDisabledReason).toBe("transfer_in_progress");
    expect(transferring.resumeDisabledReason).toBe("transfer_in_progress");
    expect(transferring.muteDisabledReason).toBe("transfer_in_progress");
    expect(transferring.unmuteDisabledReason).toBe("transfer_in_progress");
    expect(transferring.hangupDisabledReason).toBeNull();
  });

  it("restores active controls after transfer failure", () => {
    const transferring = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "CallAnswered",
        callId: "call-xfer-2",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "CallTransferRequested",
        callId: "call-xfer-2",
        targetNumber: "+12025550501",
        transferType: "blind",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const restored = reduceActiveCallControlsProjection(transferring, {
      type: "CallTransferFailed",
      callId: "call-xfer-2",
      targetNumber: "+12025550501",
      transferType: "blind",
      reason: "REFER rejected",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(restored.callState).toBe("Active");
    expect(restored.holdDisabledReason).toBeNull();
    expect(restored.muteDisabledReason).toBeNull();
    expect(restored.resumeDisabledReason).toBe("resume_requires_held");
  });

  it("disables hold, resume, mute, and unmute during attended transfer", () => {
    const held = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "CallAnswered",
        callId: "call-att-1",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "CallHeld",
        callId: "call-att-1",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const consultationActive = reduceActiveCallControlsProjection(held, {
      type: "ConsultationCallStarted",
      consultationCallId: "call-att-consult-1",
      sourceCallId: "call-att-1",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });
    const transferring = reduceActiveCallControlsProjection(consultationActive, {
      type: "AttendedTransferRequested",
      sourceCallId: "call-att-1",
      consultationCallId: "call-att-consult-1",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(transferring.callState).toBe("Transferring");
    expect(transferring.callId).toBe("call-att-1");
    expect(transferring.holdDisabledReason).toBe("transfer_in_progress");
    expect(transferring.muteDisabledReason).toBe("transfer_in_progress");
    expect(transferring.hangupDisabledReason).toBeNull();
  });

  it("restores source state from AttendedTransferFailed payload", () => {
    const transferring = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "ConsultationCallStarted",
        consultationCallId: "call-att-consult-2",
        sourceCallId: "call-att-2",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "AttendedTransferRequested",
        sourceCallId: "call-att-2",
        consultationCallId: "call-att-consult-2",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const restored = reduceActiveCallControlsProjection(transferring, {
      type: "AttendedTransferFailed",
      sourceCallId: "call-att-2",
      consultationCallId: "call-att-consult-2",
      reason: "REFER rejected",
      restoredSourceState: "Held",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(restored.callState).toBe("Held");
    expect(restored.callId).toBe("call-att-2");
    expect(restored.resumeDisabledReason).toBeNull();
    expect(restored.holdDisabledReason).toBe("hold_requires_active");
  });

  it("restores Active source state from ConsultationCallFailed payload", () => {
    const failed = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "CallAnswered",
        callId: "call-consult-fail-1",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "ConsultationCallFailed",
        sourceCallId: "call-consult-fail-1",
        consultationCallId: "call-consult-fail-consult",
        reason: "consultation_start_requires_dialing",
        restoredSourceState: "Active",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );

    expect(failed.callState).toBe("Active");
    expect(failed.holdDisabledReason).toBeNull();
    expect(failed.resumeDisabledReason).toBe("resume_requires_held");
  });

  it("clears controls after successful blind transfer", () => {
    const transferring = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "CallAnswered",
        callId: "call-xfer-3",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "CallTransferRequested",
        callId: "call-xfer-3",
        targetNumber: "+12025550502",
        transferType: "blind",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const transferred = reduceActiveCallControlsProjection(transferring, {
      type: "CallTransferred",
      callId: "call-xfer-3",
      targetNumber: "+12025550502",
      transferType: "blind",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(transferred.callState).toBe("Ended");
    expect(transferred.hangupDisabledReason).toBe("hangup_not_allowed");
  });

  it("restores source call on TransferModeCancelled after consultation cleanup", () => {
    const consultationActive = reduceActiveCallControlsProjection(
      reduceActiveCallControlsProjection(initialActiveCallControlsProjection(), {
        type: "CallAnswered",
        callId: "call-src-cancel",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      }),
      {
        type: "ConsultationCallStarted",
        sourceCallId: "call-src-cancel",
        consultationCallId: "call-consult-cancel",
        correlationId: createCorrelationId(),
        occurredAt: new Date().toISOString(),
      },
    );
    const restored = reduceActiveCallControlsProjection(consultationActive, {
      type: "TransferModeCancelled",
      callId: "call-src-cancel",
      consultationCallId: "call-consult-cancel",
      restoredSourceState: "Held",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(restored.callId).toBe("call-src-cancel");
    expect(restored.callState).toBe("Held");
  });
});
