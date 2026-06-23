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
    });

    expect(ringing.visible).toBe(true);
    expect(ringing.uiState).toBe("autoAnswerCountdown");
    expect(ringing.autoAnswerSecondsRemaining).toBe(5);
  });

  it("recovers safely when call ended before answer", () => {
    const correlationId = createCorrelationId();
    const projection = reduceIncomingCallProjection(
      {
        ...initialIncomingCallProjection(),
        visible: true,
        callId: "in-2",
      },
      {
        type: "IncomingCallEndedBeforeAnswer",
        correlationId,
        occurredAt: new Date().toISOString(),
        callId: "in-2",
      },
    );

    expect(projection.visible).toBe(false);
    expect(projection.uiState).toBe("incomingEndedBeforeAnswer");
  });
});
