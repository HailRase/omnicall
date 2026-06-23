import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createOcpDisconnectedEvent,
  createOcpReconnectFailedEvent,
  createOcpReconnectScheduledEvent,
  createOcpReconnectSucceededEvent,
} from "./ocpRecoveryEvents.js";

describe("ocpRecoveryEvents", () => {
  const correlationId = createCorrelationId();

  it("creates OcpDisconnected with reason", () => {
    const event = createOcpDisconnectedEvent(correlationId, {
      reason: "transport_closed",
      message: "ws closed",
    });

    expect(event.type).toBe("OcpDisconnected");
    expect(event.correlationId).toBe(correlationId);
    expect(event.reason).toBe("transport_closed");
    expect(event.message).toBe("ws closed");
  });

  it("creates OcpReconnectScheduled with attempt and delay", () => {
    const event = createOcpReconnectScheduledEvent(correlationId, {
      attemptNumber: 2,
      delayMs: 5000,
    });

    expect(event.type).toBe("OcpReconnectScheduled");
    expect(event.attemptNumber).toBe(2);
    expect(event.delayMs).toBe(5000);
  });

  it("creates OcpReconnectSucceeded", () => {
    const event = createOcpReconnectSucceededEvent(correlationId, {
      attemptNumber: 3,
    });

    expect(event.type).toBe("OcpReconnectSucceeded");
    expect(event.attemptNumber).toBe(3);
  });

  it("creates OcpReconnectFailed with terminal flag", () => {
    const event = createOcpReconnectFailedEvent(correlationId, {
      attemptNumber: 6,
      reason: "max_attempts",
      isTerminal: true,
    });

    expect(event.type).toBe("OcpReconnectFailed");
    expect(event.isTerminal).toBe(true);
    expect(event.reason).toBe("max_attempts");
  });
});
