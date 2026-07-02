import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import {
  initialConnectionRecoveryProjection,
  reduceConnectionRecoveryProjection,
} from "@application/projections/connectionRecoveryProjection.js";
import type { DomainEvent } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("SipRecoveryOrchestration integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("disconnect → scheduled → succeeded updates projection (LF-008)", async () => {
    const correlationId = createCorrelationId();
    const telephony = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const published: DomainEvent[] = [];
    let projection = initialConnectionRecoveryProjection();

    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
      projection = reduceConnectionRecoveryProjection(projection, event);
    });

    await facade.initialize({ mode: "sip-only" });
    await facade.authorizeManualAccount(
      {
        username: "agent",
        password: "secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      correlationId,
    );

    published.length = 0;

    await facade.simulateSipTransportDisconnected(correlationId, "transport_closed");

    expect(published.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "SipTransportDisconnected",
        "SipRegistrationCleared",
        "SipTransportReconnectScheduled",
      ]),
    );
    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.sipReconnectAttempt).toBe(1);

    const scheduledCount = published.filter(
      (event) => event.type === "SipTransportReconnectScheduled",
    ).length;

    await vi.runOnlyPendingTimersAsync();

    await vi.runOnlyPendingTimersAsync();

    expect(published.map((event) => event.type)).toContain("SipTransportReconnectSucceeded");
    await vi.runOnlyPendingTimersAsync();

    expect(projection.connectionState).toBe("connected");
    expect(telephony.isRegistered()).toBe(true);

    const scheduledAfterSuccess = published.filter(
      (event) => event.type === "SipTransportReconnectScheduled",
    ).length;
    expect(scheduledAfterSuccess).toBe(scheduledCount);

    await vi.advanceTimersByTimeAsync(120_000);
    expect(
      published.filter((event) => event.type === "SipTransportReconnectScheduled").length,
    ).toBe(scheduledCount);
  });

  it("registration failed (transport up) → scheduled → reregister success → connected (F-014)", async () => {
    const correlationId = createCorrelationId();
    const telephony = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const published: DomainEvent[] = [];
    let projection = initialConnectionRecoveryProjection();

    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
      projection = reduceConnectionRecoveryProjection(projection, event);
    });

    await facade.initialize({ mode: "sip-only" });
    await facade.authorizeManualAccount(
      {
        username: "agent",
        password: "secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      correlationId,
    );

    published.length = 0;

    await facade.simulateSipRegistrationFailed(correlationId, "service_unavailable");

    expect(published.map((event) => event.type)).toContain("SipRegistrationRetryScheduled");
    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.sipRecoveryMode).toBe("registration");

    await vi.runOnlyPendingTimersAsync();

    expect(published.map((event) => event.type)).toContain("SipRegistrationRetrySucceeded");
    expect(projection.connectionState).toBe("connected");
    expect(telephony.isRegistered()).toBe(true);
  });

  it("auth registration failure schedules auto-retry when auto-reregister is enabled", async () => {
    const correlationId = createCorrelationId();
    const telephony = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const published: DomainEvent[] = [];

    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
    });

    await facade.initialize({ mode: "sip-only" });
    await facade.authorizeManualAccount(
      {
        username: "agent",
        password: "secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      correlationId,
    );

    published.length = 0;

    await facade.simulateSipRegistrationFailed(correlationId, "authentication_error");

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

  it("terminal registration retry failure → manual_retry_available (F-014)", async () => {
    const correlationId = createCorrelationId();
    const telephony = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const published: DomainEvent[] = [];
    let projection = initialConnectionRecoveryProjection();

    const facade = new AccountBootstrapFacade({
      operatorGateway: new MockOperatorPlatformGateway(),
      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
      projection = reduceConnectionRecoveryProjection(projection, event);
    });

    await facade.initialize({ mode: "sip-only" });
    await facade.authorizeManualAccount(
      {
        username: "agent",
        password: "secret",
        domain: "pbx",
        server: "sip:pbx",
      },
      correlationId,
    );

    const settingsResult = await facade.getUserSettingsForAccount();
    expect(settingsResult.ok).toBe(true);
    if (settingsResult.ok) {
      await facade.saveUserSettings({
        ...settingsResult.value,
        sipReregisterMaxAttempts: 1,
      });
    }

    published.length = 0;
    telephony.setScenario("failure");

    await facade.simulateSipRegistrationFailed(correlationId, "service_unavailable");
    await vi.runOnlyPendingTimersAsync();

    expect(published.map((event) => event.type)).toContain("SipRegistrationRetryFailed");
    expect(projection.connectionState).toBe("manual_retry_available");
    expect(projection.sipRecoveryMode).toBe("registration");
  });
});
