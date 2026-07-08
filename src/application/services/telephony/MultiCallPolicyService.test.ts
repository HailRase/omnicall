import { describe, expect, it, vi } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { MultiCallPolicyService } from "./MultiCallPolicyService.js";
import { CallTracker } from "./CallTracker.js";
import {
  createCallId,
  createOutgoingCall,
  createPhoneNumber,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { MockMediaGateway } from "@adapters/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { InMemorySettingsRepository } from "@adapters/index.js";

describe("MultiCallPolicyService", () => {
  it("publishes MultiCallOperationRejected when connecting blocks dial", async () => {
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const callTracker = new CallTracker();
    const connecting = {
      ...createOutgoingCall(createCallId("connecting"), createPhoneNumber("+1")),
      state: "Connecting" as const,
    };
    callTracker.trackCall(connecting);

    const service = new MultiCallPolicyService({
      settingsRepository: new InMemorySettingsRepository(),
      eventPublisher: events,
      logger: createTestLogger(),
      callTracker,
      mediaGateway: new MockMediaGateway(),
      holdCall: () => Promise.resolve(ok(connecting)),
      resumeCall: () => Promise.resolve(ok(connecting)),
    });

    const result = await service.checkConflictingOperationBlocked(
      "outgoing",
      createCorrelationId(),
    );

    expect(result.ok).toBe(false);
    expect(publishedTypes).toContain("MultiCallOperationRejected");
  });

  it("compensating unhold runs when mid-batch hold fails", async () => {
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const callTracker = new CallTracker();
    const callA = {
      ...createOutgoingCall(createCallId("rollback-a"), createPhoneNumber("+1")),
      state: "Active" as const,
    };
    const callB = {
      ...createOutgoingCall(createCallId("rollback-b"), createPhoneNumber("+2")),
      state: "Active" as const,
    };
    callTracker.trackCall(callA);
    callTracker.trackCall(callB);

    const holdCall = vi
      .fn()
      .mockResolvedValueOnce(ok(callA))
      .mockResolvedValueOnce(
        err(createPlatformError("operation_failed", "Hold failed for rollback-b")),
      );
    const resumeCall = vi.fn().mockResolvedValue(ok(callA));

    const service = new MultiCallPolicyService({
      settingsRepository: new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: true },
      }),
      eventPublisher: events,
      logger: createTestLogger(),
      callTracker,
      mediaGateway: new MockMediaGateway(),
      holdCall,
      resumeCall,
    });

    const result = await service.holdAllActiveLines(
      createCorrelationId(),
      "before_outgoing",
    );

    expect(result.ok).toBe(false);
    expect(holdCall).toHaveBeenCalledTimes(2);
    expect(resumeCall).toHaveBeenCalledWith({
      callId: createCallId("rollback-a"),
      correlationId: expect.any(String),
    });
    expect(publishedTypes).toContain("AllOtherCallsHeld");
    expect(publishedTypes).toContain("MultiCallOperationRejected");
  });
});
