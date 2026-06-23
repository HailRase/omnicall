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
import { resolveTransferFailureMessage } from "@application/projections/transferPanelProjection.js";
import { CallEngine } from "./CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("CallEngine cancel transfer", () => {
  it("restores valid state after cancel transfer from transfer mode", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = createEngine(telephony, events);
    const callId = createCallId("cancel-1");

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550310"),
    });

    const startResult = engine.startTransferMode({ callId });
    expect(startResult.ok).toBe(true);
    expect(publishedTypes).toContain("TransferModeStarted");

    const cancelResult = await engine.cancelTransfer({ callId });
    expect(cancelResult.ok).toBe(true);
    expect(publishedTypes).toContain("TransferModeCancelled");
    expect(publishedTypes).not.toContain("ConsultationCallFailed");

    const holdResult = await engine.holdCall({ callId });
    expect(holdResult.ok).toBe(true);
    if (!holdResult.ok) {
      return;
    }
    expect(holdResult.value.state).toBe("Held");
  });

  it("clears stale failure when cancelling active consultation and re-entering transfer mode", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const collectedEvents: DomainEvent[] = [];
    events.subscribe((event) => {
      collectedEvents.push(event);
    });
    const engine = createEngine(telephony, events);
    const sourceCallId = createCallId("cancel-src-1");
    const consultationCallId = createCallId("cancel-consult-1");

    await engine.makeCall({
      callId: sourceCallId,
      phoneNumber: createPhoneNumber("+12025550311"),
    });
    engine.startTransferMode({ callId: sourceCallId });

    const consultationResult = await engine.startConsultation({
      sourceCallId,
      targetNumber: "+12025550312",
      consultationCallId,
    });
    expect(consultationResult.ok).toBe(true);

    const cancelResult = await engine.cancelTransfer({ callId: sourceCallId });
    expect(cancelResult.ok).toBe(true);
    expect(collectedEvents.some((event) => event.type === "TransferModeCancelled")).toBe(
      true,
    );
    expect(collectedEvents.some((event) => event.type === "ConsultationCallFailed")).toBe(
      false,
    );

    let transferProjection = initialTransferProjection();
    let multiLineProjection = initialMultiLineCallProjection();
    for (const event of collectedEvents) {
      transferProjection = reduceTransferProjection(transferProjection, event);
      multiLineProjection = reduceMultiLineCallProjection(multiLineProjection, event);
    }

    expect(
      resolveTransferFailureMessage(transferProjection, multiLineProjection.lastFailureReason),
    ).toBeNull();

    const restartResult = engine.startTransferMode({ callId: sourceCallId });
    expect(restartResult.ok).toBe(true);

    const restartEvent = [...collectedEvents]
      .reverse()
      .find((event) => event.type === "TransferModeStarted");
    expect(restartEvent).toBeDefined();
    if (restartEvent === undefined) {
      return;
    }

    transferProjection = reduceTransferProjection(transferProjection, restartEvent);
    expect(
      resolveTransferFailureMessage(transferProjection, multiLineProjection.lastFailureReason),
    ).toBeNull();
  });
});

function createEngine(
  telephony: MockTelephonyGateway,
  events: InMemoryDomainEventBus = new InMemoryDomainEventBus(),
): CallEngine {
  return new CallEngine(
    telephony,
    new MockMediaGateway(),
    new InMemorySettingsRepository(),
    events,
    createTestLogger(),
  );
}
