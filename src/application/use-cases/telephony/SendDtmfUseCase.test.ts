import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/telephony/CallEngine.js";
import { SendDtmfUseCase } from "./SendDtmfUseCase.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId } from "@domain/index.js";

describe("SendDtmfUseCase", () => {
  it("rejects invalid tone", async () => {
    const useCase = new SendDtmfUseCase(
      new CallEngine(
        new MockTelephonyGateway(),
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        new InMemoryDomainEventBus(),
        createTestLogger(),
      ),
      createTestLogger(),
    );

    const result = await useCase.execute({
      callId: createCallId("call-1"),
      tone: "Z",
    });
    expect(result.ok).toBe(false);
  });

  it("sends tone through mock telephony gateway", async () => {
    const events = new InMemoryDomainEventBus();
    const eventTypes: string[] = [];
    events.subscribe((event) => {
      eventTypes.push(event.type);
    });

    const telephony = new MockTelephonyGateway({ dtmfScenario: "success" });
    const useCase = new SendDtmfUseCase(
      new CallEngine(
        telephony,
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        events,
        createTestLogger(),
      ),
      createTestLogger(),
    );

    const result = await useCase.execute({
      callId: createCallId("call-1"),
      tone: "5",
    });

    expect(result.ok).toBe(true);
    expect(telephony.getSentTones()).toEqual(["5"]);
    expect(eventTypes).toContain("DtmfSent");
  });
});

