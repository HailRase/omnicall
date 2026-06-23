import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createServerTerminateReceivedEvent } from "./serverTerminateEvents.js";

describe("serverTerminateEvents", () => {
  it("creates ServerTerminateReceived with typed payload", () => {
    const correlationId = createCorrelationId();
    const event = createServerTerminateReceivedEvent(correlationId, {
      entityId: "agent-42",
      reason: "admin_terminate",
    });

    expect(event.type).toBe("ServerTerminateReceived");
    expect(event.entityId).toBe("agent-42");
    expect(event.reason).toBe("admin_terminate");
    expect(event.correlationId).toBe(correlationId);
  });
});
