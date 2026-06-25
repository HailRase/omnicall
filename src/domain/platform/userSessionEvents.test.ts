import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createUserSessionEndedEvent } from "./userSessionEvents.js";

describe("userSessionEvents", () => {
  it("creates UserSessionEnded with correlation id", () => {
    const correlationId = createCorrelationId();
    const event = createUserSessionEndedEvent(correlationId);

    expect(event.type).toBe("UserSessionEnded");
    expect(event.correlationId).toBe(correlationId);
    expect(event.occurredAt).toBeTruthy();
  });
});
