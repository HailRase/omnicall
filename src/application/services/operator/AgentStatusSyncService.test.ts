import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { AgentStatusSyncService } from "./AgentStatusSyncService.js";
import { MockOperatorPlatformGateway } from "@adapters/mock/MockOperatorPlatformGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("AgentStatusSyncService", () => {
  it("publishes AgentStatusChanged after OCP auth with previousStatus null", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });

    const service = new AgentStatusSyncService(
      new MockOperatorPlatformGateway({ initialAgentStatus: "ready" }),
      events,
      createTestLogger(),
    );

    const correlationId = createCorrelationId();
    await service.syncAfterOcpAuth(correlationId);

    expect(published).toContain("AgentStatusChanged");
  });
});
