import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockOperatorPlatformGateway, MockTelephonyGateway } from "@adapters/index.js";
import type { DomainEvent } from "@domain/index.js";
import { SIP_RECONNECT_POLICY_CONFIG } from "@domain/shared/recovery/ReconnectPolicy.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { ReconnectScheduler } from "../infrastructure/ReconnectScheduler.js";
import { ConnectionRecoveryOrchestrationService } from "./ConnectionRecoveryOrchestrationService.js";

describe("ConnectionRecoveryOrchestrationService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ignores duplicate SIP disconnect while recovery is in flight", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const published: DomainEvent[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event);
    });

    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "failure",
    });

    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway,
      operatorGateway: new MockOperatorPlatformGateway(),
      eventPublisher,
      logger: createTestLogger(),
      scheduler: new ReconnectScheduler(),
      random: () => 0.5,
    });
    orchestration.bindTransportHandlers();

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    const scheduledAfterFirst = published.filter(
      (event) => event.type === "SipReconnectScheduled",
    );
    expect(scheduledAfterFirst).toHaveLength(1);
    expect(scheduledAfterFirst[0]?.["attemptNumber"]).toBe(1);

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    expect(
      published.filter((event) => event.type === "SipReconnectScheduled"),
    ).toHaveLength(1);
  });

  it("keeps attempt counter monotonic across retries within single outage", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const published: DomainEvent[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event);
    });

    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "failure",
    });

    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway,
      operatorGateway: new MockOperatorPlatformGateway(),
      eventPublisher,
      logger: createTestLogger(),
      scheduler: new ReconnectScheduler(),
      random: () => 0.5,
      sipPolicy: {
        ...SIP_RECONNECT_POLICY_CONFIG,
        maxAttempts: 3,
        baseDelayMs: 1000,
        backoffMultiplier: 1,
        maxDelayMs: 1000,
        jitterFraction: 0,
      },
    });
    orchestration.bindTransportHandlers();

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    const firstScheduled = published.find((event) => event.type === "SipReconnectScheduled");
    expect(firstScheduled?.["attemptNumber"]).toBe(1);

    await vi.advanceTimersByTimeAsync(1000);

    expect(published.some((event) => event.type === "SipReconnectAttemptStarted")).toBe(true);
    const firstFailed = published.find((event) => event.type === "SipReconnectFailed");
    expect(firstFailed?.["attemptNumber"]).toBe(1);

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    const scheduledEvents = published.filter(
      (event) => event.type === "SipReconnectScheduled",
    );
    expect(scheduledEvents).toHaveLength(2);
    expect(scheduledEvents[1]?.["attemptNumber"]).toBe(2);

    await vi.advanceTimersByTimeAsync(1000);
    const failedEvents = published.filter((event) => event.type === "SipReconnectFailed");
    expect(failedEvents).toHaveLength(2);
    expect(failedEvents[1]?.["attemptNumber"]).toBe(2);
  });
});
