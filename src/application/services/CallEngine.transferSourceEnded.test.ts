import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import type { DomainEvent } from "@domain/index.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "@application/projections/multiLineCallProjection.js";
import {
  initialTransferProjection,
  reduceTransferProjection,
} from "@application/projections/transferProjection.js";
import { isTransferPanelVisible } from "@application/projections/transferPanelProjection.js";
import { CallEngine } from "./CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("CallEngine transfer source ended", () => {
  it("cancels transfer mode when source call ends during consultation", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const collectedEvents: DomainEvent[] = [];
    events.subscribe((event) => {
      collectedEvents.push(event);
    });
    const engine = createEngine(telephony, events);
    const sourceCallId = createCallId("src-ended-1");
    const consultationCallId = createCallId("consult-ended-1");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550910"),
    });
    engine.startTransferMode({ callId: sourceCallId });

    const consultationResult = await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550911",
      consultationCallId,
    });
    expect(consultationResult.ok).toBe(true);
    await engine.handleOutboundCallAnswered(consultationCallId);

    await engine.handleCallEnded(sourceCallId);

    expect(collectedEvents.some((event) => event.type === "TransferModeCancelled")).toBe(
      true,
    );

    let transferProjection = initialTransferProjection();
    let multiLineProjection = initialMultiLineCallProjection();
    for (const event of collectedEvents) {
      transferProjection = reduceTransferProjection(transferProjection, event);
      multiLineProjection = reduceMultiLineCallProjection(multiLineProjection, event);
    }

    expect(transferProjection.transferModeActive).toBe(false);
    expect(
      isTransferPanelVisible(transferProjection, {
        attendedPhase: multiLineProjection.attendedPhase,
        consultationCallId: multiLineProjection.consultationCallId,
      }),
    ).toBe(false);
  });

  it("cancels transfer mode when source call ends before consultation starts", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const collectedEvents: DomainEvent[] = [];
    events.subscribe((event) => {
      collectedEvents.push(event);
    });
    const engine = createEngine(telephony, events);
    const sourceCallId = createCallId("src-ended-2");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550912"),
    });
    engine.startTransferMode({ callId: sourceCallId });

    await engine.handleCallEnded(sourceCallId);

    expect(collectedEvents.some((event) => event.type === "TransferModeCancelled")).toBe(
      true,
    );

    let transferProjection = initialTransferProjection();
    let multiLineProjection = initialMultiLineCallProjection();
    for (const event of collectedEvents) {
      transferProjection = reduceTransferProjection(transferProjection, event);
      multiLineProjection = reduceMultiLineCallProjection(multiLineProjection, event);
    }

    expect(transferProjection.transferModeActive).toBe(false);
    expect(
      isTransferPanelVisible(transferProjection, {
        attendedPhase: multiLineProjection.attendedPhase,
        consultationCallId: multiLineProjection.consultationCallId,
      }),
    ).toBe(false);
  });
});

function createEngine(
  telephony: MockTelephonyGateway,
  events: InMemoryDomainEventBus = new InMemoryDomainEventBus(),
): CallEngine {
  return new CallEngine(
    telephony,
    new MockMediaGateway(),
    new InMemorySettingsRepository({ multiCallSettings: { multiSessionsEnabled: true } }),
    events,
    createTestLogger(),
  );
}
