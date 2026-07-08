import { describe, expect, it, vi } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import type { DomainEvent } from "@domain/index.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "@application/projections/telephony/multiLineCallProjection.js";
import { CallEngine } from "./CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";

describe("CallEngine remote hold", () => {
  it("publishes CallRemoteHeld when adapter reports remote hold", async () => {
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
    telephony.setRemoteHoldHandler((notification) => {
      engine.handleRemoteHold(notification.callId, notification.correlationId);
      return Promise.resolve();
    });
    telephony.setRemoteResumeHandler((notification) =>
      engine.handleRemoteResume(notification.callId, notification.correlationId),
    );
    const callId = createCallId("remote-hold-1");
    const correlationId = createCorrelationId();

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550921"),
    });

    await telephony.simulateRemoteHold({ callId, correlationId });

    expect(collectedEvents.some((event) => event.type === "CallRemoteHeld")).toBe(true);

    let multiLineProjection = initialMultiLineCallProjection();
    for (const event of collectedEvents) {
      multiLineProjection = reduceMultiLineCallProjection(multiLineProjection, event);
    }

    const line = multiLineProjection.lines.find((entry) => entry.callId === callId);
    expect(line?.state).toBe("Active");
    expect(line?.isRemoteHold).toBe(true);
  });

  it("publishes CallRemoteResumed when adapter reports remote resume", async () => {
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
    telephony.setRemoteHoldHandler((notification) => {
      engine.handleRemoteHold(notification.callId, notification.correlationId);
      return Promise.resolve();
    });
    telephony.setRemoteResumeHandler((notification) =>
      engine.handleRemoteResume(notification.callId, notification.correlationId),
    );
    const callId = createCallId("remote-resume-1");
    const correlationId = createCorrelationId();

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550922"),
    });
    await telephony.simulateRemoteHold({ callId, correlationId });
    await telephony.simulateRemoteResume({ callId, correlationId });

    expect(collectedEvents.some((event) => event.type === "CallRemoteResumed")).toBe(true);

    let multiLineProjection = initialMultiLineCallProjection();
    for (const event of collectedEvents) {
      multiLineProjection = reduceMultiLineCallProjection(multiLineProjection, event);
    }

    const line = multiLineProjection.lines.find((entry) => entry.callId === callId);
    expect(line?.isRemoteHold).toBe(false);
  });

  it("reapplies media mute after remote resume when call is muted", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const media = new MockMediaGateway();
    const muteSpy = vi.spyOn(media, "muteCall");
    const events = new InMemoryDomainEventBus();
    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const callId = createCallId("remote-resume-muted");
    const correlationId = createCorrelationId();

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550923"),
    });
    const muteResult = await engine.muteCall({ callId });
    expect(muteResult.ok).toBe(true);

    muteSpy.mockClear();

    await engine.handleRemoteResume(callId, correlationId);

    expect(muteSpy).toHaveBeenCalledTimes(1);
    expect(muteSpy).toHaveBeenCalledWith({ callId, correlationId });
    expect(media.isMuted(callId)).toBe(true);
  });
});
