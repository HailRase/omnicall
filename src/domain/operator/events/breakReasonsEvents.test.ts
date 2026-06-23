import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createBreakReason } from "../BreakReason.js";
import { createBreakReasonsReceivedEvent } from "./breakReasonsEvents.js";

describe("breakReasonsEvents", () => {
  it("creates BreakReasonsReceived with typed payload", () => {
    const correlationId = createCorrelationId();
    const event = createBreakReasonsReceivedEvent(correlationId, {
      reasons: [createBreakReason("meeting"), createBreakReason("break")],
    });

    expect(event.type).toBe("BreakReasonsReceived");
    expect(event.reasons).toHaveLength(2);
    expect(event.reasons[0]).toBe("meeting");
  });
});
