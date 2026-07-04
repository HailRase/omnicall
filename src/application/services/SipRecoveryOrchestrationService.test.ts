import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockTelephonyGateway } from "@adapters/index.js";
import type { DomainEvent } from "@domain/index.js";
import {
  createCallEndedEvent,
  createCallId,
  createOutgoingCallRequestedEvent,
  createPhoneNumber,
  createSipAccountId,
} from "@domain/index.js";
import { SIP_RECONNECT_POLICY_CONFIG } from "@domain/shared/recovery/ReconnectPolicy.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { ReconnectScheduler } from "../infrastructure/ReconnectScheduler.js";
import { SipRecoveryOrchestrationService } from "./SipRecoveryOrchestrationService.js";

describe("SipRecoveryOrchestrationService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createService(
    telephonyGateway: MockTelephonyGateway,
    eventPublisher = new InMemoryDomainEventBus(),
  ) {
    const published: DomainEvent[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event);
    });

    const service = new SipRecoveryOrchestrationService({
      telephonyGateway,
      eventPublisher,
      logger: createTestLogger(),
      scheduler: new ReconnectScheduler(),
      random: () => 0.5,
    });
    service.bindTransportHandlers();
    service.subscribe(eventPublisher);
    return { service, published, eventPublisher };
  }

  it("ignores duplicate SIP disconnect while recovery is in flight", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "failure",
    });
    const { published } = createService(telephonyGateway);

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    const scheduledAfterFirst = published.filter(
      (event) => event.type === "SipTransportReconnectScheduled",
    );
    expect(scheduledAfterFirst).toHaveLength(1);
    expect(scheduledAfterFirst[0]?.["attemptNumber"]).toBe(1);

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    expect(
      published.filter((event) => event.type === "SipTransportReconnectScheduled"),
    ).toHaveLength(1);
  });

  it("publishes SipRegistrationCleared on transport disconnect", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const { published } = createService(telephonyGateway);

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    expect(published.map((event) => event.type)).toEqual(
      expect.arrayContaining(["SipTransportDisconnected", "SipRegistrationCleared"]),
    );
  });

  it("keeps attempt counter monotonic across transport retries", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "failure",
    });
    const { published } = createService(telephonyGateway);

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    const firstScheduled = published.find(
      (event) => event.type === "SipTransportReconnectScheduled",
    );
    expect(firstScheduled?.["attemptNumber"]).toBe(1);

    await vi.advanceTimersByTimeAsync(5000);

    const firstFailed = published.find((event) => event.type === "SipTransportReconnectFailed");
    expect(firstFailed?.["attemptNumber"]).toBe(1);

    const scheduledEvents = published.filter(
      (event) => event.type === "SipTransportReconnectScheduled",
    );
    expect(scheduledEvents).toHaveLength(2);
    expect(scheduledEvents[1]?.["attemptNumber"]).toBe(2);
  });

  it("schedules auto-retry on auth registration failure", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const { published, eventPublisher } = createService(telephonyGateway);

    eventPublisher.publish({
      type: "RegistrationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: "agent",
    });

    await telephonyGateway.simulateRegistrationFailed({
      correlationId,
      reason: "authentication_error",
      accountId: null,
    });

    expect(published.some((event) => event.type === "SipRegistrationRetryScheduled")).toBe(
      true,
    );
    expect(
      published.some(
        (event) =>
          event.type === "SipRegistrationRetryFailed" && event["isTerminal"] === true,
      ),
    ).toBe(false);
  });

  it("schedules auto-retry on forbidden RegistrationFailed from initial register", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const { published, eventPublisher } = createService(telephonyGateway);

    await telephonyGateway.simulateTransportConnected({ correlationId });

    eventPublisher.publish({
      type: "RegistrationFailed",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: "agent",
      reason: "forbidden",
    });

    await Promise.resolve();

    expect(published.some((event) => event.type === "SipRegistrationRetryScheduled")).toBe(
      true,
    );
    expect(
      published.some(
        (event) =>
          event.type === "SipRegistrationRetryFailed" && event["isTerminal"] === true,
      ),
    ).toBe(false);
  });

  it("publishes RegistrationFailed when adapter reports runtime registration failure", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const { published } = createService(telephonyGateway);

    await telephonyGateway.simulateTransportConnected({ correlationId });

    await telephonyGateway.simulateRegistrationFailed({
      correlationId,
      reason: "forbidden",
      accountId: createSipAccountId("agent"),
    });

    expect(published.some((event) => event.type === "RegistrationFailed")).toBe(true);
    expect(published.some((event) => event.type === "SipRegistrationRetryScheduled")).toBe(
      true,
    );
  });

  it("does not schedule registration retry while transport is down", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const { published } = createService(telephonyGateway);

    await telephonyGateway.simulateRegistrationFailed({
      correlationId,
      reason: "service_unavailable",
      accountId: null,
    });

    expect(published.some((event) => event.type === "SipRegistrationRetryScheduled")).toBe(
      false,
    );
  });

  it("pauses transport reconnect scheduling while an active call is in progress (Q6)", async () => {
    const correlationId = createCorrelationId();
    const callCorrelationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const { published, eventPublisher } = createService(telephonyGateway);

    eventPublisher.publish(
      createOutgoingCallRequestedEvent(callCorrelationId, {
        callId: createCallId("active-call"),
        phoneNumber: createPhoneNumber("1001"),
      }),
    );

    published.length = 0;

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    expect(published.map((event) => event.type)).toEqual(
      expect.arrayContaining(["SipTransportDisconnected", "SipRegistrationCleared"]),
    );
    expect(published.some((event) => event.type === "SipTransportReconnectScheduled")).toBe(
      false,
    );

    await vi.advanceTimersByTimeAsync(60_000);

    expect(
      published.some((event) => event.type === "SipTransportReconnectAttemptStarted"),
    ).toBe(false);
  });

  it("resumes transport reconnect scheduling after the active call ends (Q6)", async () => {
    const correlationId = createCorrelationId();
    const callCorrelationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const { published, eventPublisher } = createService(telephonyGateway);

    eventPublisher.publish(
      createOutgoingCallRequestedEvent(callCorrelationId, {
        callId: createCallId("active-call"),
        phoneNumber: createPhoneNumber("1001"),
      }),
    );

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    published.length = 0;

    eventPublisher.publish(
      createCallEndedEvent(callCorrelationId, { callId: createCallId("active-call") }),
    );

    expect(published.some((event) => event.type === "SipTransportReconnectScheduled")).toBe(
      true,
    );

    await vi.runOnlyPendingTimersAsync();

    expect(published.map((event) => event.type)).toContain(
      "SipTransportReconnectAttemptStarted",
    );
  });

  it("manual transport reconnect keeps attempt number", async () => {
    const correlationId = createCorrelationId();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "failure",
    });
    const { service, published } = createService(telephonyGateway);

    await telephonyGateway.simulateTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });
    await vi.advanceTimersByTimeAsync(5000);

    telephonyGateway.setReconnectScenario("success");
    published.length = 0;

    await service.requestManualTransportReconnect(correlationId);

    const started = published.find(
      (event) => event.type === "SipTransportReconnectAttemptStarted",
    );
    expect(started?.["attemptNumber"]).toBe(2);
  });
});

describe("SipRecoveryOrchestrationService policies", () => {
  it("uses separate transport and registration policies", () => {
    const service = new SipRecoveryOrchestrationService({
      telephonyGateway: new MockTelephonyGateway("success"),
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger(),
      transportPolicy: {
        ...SIP_RECONNECT_POLICY_CONFIG,
        maxAttempts: 2,
      },
      registrationPolicy: {
        ...SIP_RECONNECT_POLICY_CONFIG,
        maxAttempts: 7,
      },
    });

    expect(service).toBeDefined();
  });
});
