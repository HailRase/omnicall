import { describe, expect, it, vi } from "vitest";
import { SessionTeardownOrchestrationService } from "./SessionTeardownOrchestrationService.js";
import { CallEngine } from "../telephony/CallEngine.js";
import { SipRecoveryOrchestrationService } from "../recovery/SipRecoveryOrchestrationService.js";
import { UnregisterAccountUseCase } from "../../use-cases/settings/UnregisterAccountUseCase.js";
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
import type { MediaGateway } from "@ports/index.js";

describe("SessionTeardownOrchestrationService", () => {
  function createHarness(mediaGateway: MediaGateway = new MockMediaGateway()) {
    const eventPublisher = new InMemoryDomainEventBus();
    const telephonyGateway = new MockTelephonyGateway({ registrationScenario: "success" });
    const sipOrchestration = new SipRecoveryOrchestrationService({
      telephonyGateway,
      eventPublisher,
      logger: createTestLogger(),
    });
    const callEngine = new CallEngine(
      telephonyGateway,
      mediaGateway,
      new InMemorySettingsRepository(),
      eventPublisher,
      createTestLogger(),
    );
    const hangupSpy = vi.spyOn(callEngine, "hangupAllCalls");
    const sipDisposeSpy = vi.spyOn(sipOrchestration, "dispose");
    const unregisterAccount = new UnregisterAccountUseCase(
      telephonyGateway,
      eventPublisher,
      createTestLogger(),
    );
    const unregisterSpy = vi.spyOn(unregisterAccount, "execute");

    const service = new SessionTeardownOrchestrationService({
      sipRecoveryOrchestration: sipOrchestration,
      callEngine,
      mediaGateway,
      unregisterAccount,
      logger: createTestLogger(),
    });

    return {
      service,
      eventPublisher,
      telephonyGateway,
      mediaGateway,
      hangupSpy,
      sipDisposeSpy,
      unregisterSpy,
    };
  }

  it("runs teardown steps in canonical order", async () => {
    const correlationId = createCorrelationId();
    const order: string[] = [];
    const harness = createHarness();

    harness.sipDisposeSpy.mockImplementation(() => {
      order.push("dispose");
    });
    harness.hangupSpy.mockImplementation(() => {
      order.push("hangup");
      return Promise.resolve();
    });
    harness.unregisterSpy.mockImplementation(() => {
      order.push("unregister");
      return Promise.resolve({ ok: true as const, value: undefined });
    });

    const result = await harness.service.execute({
      correlationId,
      operation: "end_user_session",
    });

    expect(result.ok).toBe(true);
    expect(order).toEqual(["dispose", "hangup", "unregister"]);
  });

  it("continues teardown when a step fails", async () => {
    const correlationId = createCorrelationId();
    const harness = createHarness();

    harness.unregisterSpy.mockResolvedValue(
      err(createPlatformError("operation_failed", "unregister failed")),
    );

    const result = await harness.service.execute({
      correlationId,
      operation: "shutdown_cleanup",
    });

    expect(result.ok).toBe(false);
    expect(harness.sipDisposeSpy).toHaveBeenCalled();
    expect(harness.hangupSpy).toHaveBeenCalled();
    expect(harness.unregisterSpy).toHaveBeenCalled();
  });

  it("rejects concurrent teardown", async () => {
    const correlationId = createCorrelationId();
    const harness = createHarness();

    let resolveHangup: (() => void) | undefined;
    const hangupPromise = new Promise<void>((resolve) => {
      resolveHangup = resolve;
    });
    harness.hangupSpy.mockReturnValue(hangupPromise);

    const first = harness.service.execute({
      correlationId,
      operation: "end_user_session",
    });
    const second = await harness.service.execute({
      correlationId: createCorrelationId(),
      operation: "end_user_session",
    });

    expect(second.ok).toBe(false);
    resolveHangup?.();
    await first;
  });
});
