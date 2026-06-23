import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { BlindTransferUseCase } from "./BlindTransferUseCase.js";

describe("BlindTransferUseCase", () => {
  it("executes blind transfer success path", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      blindTransferScenario: "success",
    });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = createEngine(telephony, events);
    await engine.makeCall({
      callId: createCallId("call-blind-1"),
      phoneNumber: createPhoneNumber("+12025550210"),
    });

    const useCase = new BlindTransferUseCase(engine, createTestLogger());
    const result = await useCase.execute({
      callId: createCallId("call-blind-1"),
      targetNumber: "+12025550211",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.state).toBe("Ended");
    expect(telephony.getBlindTransferCalls()).toEqual([
      { callId: "call-blind-1", targetNumber: "+12025550211" },
    ]);
    expect(publishedTypes).toContain("CallTransferRequested");
    expect(publishedTypes).toContain("CallTransferred");
    expect(publishedTypes).toContain("CallEnded");
  });

  it("publishes CallTransferFailed and restores Active on gateway failure", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      blindTransferScenario: "failure",
    });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = createEngine(telephony, events);
    await engine.makeCall({
      callId: createCallId("call-blind-2"),
      phoneNumber: createPhoneNumber("+12025550212"),
    });

    const useCase = new BlindTransferUseCase(engine, createTestLogger());
    const result = await useCase.execute({
      callId: createCallId("call-blind-2"),
      targetNumber: "+12025550213",
    });

    expect(result.ok).toBe(false);
    expect(publishedTypes).toContain("CallTransferRequested");
    expect(publishedTypes).toContain("CallTransferFailed");
    expect(publishedTypes).not.toContain("CallTransferred");

    const holdResult = await engine.holdCall({ callId: createCallId("call-blind-2") });
    expect(holdResult.ok).toBe(true);
  });
});

function createEngine(
  telephonyGateway: MockTelephonyGateway,
  eventPublisher: InMemoryDomainEventBus = new InMemoryDomainEventBus(),
): CallEngine {
  return new CallEngine(
    telephonyGateway,
    new MockMediaGateway(),
    new InMemorySettingsRepository(),
    eventPublisher,
    createTestLogger(),
  );
}
