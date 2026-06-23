import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createCallId, createMainAcallId } from "@domain/index.js";
import { createOcpCallCorrelationRegisteredEvent } from "./ocpCallCorrelationEvents.js";

describe("ocpCallCorrelationEvents", () => {
  const correlationId = createCorrelationId();

  it("creates OcpCallCorrelationRegistered with typed payload", () => {
    const event = createOcpCallCorrelationRegisteredEvent(correlationId, {
      callId: createCallId("call-1"),
      mainAcallId: createMainAcallId("acall-1"),
    });

    expect(event.type).toBe("OcpCallCorrelationRegistered");
    expect(event.callId).toBe("call-1");
    expect(event.mainAcallId).toBe("acall-1");
  });
});
