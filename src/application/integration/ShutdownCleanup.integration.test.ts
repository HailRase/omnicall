import { describe, expect, it } from "vitest";
import { ShutdownCleanupUseCase } from "@application/use-cases/platform/ShutdownCleanupUseCase.js";
import { SessionTeardownOrchestrationService } from "@application/services/platform/SessionTeardownOrchestrationService.js";
import { UnregisterAccountUseCase } from "@application/use-cases/settings/UnregisterAccountUseCase.js";
import { SipRecoveryOrchestrationService } from "@application/services/recovery/SipRecoveryOrchestrationService.js";
import { CallEngine } from "@application/services/telephony/CallEngine.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("ShutdownCleanup integration", () => {
  it("hangs up, unregisters SIP, and disposes SIP recovery (LF-079)", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
    });
    const mediaGateway = new MockMediaGateway();
    const settingsRepository = new InMemorySettingsRepository({
      bootstrapConfig: {},
    });
    const sipOrchestration = new SipRecoveryOrchestrationService({
      telephonyGateway,
      eventPublisher,
      logger: createTestLogger(),
    });
    const callEngine = new CallEngine(
      telephonyGateway,
      mediaGateway,
      settingsRepository,
      eventPublisher,
      createTestLogger(),
    );
    const unregisterAccount = new UnregisterAccountUseCase(
      telephonyGateway,
      eventPublisher,
      createTestLogger(),
    );
    const sessionTeardown = new SessionTeardownOrchestrationService({
      sipRecoveryOrchestration: sipOrchestration,
      callEngine,
      mediaGateway,
      unregisterAccount,
      logger: createTestLogger(),
    });

    const published: string[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new ShutdownCleanupUseCase(
      sessionTeardown,
      eventPublisher,
      createTestLogger(),
    );

    const result = await useCase.execute({
      source: "before-quit",
      correlationId,
    });

    expect(isErr(result)).toBe(false);
    expect(published).toContain("AppShutdownRequested");
    expect(published).toContain("UnregistrationSucceeded");
    expect(telephonyGateway.getUnregisterInvocations()).toContain(correlationId);
    expect(mediaGateway.getReleaseAllInvocations()).toBe(1);
  });
});
