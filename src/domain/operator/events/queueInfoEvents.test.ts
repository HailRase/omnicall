import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createCallId } from "../../telephony/CallId.js";
import { createMainAcallId } from "../ocp/MainAcallId.js";
import { createQueueInfoReceivedEvent } from "./queueInfoEvents.js";

describe("queueInfoEvents", () => {
  const correlationId = createCorrelationId();

  it("creates QueueInfoReceived with typed payload", () => {
    const event = createQueueInfoReceivedEvent(correlationId, {
      callId: createCallId("call-1"),
      mainAcallId: createMainAcallId("acall-100"),
      queueName: "Support",
    });

    expect(event.type).toBe("QueueInfoReceived");
    expect(event.correlationId).toBe(correlationId);
    expect(event.callId).toBe("call-1");
    expect(event.mainAcallId).toBe("acall-100");
    expect(event.queueName).toBe("Support");
    expect(event.occurredAt).toEqual(expect.any(String));
  });
});
