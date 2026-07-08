import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import {
  initialOcpConnectionRecoveryProjection,
  reduceOcpConnectionRecoveryProjection,
} from "@application/projections/operator/ocpConnectionRecoveryProjection.js";
import type { DomainEvent } from "@domain/index.js";
import { OCP_RECONNECT_POLICY_CONFIG } from "@domain/shared/recovery/ReconnectPolicy.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("OcpRecoveryOrchestration integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs 6×5s retries then terminal reconnect_failed (LF-058)", async () => {
    const correlationId = createCorrelationId();
    const operatorGateway = new MockOperatorPlatformGateway({
      scenario: "success",
      reconnectScenario: "failure",
    });
    const published: DomainEvent[] = [];
    let projection = initialOcpConnectionRecoveryProjection();

    const facade = new AccountBootstrapFacade({
      operatorGateway,
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: {
          mode: "ocp",
          ocpToken: "token",
          ocpDomain: "ocp.example",
        },
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event);
      projection = reduceOcpConnectionRecoveryProjection(projection, event);
    });

    const authResult = await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
      correlationId,
    });
    expect(isErr(authResult)).toBe(false);

    published.length = 0;

    const disconnectPromise = facade.simulateOcpTransportDisconnected(
      correlationId,
      "transport_closed",
    );
    await disconnectPromise;

    expect(published.map((event) => event.type)).toContain("OcpDisconnected");
    expect(projection.connectionState).toBe("reconnecting");

    for (let attempt = 1; attempt <= OCP_RECONNECT_POLICY_CONFIG.maxAttempts; attempt += 1) {
      await vi.advanceTimersByTimeAsync(OCP_RECONNECT_POLICY_CONFIG.baseDelayMs);

      const failedEvents = published.filter((event) => event.type === "OcpReconnectFailed");
      expect(failedEvents).toHaveLength(attempt);

      const lastFailed = failedEvents[failedEvents.length - 1];
      expect(lastFailed?.["attemptNumber"]).toBe(attempt);
      expect(lastFailed?.["isTerminal"]).toBe(
        attempt === OCP_RECONNECT_POLICY_CONFIG.maxAttempts,
      );
    }

    expect(projection.connectionState).toBe("manual_retry_available");
    expect(projection.ocpReconnectAttempt).toBe(OCP_RECONNECT_POLICY_CONFIG.maxAttempts);

    const scheduledCount = published.filter(
      (event) => event.type === "OcpReconnectScheduled",
    ).length;
    expect(scheduledCount).toBe(OCP_RECONNECT_POLICY_CONFIG.maxAttempts);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(
      published.filter((event) => event.type === "OcpReconnectScheduled").length,
    ).toBe(scheduledCount);
  });

  it("no-ops OCP recovery orchestration in SIP-only mode", async () => {
    const correlationId = createCorrelationId();
    const operatorGateway = new MockOperatorPlatformGateway({
      reconnectScenario: "failure",
    });
    const published: string[] = [];

    const facade = new AccountBootstrapFacade({
      operatorGateway,
      telephonyGateway: new MockTelephonyGateway("success"),
      mediaGateway: new MockMediaGateway(),
      settingsRepository: new InMemorySettingsRepository({
        bootstrapConfig: { mode: "sip-only" },
      }),
      logger: createTestLogger(),
    });

    facade.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    await facade.initialize({ mode: "sip-only" });

    await facade.simulateOcpTransportDisconnected(correlationId, "transport_closed");
    await vi.runOnlyPendingTimersAsync();

    expect(published).not.toContain("OcpDisconnected");
    expect(published).not.toContain("OcpReconnectScheduled");
  });
});
