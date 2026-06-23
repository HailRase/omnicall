import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createStatusReason } from "../StatusReason.js";
import { createAgentLogoutRequestedEvent } from "./logoutEvents.js";

describe("logoutEvents", () => {
  it("creates AgentLogoutRequested with typed payload", () => {
    const correlationId = createCorrelationId();
    const event = createAgentLogoutRequestedEvent(correlationId, {
      reason: createStatusReason("end_of_shift"),
    });

    expect(event.type).toBe("AgentLogoutRequested");
    expect(event.correlationId).toBe(correlationId);
    expect(event.reason).toBe("end_of_shift");
    expect(event.occurredAt).toEqual(expect.any(String));
  });

  it("creates AgentLogoutRequested with null reason", () => {
    const event = createAgentLogoutRequestedEvent(createCorrelationId(), {
      reason: null,
    });

    expect(event.reason).toBeNull();
  });
});
