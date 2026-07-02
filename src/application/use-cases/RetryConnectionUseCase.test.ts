import { describe, expect, it, vi } from "vitest";
import { RetryConnectionUseCase } from "./RetryConnectionUseCase.js";
import { ConnectionRecoveryOrchestrationService } from "../services/ConnectionRecoveryOrchestrationService.js";
import { SipRecoveryOrchestrationService } from "../services/SipRecoveryOrchestrationService.js";
import { InMemoryConnectionRecoveryReadModel } from "../read-models/InMemoryConnectionRecoveryReadModel.js";
import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { MockOperatorPlatformGateway, MockTelephonyGateway } from "@adapters/index.js";
import { createSipReconnectFailedEvent } from "@domain/telephony/events/sipRecoveryEvents.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("RetryConnectionUseCase", () => {
  it("rejects manual retry while reconnecting", async () => {
    const eventPublisher = new InMemoryDomainEventBus();
    const readModel = new InMemoryConnectionRecoveryReadModel(eventPublisher);
    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway: new MockTelephonyGateway("success"),
      operatorGateway: new MockOperatorPlatformGateway(),
      eventPublisher,
      logger: createTestLogger(),
    });
    const sipOrchestration = new SipRecoveryOrchestrationService({
      telephonyGateway: new MockTelephonyGateway("success"),
      eventPublisher,
      logger: createTestLogger(),
    });

    const useCase = new RetryConnectionUseCase(
      readModel,
      orchestration,
      sipOrchestration,
      createTestLogger(),
    );

    eventPublisher.publish({
      type: "SipTransportReconnectScheduled",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      attemptNumber: 1,
      delayMs: 5000,
    });

    const result = await useCase.execute({ channel: "sip" });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain("Automatic reconnect in progress");
    }
  });

  it("executes manual retry from manual_retry_available state", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const readModel = new InMemoryConnectionRecoveryReadModel(eventPublisher);
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
    });
    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway,
      operatorGateway: new MockOperatorPlatformGateway(),
      eventPublisher,
      logger: createTestLogger(),
    });
    const sipOrchestration = new SipRecoveryOrchestrationService({
      telephonyGateway,
      eventPublisher,
      logger: createTestLogger(),
    });
    const requestManualTransportReconnect = vi.spyOn(
      sipOrchestration,
      "requestManualTransportReconnect",
    );

    const useCase = new RetryConnectionUseCase(
      readModel,
      orchestration,
      sipOrchestration,
      createTestLogger(),
    );

    eventPublisher.publish(
      createSipReconnectFailedEvent(correlationId, {
        attemptNumber: 10,
        reason: "registration_timeout",
        isTerminal: true,
      }),
    );

    expect(readModel.getSnapshot().connectionState).toBe("manual_retry_available");

    const result = await useCase.execute({ channel: "sip", correlationId });
    expect(isErr(result)).toBe(false);
    expect(requestManualTransportReconnect).toHaveBeenCalledWith(correlationId);
  });
});
