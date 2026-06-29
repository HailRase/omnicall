import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import { MakeCallUseCase } from "./MakeCallUseCase.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("MakeCallUseCase", () => {
  it("rejects empty phone number before gateway call", async () => {
    const telephony = new MockTelephonyGateway();
    const useCase = new MakeCallUseCase(
      new CallEngine(
        telephony,
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        new InMemoryDomainEventBus(),
        createTestLogger(),
      ),
      createTestLogger(),
    );

    const result = await useCase.execute({ number: "   " });
    expect(result.ok).toBe(false);
    expect(telephony.getDialedNumbers()).toHaveLength(0);
  });

  it("allows single-digit extension through mock gateway", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const useCase = new MakeCallUseCase(
      new CallEngine(
        telephony,
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        new InMemoryDomainEventBus(),
        createTestLogger(),
      ),
      createTestLogger(),
    );

    const result = await useCase.execute({ number: "4" });
    expect(result.ok).toBe(true);
    expect(telephony.getDialedNumbers()).toEqual(["4"]);
  });

  it("creates outgoing answered call through mock gateway", async () => {
    const events = new InMemoryDomainEventBus();
    const eventTypes: string[] = [];
    events.subscribe((event) => {
      eventTypes.push(event.type);
    });

    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const useCase = new MakeCallUseCase(
      new CallEngine(
        telephony,
        new MockMediaGateway(),
        new InMemorySettingsRepository(),
        events,
        createTestLogger(),
      ),
      createTestLogger(),
    );

    const result = await useCase.execute({ number: "+12025550147" });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.state).toBe("Active");
    expect(eventTypes).toEqual([
      "OutgoingCallRequested",
      "OutgoingCallStarted",
      "CallAnswered",
      "RemoteAudioAttached",
    ]);
    expect(telephony.getDialedNumbers()).toEqual(["+12025550147"]);
  });
});

