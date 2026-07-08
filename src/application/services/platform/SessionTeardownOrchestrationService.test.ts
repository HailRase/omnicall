import { describe, expect, it, vi } from "vitest";
import { SessionTeardownOrchestrationService } from "./SessionTeardownOrchestrationService.js";
import { CallEngine } from "../telephony/CallEngine.js";
import { ConnectionRecoveryOrchestrationService } from "../recovery/ConnectionRecoveryOrchestrationService.js";
import { SipRecoveryOrchestrationService } from "../recovery/SipRecoveryOrchestrationService.js";
import { UnregisterAccountUseCase } from "../../use-cases/settings/UnregisterAccountUseCase.js";
import { InMemoryDomainEventBus } from "../../events/InMemoryDomainEventBus.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockOperatorPlatformGateway,
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
    const orchestration = new ConnectionRecoveryOrchestrationService({
      telephonyGateway,
      operatorGateway: new MockOperatorPlatformGateway({ scenario: "success" }),
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
      new InMemorySettingsRepository(),
      eventPublisher,
      createTestLogger(),
    );
    const hangupSpy = vi.spyOn(callEngine, "hangupAllCalls");
    const disposeSpy = vi.spyOn(orchestration, "dispose");
    const sipDisposeSpy = vi.spyOn(sipOrchestration, "dispose");
    const unregisterAccount = new UnregisterAccountUseCase(
      telephonyGateway,
      eventPublisher,
      createTestLogger(),
    );
    const unregisterSpy = vi.spyOn(unregisterAccount, "execute");

    const service = new SessionTeardownOrchestrationService({
      connectionRecoveryOrchestration: orchestration,
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
      disposeSpy,
      sipDisposeSpy,
      unregisterSpy,
    };
  }

  it("runs teardown steps in canonical order", async () => {
    const correlationId = createCorrelationId();
    const order: string[] = [];
    const harness = createHarness();

    harness.disposeSpy.mockImplementation(() => {
      order.push("dispose");
    });
    harness.hangupSpy.mockImplementation(() => {
      order.push("hangup");
      return Promise.resolve();
    });

    const published: string[] = [];
    harness.eventPublisher.subscribe((event) => {
      published.push(event.type);
    });

    const result = await harness.service.execute({
      correlationId,
      operation: "end_user_session",
    });

    expect(result.ok).toBe(true);
    expect(order).toEqual(["dispose", "hangup"]);
    expect(harness.mediaGateway).toBeInstanceOf(MockMediaGateway);
    expect((harness.mediaGateway as MockMediaGateway).getReleaseAllInvocations()).toBe(1);
    expect(harness.unregisterSpy).toHaveBeenCalledWith({ correlationId });
    expect(published).toContain("UnregistrationSucceeded");
    expect(published).not.toContain("UserSessionEnded");
  });

  it("continues best-effort when a step fails", async () => {
    const correlationId = createCorrelationId();
    const failingMedia: MediaGateway = {
      attachRemoteAudio: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      playRingbackTone: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      playIncomingRingtone: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      playRingtone: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      playBusyTone: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      playFailedTone: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      stopTone: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      stopRingtone: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      muteCall: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      unmuteCall: () => Promise.resolve(err(createPlatformError("operation_failed", "x"))),
      releaseAll: () =>
        Promise.resolve(err(createPlatformError("operation_failed", "media release failed"))),
    };
    const harness = createHarness(failingMedia);

    const result = await harness.service.execute({
      correlationId,
      operation: "shutdown_cleanup",
    });

    expect(result.ok).toBe(false);
    expect(harness.unregisterSpy).toHaveBeenCalledWith({ correlationId });
  });

  it("rejects concurrent teardown while another run is in progress", async () => {
    const correlationId = createCorrelationId();
    const harness = createHarness();
    let releaseHangup: (() => void) | undefined;
    const hangupGate = new Promise<void>((resolve) => {
      releaseHangup = resolve;
    });

    harness.hangupSpy.mockImplementation(async () => {
      await hangupGate;
    });

    const firstRun = harness.service.execute({
      correlationId,
      operation: "end_user_session",
    });
    const secondResult = await harness.service.execute({
      correlationId: createCorrelationId(),
      operation: "end_user_session",
    });

    expect(secondResult.ok).toBe(false);
    if (!secondResult.ok) {
      expect(secondResult.error.message).toContain("already in progress");
    }

    releaseHangup?.();
    const firstResult = await firstRun;
    expect(firstResult.ok).toBe(true);
  });
});
