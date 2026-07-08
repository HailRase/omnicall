import { describe, expect, it, vi } from "vitest";
import { RetryConnectionUseCase } from "./RetryConnectionUseCase.js";
import { SipRecoveryOrchestrationService } from "../../services/recovery/SipRecoveryOrchestrationService.js";
import { InMemorySipSessionHealthReadModel } from "../../read-models/InMemorySipSessionHealthReadModel.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { MockTelephonyGateway } from "@adapters/index.js";
import { createSipTransportReconnectFailedEvent } from "@domain/telephony/events/sipTransportEvents.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";
import { isSipManualRetryAvailable } from "../../projections/telephony/deriveSipManualRetryGate.js";

describe("RetryConnectionUseCase", () => {
  it("rejects manual retry while reconnecting", async () => {
    const eventPublisher = new InMemoryDomainEventBus();
    const sipReadModel = new InMemorySipSessionHealthReadModel(eventPublisher);
    const sipOrchestration = new SipRecoveryOrchestrationService({
      telephonyGateway: new MockTelephonyGateway({ registrationScenario: "success" }),
      eventPublisher,
      logger: createTestLogger(),
    });

    const useCase = new RetryConnectionUseCase(
      sipReadModel,
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

  it("executes manual retry from terminal SIP transport failure", async () => {
    const correlationId = createCorrelationId();
    const eventPublisher = new InMemoryDomainEventBus();
    const sipReadModel = new InMemorySipSessionHealthReadModel(eventPublisher);
    const telephonyGateway = new MockTelephonyGateway({
      registrationScenario: "success",
      reconnectScenario: "success",
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
      sipReadModel,
      sipOrchestration,
      createTestLogger(),
    );

    eventPublisher.publish({
      type: "SipSessionActivated",
      correlationId,
      occurredAt: new Date().toISOString(),
    });
    eventPublisher.publish(
      createSipTransportReconnectFailedEvent(correlationId, {
        attemptNumber: 5,
        reason: "transport_closed",
        isTerminal: true,
      }),
    );

    expect(isSipManualRetryAvailable(sipReadModel.getSnapshot())).toBe(true);

    const result = await useCase.execute({ channel: "sip", correlationId });
    expect(isErr(result)).toBe(false);
    expect(requestManualTransportReconnect).toHaveBeenCalledWith(correlationId);
  });
});
