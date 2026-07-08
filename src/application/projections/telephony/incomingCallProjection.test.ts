import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
} from "./incomingCallProjection.js";

describe("incomingCallProjection", () => {
  it("maps incoming call to ringing projection", () => {
    const correlationId = createCorrelationId();
    const received = reduceIncomingCallProjection(initialIncomingCallProjection(), {
      type: "IncomingCallReceived",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-1",
      phoneNumber: "+12025550100",
      direction: "incoming",
    });
    const ringing = reduceIncomingCallProjection(received, {
      type: "IncomingCallRingingStarted",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-1",
      autoAnswerTimeoutSec: 5,
      autoAnswerExpiresAt: new Date(Date.now() + 5000).toISOString(),
    });

    expect(ringing.visible).toBe(true);
    expect(ringing.uiState).toBe("autoAnswerCountdown");
    expect(ringing.autoAnswerTimeoutSec).toBe(5);
    expect(ringing.autoAnswerExpiresAt).not.toBeNull();
  });
});
