import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import { MakeCallUseCase } from "./MakeCallUseCase.js";
import { MockMediaGateway, MockTelephonyGateway } from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("MakeCallUseCase", () => {
  it("rejects invalid phone number before gateway call", async () => {
    const telephony = new MockTelephonyGateway();
    const useCase = new MakeCallUseCase(
      new CallEngine(
        telephony,
        new MockMediaGateway(),
        new InMemoryDomainEventBus(),
        createTestLogger(),
      ),
      createTestLogger(),
    );

    const result = await useCase.execute({ number: "12" });
    expect(result.ok).toBe(false);
    expect(telephony.getDialedNumbers()).toHaveLength(0);
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

