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
        uri: "sip:agent@pbx",
        username: "agent",
        password: "secret",
        displayName: "Agent",
        registrar: "sip:pbx",
      },
      correlationId,
    );

    published.length = 0;

    const disconnectPromise = facade.simulateSipTransportDisconnected(
      correlationId,
      "transport_closed",
    );
    await disconnectPromise;

    expect(published.map((event) => event.type)).toContain("SipReconnectScheduled");
    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.sipReconnectAttempt).toBe(1);

    const scheduledCount = published.filter(
      (event) => event.type === "SipReconnectScheduled",
    ).length;

    await vi.runOnlyPendingTimersAsync();

    expect(published.map((event) => event.type)).toContain("SipReconnectSucceeded");
    expect(projection.connectionState).toBe("connected");
    expect(telephony.isRegistered()).toBe(true);

    const scheduledAfterSuccess = published.filter(
      (event) => event.type === "SipReconnectScheduled",
    ).length;
    expect(scheduledAfterSuccess).toBe(scheduledCount);

    await vi.advanceTimersByTimeAsync(120_000);
    expect(
      published.filter((event) => event.type === "SipReconnectScheduled").length,
    ).toBe(scheduledCount);
  });
});
