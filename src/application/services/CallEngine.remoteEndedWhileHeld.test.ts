import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import type { DomainEvent } from "@domain/index.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "@application/projections/multiLineCallProjection.js";
import { CallEngine } from "./CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("CallEngine remote ended while held", () => {
  it("publishes CallEnded and removes held line when remote party hangs up", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const collectedEvents: DomainEvent[] = [];
    events.subscribe((event) => {
      collectedEvents.push(event);
    });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const callId = createCallId("held-remote-end-1");

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550920"),
    });
    const holdResult = await engine.holdCall({ callId });
    expect(holdResult.ok).toBe(true);

    await engine.handleCallEnded(callId);

    expect(collectedEvents.some((event) => event.type === "CallEnded")).toBe(true);

    let multiLineProjection = initialMultiLineCallProjection();
    for (const event of collectedEvents) {
      multiLineProjection = reduceMultiLineCallProjection(multiLineProjection, event);
    }

    expect(multiLineProjection.lines).toHaveLength(0);
  });
});
