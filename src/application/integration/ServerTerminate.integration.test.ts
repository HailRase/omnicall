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
import { OCP_RECONNECT_POLICY_CONFIG } from "@domain/shared/recovery/ReconnectPolicy.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("ServerTerminate integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps inbound server_terminate to projection and stops scheduler (LF-049)", async () => {
    const correlationId = createCorrelationId();
    const operatorGateway = new MockOperatorPlatformGateway({
      scenario: "success",
      reconnectScenario: "failure",
    });
    const published: DomainEvent[] = [];
    let projection = initialConnectionRecoveryProjection();

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
      projection = reduceConnectionRecoveryProjection(projection, event);
    });

    const authResult = await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
      correlationId,
    });
    expect(isErr(authResult)).toBe(false);

    published.length = 0;

    await facade.simulateOcpTransportDisconnected(correlationId, "transport_closed");
    expect(projection.connectionState).toBe("reconnecting");

    const scheduledBeforeTerminate = published.filter(
      (event) => event.type === "OcpReconnectScheduled",
    ).length;

    const terminateResult = facade.simulateServerTerminate(
      correlationId,
      "session_revoked",
      "agent-001",
    );
    expect(terminateResult.ok).toBe(true);
    if (terminateResult.ok) {
      expect(terminateResult.value).toEqual({
        action: "server_terminate_published",
        entityId: "agent-001",
      });
    }

    expect(published.map((event) => event.type)).toContain("ServerTerminateReceived");
    expect(projection.connectionState).toBe("server_terminate");
    expect(projection.lastFailureReason).toBe("session_revoked");
    expect(projection.nextRetryAt).toBeNull();

    await vi.advanceTimersByTimeAsync(OCP_RECONNECT_POLICY_CONFIG.baseDelayMs * 3);

    const scheduledAfterTerminate = published.filter(
      (event) => event.type === "OcpReconnectScheduled",
    ).length;
    expect(scheduledAfterTerminate).toBe(scheduledBeforeTerminate);
    expect(facade.getReconnectScheduler().getPendingCount()).toBe(0);
  });

  it("routes server terminate through MockOperatorPlatformGateway helper", async () => {
    const correlationId = createCorrelationId();
    const operatorGateway = new MockOperatorPlatformGateway({ scenario: "success" });
    const published: string[] = [];

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
      published.push(event.type);
    });

    await facade.authenticateOcp.execute({
      token: "token",
      domain: "ocp.example",
      correlationId,
    });

    published.length = 0;
    operatorGateway.simulateServerTerminate({
      correlationId,
      reason: "forced_logout",
      entityId: "agent-001",
    });

    expect(published).toContain("ServerTerminateReceived");
  });
});
