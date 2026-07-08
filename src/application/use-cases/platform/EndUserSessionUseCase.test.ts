import { describe, expect, it, vi } from "vitest";
import { EndUserSessionUseCase } from "./EndUserSessionUseCase.js";
import { SessionTeardownOrchestrationService } from "../../services/platform/SessionTeardownOrchestrationService.js";
import { UnregisterAccountUseCase } from "../settings/UnregisterAccountUseCase.js";
import { CallEngine } from "../../services/telephony/CallEngine.js";
import { SipRecoveryOrchestrationService } from "../../services/recovery/SipRecoveryOrchestrationService.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err } from "@shared/result/index.js";

describe("EndUserSessionUseCase", () => {
  function createUseCase() {
    const eventPublisher = new InMemoryDomainEventBus();
    const telephonyGateway = new MockTelephonyGateway({ registrationScenario: "success" });
    const sipOrchestration = new SipRecoveryOrchestrationService({
      telephonyGateway,
      eventPublisher,
      logger: createTestLogger(),
    });
    const callEngine = new CallEngine(
      telephonyGateway,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      eventPublisher,
      createTestLogger(),
    );
    const sessionTeardown = new SessionTeardownOrchestrationService({
      sipRecoveryOrchestration: sipOrchestration,
      callEngine,
      mediaGateway: new MockMediaGateway(),
      unregisterAccount: new UnregisterAccountUseCase(
        telephonyGateway,
        eventPublisher,
        createTestLogger(),
      ),
      logger: createTestLogger(),
    });

    return {
      useCase: new EndUserSessionUseCase(sessionTeardown, eventPublisher, createTestLogger()),
      eventPublisher,
      executeSpy: vi.spyOn(sessionTeardown, "execute"),
    };
  }

  it("delegates teardown and publishes UserSessionEnded", async () => {
    const correlationId = createCorrelationId();
    const { useCase, executeSpy, eventPublisher } = createUseCase();
    const published: string[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const result = await useCase.execute({ correlationId });

    expect(result.ok).toBe(true);
    expect(executeSpy).toHaveBeenCalledWith({
      correlationId,
      operation: "end_user_session",
    });
    expect(published).toContain("UserSessionEnded");
  });

  it("is idempotent after successful logout", async () => {
    const { useCase, executeSpy } = createUseCase();

    await useCase.execute({});
    await useCase.execute({});

    expect(executeSpy).toHaveBeenCalledTimes(1);
  });

  it("allows logout again after RegistrationSucceeded", async () => {
    const correlationId = createCorrelationId();
    const { useCase, executeSpy, eventPublisher } = createUseCase();

    await useCase.execute({});

    eventPublisher.publish({
      type: "RegistrationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: "acc-1",
    });

    await useCase.execute({});

    expect(executeSpy).toHaveBeenCalledTimes(2);
  });

  it("does not publish UserSessionEnded when teardown is already in progress", async () => {
    const { useCase, executeSpy, eventPublisher } = createUseCase();
    const published: string[] = [];
    eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    executeSpy.mockResolvedValueOnce(
      err(
        createPlatformError("operation_failed", "Session teardown already in progress", {
          reason: "teardown_in_progress",
        }),
      ),
    );

    const result = await useCase.execute({});

    expect(result.ok).toBe(false);
    expect(published).not.toContain("UserSessionEnded");
  });
});
