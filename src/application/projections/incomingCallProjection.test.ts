import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createQueueInfoReceivedEvent } from "@domain/operator/events/queueInfoEvents.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
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

  it("sets queueInfo on QueueInfoReceived for matching call", () => {
    const correlationId = createCorrelationId();
    let projection = reduceIncomingCallProjection(initialIncomingCallProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "s-1",
      agentId: "a-1",
    });
    projection = reduceIncomingCallProjection(projection, {
      type: "IncomingCallReceived",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-queue",
      phoneNumber: "+12025550100",
      direction: "incoming",
    });
    projection = reduceIncomingCallProjection(projection, {
      type: "IncomingCallDisplayNameResolved",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId: "in-queue",
      displayName: "Caller",
    });
    expect(projection.uiState).toBe("queueInfoPending");

    projection = reduceIncomingCallProjection(
      projection,
      createQueueInfoReceivedEvent(correlationId, {
        callId: createCallId("in-queue"),
        mainAcallId: createMainAcallId("acall-1"),
        queueName: "Support Queue",
      }),
    );

    expect(projection.queueInfo).toBe("Support Queue");
    expect(projection.uiState).toBe("callerIdentityResolved");
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
