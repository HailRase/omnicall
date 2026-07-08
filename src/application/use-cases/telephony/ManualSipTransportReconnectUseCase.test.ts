import { describe, expect, it, vi } from "vitest";
import { ManualSipTransportReconnectUseCase } from "./ManualSipTransportReconnectUseCase.js";
import { SipRecoveryOrchestrationService } from "../../services/recovery/SipRecoveryOrchestrationService.js";
import { MockTelephonyGateway } from "@adapters/mock/MockTelephonyGateway.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { isErr } from "@shared/result/index.js";

describe("ManualSipTransportReconnectUseCase", () => {
  it("delegates to sip recovery orchestration", async () => {
    const correlationId = createCorrelationId();
    const orchestration = new SipRecoveryOrchestrationService({
      telephonyGateway: new MockTelephonyGateway("success"),
      eventPublisher: new InMemoryDomainEventBus(),
      logger: createTestLogger(),
    });
    const requestSpy = vi.spyOn(orchestration, "requestManualTransportReconnect");

    const useCase = new ManualSipTransportReconnectUseCase(orchestration, createTestLogger());
    const result = await useCase.execute({ correlationId });

    expect(isErr(result)).toBe(false);
    expect(requestSpy).toHaveBeenCalledWith(correlationId);
  });
});
