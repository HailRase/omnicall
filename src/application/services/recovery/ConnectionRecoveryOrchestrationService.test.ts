import { describe, expect, it } from "vitest";
import { MockOperatorPlatformGateway, MockTelephonyGateway } from "@adapters/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { ConnectionRecoveryOrchestrationService } from "./ConnectionRecoveryOrchestrationService.js";

describe("ConnectionRecoveryOrchestrationService", () => {
  it("ignores OCP disconnect when sip-only mode is active", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const published: string[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway: new MockTelephonyGateway("success"),
      operatorGateway: new MockOperatorPlatformGateway(),
      eventPublisher,
      logger: createTestLogger(),
    });
    orchestration.bindTransportHandlers();

    eventPublisher.publish({
      type: "StartupModeResolved",
      correlationId,
      occurredAt: new Date().toISOString(),
      resolution: { action: "sip_only_ready" },
    });

    await orchestration.requestManualRetry("ocp", correlationId);

    expect(published).not.toContain("ManualReconnectRequested");
  });
});
