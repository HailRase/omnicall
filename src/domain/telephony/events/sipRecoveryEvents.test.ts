import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createSipReconnectAttemptStartedEvent,
  createSipReconnectFailedEvent,
  createSipReconnectScheduledEvent,
  createSipReconnectSucceededEvent,
} from "./sipRecoveryEvents.js";

describe("sipRecoveryEvents", () => {
  const correlationId = createCorrelationId();

  it("creates SipReconnectScheduled with attempt and delay", () => {
    const event = createSipReconnectScheduledEvent(correlationId, {
      attemptNumber: 1,
      delayMs: 2000,
    });

    expect(event.type).toBe("SipReconnectScheduled");
    expect(event.attemptNumber).toBe(1);
    expect(event.delayMs).toBe(2000);
  });

  it("creates SipReconnectAttemptStarted", () => {
    const event = createSipReconnectAttemptStartedEvent(correlationId, {
      attemptNumber: 3,
    });

    expect(event.type).toBe("SipReconnectAttemptStarted");
    expect(event.attemptNumber).toBe(3);
  });

  it("creates SipReconnectSucceeded", () => {
    const event = createSipReconnectSucceededEvent(correlationId, {
      attemptNumber: 2,
    });

    expect(event.type).toBe("SipReconnectSucceeded");
    expect(event.attemptNumber).toBe(2);
  });

  it("creates SipReconnectFailed with terminal flag", () => {
    const event = createSipReconnectFailedEvent(correlationId, {
      attemptNumber: 10,
      reason: "registration_timeout",
      isTerminal: true,
    });

    expect(event.type).toBe("SipReconnectFailed");
    expect(event.isTerminal).toBe(true);
  });
});
