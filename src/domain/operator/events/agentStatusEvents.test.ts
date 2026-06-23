import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createAgentStatusChangeRejectedEvent,
  createAgentStatusChangeRequestedEvent,
  createAgentStatusChangedEvent,
} from "./agentStatusEvents.js";
import { createStatusReason } from "../StatusReason.js";

describe("agentStatusEvents", () => {
  const correlationId = createCorrelationId();

  it("creates AgentStatusChangeRequested with typed payload", () => {
    const event = createAgentStatusChangeRequestedEvent(correlationId, {
      previousStatus: "ready",
      targetStatus: "break",
      reason: createStatusReason("meeting"),
    });

    expect(event.type).toBe("AgentStatusChangeRequested");
    expect(event.correlationId).toBe(correlationId);
    expect(event.previousStatus).toBe("ready");
    expect(event.targetStatus).toBe("break");
    expect(event.reason).toBe("meeting");
    expect(event.occurredAt).toEqual(expect.any(String));
  });

  it("creates AgentStatusChanged with typed payload", () => {
    const changedAt = new Date().toISOString();
    const event = createAgentStatusChangedEvent(correlationId, {
      previousStatus: "break",
      currentStatus: "ready",
      reason: null,
      changedAt,
    });

    expect(event.type).toBe("AgentStatusChanged");
    expect(event.currentStatus).toBe("ready");
    expect(event.changedAt).toBe(changedAt);
  });

  it("creates AgentStatusChangeRejected with typed payload", () => {
    const event = createAgentStatusChangeRejectedEvent(correlationId, {
      previousStatus: "break",
      targetStatus: "ready",
      reason: "dnd_blocks_ready",
    });

    expect(event.type).toBe("AgentStatusChangeRejected");
    expect(event.reason).toBe("dnd_blocks_ready");
  });
});
