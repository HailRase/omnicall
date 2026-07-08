import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import {
  initialSipSessionHealthProjection,
  reduceSipSessionHealthProjection,
} from "@application/projections/telephony/sipSessionHealthProjection.js";
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
    let projection = initialSipSessionHealthProjection();

    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
      projection = reduceSipSessionHealthProjection(projection, event);
    });

    await facade.initialize({});
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
    expect(projection.transport).toBe("reconnecting");
    expect(projection.recovery.attemptNumber).toBe(1);

    const scheduledCount = published.filter(
      (event) => event.type === "SipTransportReconnectScheduled",
    ).length;

    await vi.runOnlyPendingTimersAsync();

    await vi.runOnlyPendingTimersAsync();

    expect(published.map((event) => event.type)).toContain("SipTransportReconnectSucceeded");
    await vi.runOnlyPendingTimersAsync();

    expect(projection.transport).toBe("connected");
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
    let projection = initialSipSessionHealthProjection();

    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
      projection = reduceSipSessionHealthProjection(projection, event);
    });

    await facade.initialize({});
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
    expect(projection.recovery.target).toBe("registration");

    await vi.runOnlyPendingTimersAsync();

    expect(published.map((event) => event.type)).toContain("SipRegistrationRetrySucceeded");
    expect(projection.transport).toBe("connected");
    expect(telephony.isRegistered()).toBe(true);
  });

  it("auth registration failure schedules auto-retry when auto-reregister is enabled", async () => {
    const correlationId = createCorrelationId();
    const telephony = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const published: DomainEvent[] = [];

    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
    });

    await facade.initialize({});
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

  it("terminal registration retry failure allows manual retry (F-014)", async () => {
    const correlationId = createCorrelationId();
    const telephony = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const published: DomainEvent[] = [];
    let projection = initialSipSessionHealthProjection();

    const facade = new AccountBootstrapFacade({      telephonyGateway: telephony,
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {},
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
      projection = reduceSipSessionHealthProjection(projection, event);
    });

    await facade.initialize({});
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
    expect(projection.recovery.target).toBe("registration");
    expect(projection.recovery.nextRetryAt).toBeNull();
    expect(projection.registration).toBe("failed");
  });
});
