import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  deriveDialpadDisabledReason,
  initialCallProjection,
  reduceCallProjection,
  setDialpadMode,
} from "./callProjection.js";

describe("callProjection", () => {
  it("maps failed busy state", () => {
    const projection = reduceCallProjection(initialCallProjection(), {
      type: "CallFailed",
      callId: "call-1",
      reason: "busy",
      details: "busy",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(projection.uiState).toBe("failedBusy");
  });

  it("clears tone indicator when tone stops", () => {
    const correlationId = createCorrelationId();
    const withFailedTone = reduceCallProjection(initialCallProjection(), {
      type: "FailedToneStarted",
      callId: "call-1",
      correlationId,
      occurredAt: new Date().toISOString(),
    });

    const stopped = reduceCallProjection(withFailedTone, {
      type: "ToneStopped",
      callId: "call-1",
      correlationId,
      occurredAt: new Date().toISOString(),
    });

    expect(stopped.toneIndicator).toBe("none");
  });

  it("keeps number mode after call is answered", () => {
    const connecting = reduceCallProjection(initialCallProjection(), {
      type: "OutgoingCallRequested",
      callId: "call-1",
      phoneNumber: "+12025550100",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });
    const answered = reduceCallProjection(connecting, {
      type: "CallAnswered",
      callId: "call-1",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(answered.mode).toBe("number");
    expect(answered.uiState).toBe("idle");
    expect(answered.dtmfPanelCallId).toBeNull();
  });

  it("stores dtmf failure separately from call failure", () => {
    const active = reduceCallProjection(initialCallProjection(), {
      type: "CallAnswered",
      callId: "call-1",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });
    const failedDtmf = reduceCallProjection(active, {
      type: "DtmfFailed",
      callId: "call-1",
      tone: "5",
      reason: "DTMF send failed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });

    expect(failedDtmf.lastDtmfError).toBe("DTMF send failed");
    expect(failedDtmf.lastError).toBeNull();
    expect(failedDtmf.state).toBe("Active");
  });

  it("binds dtmf panel to a specific call", () => {
    const active = reduceCallProjection(initialCallProjection(), {
      type: "CallAnswered",
      callId: "call-2",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
    });
    const dtmf = setDialpadMode(active, "dtmf", "call-2");

    expect(dtmf.mode).toBe("dtmf");
    expect(dtmf.dtmfPanelCallId).toBe("call-2");
    expect(dtmf.uiState).toBe("activeCallDtmfMode");
  });

  it("derives disabled reason for invalid number", () => {
    const reason = deriveDialpadDisabledReason({
      isRegistered: true,
      isOcpReserved: false,
      isSecondSessionDisabled: false,
      secondSessionDisabledReason: null,
      isHoldAllInProgress: false,
      isNumberValid: false,
      isConnecting: false,
    });
    expect(reason).toBe("invalidNumber");
  });
});

