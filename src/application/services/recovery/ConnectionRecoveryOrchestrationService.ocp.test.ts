import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockOperatorPlatformGateway } from "@adapters/index.js";
import { createOcpAuthenticationSucceededEvent, createOperatorSessionId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { ReconnectScheduler } from "../../infrastructure/ReconnectScheduler.js";
import { ConnectionRecoveryOrchestrationService } from "./ConnectionRecoveryOrchestrationService.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";

describe("ConnectionRecoveryOrchestrationService OCP", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("publishes OcpReconnectFailed after scheduled attempt fails", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const published: string[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const operatorGateway = new MockOperatorPlatformGateway({
      scenario: "success",
      reconnectScenario: "failure",
    });

    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway: new MockTelephonyGateway("success"),
      operatorGateway,
      eventPublisher,
      logger: createTestLogger(),
      scheduler: new ReconnectScheduler(),
      random: () => 0.5,
    });
    orchestration.bindTransportHandlers();
    orchestration.subscribe(eventPublisher);

    eventPublisher.publish(
      createOcpAuthenticationSucceededEvent(correlationId, {
        sessionId: createOperatorSessionId("session-1"),
        agentId: "agent-1",
      }),
    );

    await operatorGateway.simulateOcpTransportDisconnected({
      correlationId,
      reason: "transport_closed",
    });

    expect(published).toContain("OcpDisconnected");
    expect(published).toContain("OcpReconnectScheduled");

    await vi.advanceTimersByTimeAsync(5000);
    await vi.runOnlyPendingTimersAsync();

    expect(published).toContain("OcpReconnectFailed");
  });
});
