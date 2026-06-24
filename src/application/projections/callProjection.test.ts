import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  deriveDialpadDisabledReason,
  initialCallProjection,
  reduceCallProjection,
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

  it("derives disabled reason for invalid number", () => {
    const reason = deriveDialpadDisabledReason({
      isRegistered: true,
      isOcpReserved: false,
      isSecondSessionDisabled: false,
      isHoldAllInProgress: false,
      isNumberValid: false,
      isConnecting: false,
    });
    expect(reason).toBe("invalidNumber");
  });
});

