import { describe, expect, it } from "vitest";
import { ShutdownCleanupUseCase } from "@application/use-cases/ShutdownCleanupUseCase.js";
import { SessionTeardownOrchestrationService } from "@application/services/SessionTeardownOrchestrationService.js";
import { UnregisterAccountUseCase } from "@application/use-cases/UnregisterAccountUseCase.js";
import { ConnectionRecoveryOrchestrationService } from "@application/services/ConnectionRecoveryOrchestrationService.js";
import { SipRecoveryOrchestrationService } from "@application/services/SipRecoveryOrchestrationService.js";
import { CallEngine } from "@application/services/CallEngine.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { InMemoryAgentStatusReadModel } from "@application/read-models/InMemoryAgentStatusReadModel.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("ShutdownCleanup integration", () => {
  it("hangs up, unregisters SIP, disposes scheduler, and logs out OCP (LF-079)", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
    });
    const operatorGateway = new MockOperatorPlatformGateway({ scenario: "success" });
    const mediaGateway = new MockMediaGateway();
    const settingsRepository = new InMemorySettingsRepository({
      bootstrapConfig: {
        mode: "ocp",
        ocpToken: "token",
        ocpDomain: "ocp.example",
      },
    });
    const agentStatusReadModel = new InMemoryAgentStatusReadModel(eventPublisher);
    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway,
      operatorGateway,
      eventPublisher,
      logger: createTestLogger(),
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
      connectionRecoveryOrchestration: orchestration,
      sipRecoveryOrchestration: sipOrchestration,
      callEngine,
      mediaGateway,
      unregisterAccount,
      logger: createTestLogger(),
    });

    eventPublisher.publish({
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });

    const published: string[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const useCase = new ShutdownCleanupUseCase(
      sessionTeardown,
      operatorGateway,
      agentStatusReadModel,
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
    expect(operatorGateway.getLogoutInvocations()).toHaveLength(1);
    expect(orchestration.getScheduler().getPendingCount()).toBe(0);
  });
});
