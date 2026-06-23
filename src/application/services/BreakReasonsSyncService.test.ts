import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { BreakReasonsSyncService } from "./BreakReasonsSyncService.js";
import { MockOperatorPlatformGateway } from "@adapters/mock/MockOperatorPlatformGateway.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("BreakReasonsSyncService", () => {
  it("persists break reasons and publishes BreakReasonsReceived", async () => {
    const events = new InMemoryDomainEventBus();
    const published: string[] = [];
    events.subscribe((event) => {
      published.push(event.type);
    });
    const settings = new InMemorySettingsRepository({
      incomingCallSettings: {
        autoAnswerTimeoutSec: null,
        rejectReasonRequired: false,
        allowedBreakReasons: [],
      },
    });

    const service = new BreakReasonsSyncService(
      new MockOperatorPlatformGateway(),
      settings,
      events,
      createTestLogger(),
    );

    await service.syncAfterOcpAuth(createCorrelationId());

    expect(published).toContain("BreakReasonsReceived");
    const incoming = await settings.getIncomingCallSettings();
    expect(incoming.allowedBreakReasons.length).toBeGreaterThan(0);
    expect(incoming.rejectReasonRequired).toBe(true);
  });
});
