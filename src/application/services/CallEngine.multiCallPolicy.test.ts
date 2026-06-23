import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import {
  initialMultiCallProjection,
  reduceMultiCallProjection,
} from "@application/projections/multiCallProjection.js";
import { CallEngine } from "./CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("CallEngine multi-call policy", () => {
  it("LF-021 holds established calls before new outgoing dial", async () => {
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: true },
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("call-a"),
      phoneNumber: createPhoneNumber("+12025550160"),
    });

    const secondResult = await engine.makeCall({
      callId: createCallId("call-b"),
      phoneNumber: createPhoneNumber("+12025550161"),
    });

    expect(secondResult.ok).toBe(true);
    expect(publishedTypes).toContain("AllOtherCallsHeld");
    expect(publishedTypes).toContain("CallHeld");
    expect(telephony.getHeldCalls()).toContain("call-a");
  });

  it("LF-032 blocks second outgoing when multi-sessions disabled", async () => {
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = new CallEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: false },
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("call-c"),
      phoneNumber: createPhoneNumber("+12025550162"),
    });

    const blocked = await engine.makeCall({
      callId: createCallId("call-d"),
      phoneNumber: createPhoneNumber("+12025550163"),
    });

    expect(blocked.ok).toBe(false);
    expect(publishedTypes).toContain("SecondSessionBlocked");
    expect(publishedTypes.filter((type) => type === "OutgoingCallRequested")).toHaveLength(1);
  });

  it("LF-032 blocks incoming answer when multi-sessions disabled and call active", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        phoneStatus: "online",
        multiCallSettings: { multiSessionsEnabled: false },
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("active-incoming"),
      phoneNumber: createPhoneNumber("+12025550164"),
    });

    const incomingId = createCallId("incoming-blocked");
    await engine.handleIncomingReceived({
      notification: {
        callId: incomingId,
        remoteNumber: "+12025550165",
        correlationId: createCorrelationId(),
      },
    });

    const answerResult = await engine.answerCall({ callId: incomingId });
    expect(answerResult.ok).toBe(false);
    expect(publishedTypes).toContain("SecondSessionBlocked");
    expect(telephony.getAnsweredCalls()).not.toContain("incoming-blocked");
  });

  it("LF-023 holds other active calls before exclusive resume", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: true },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("line-1"),
      phoneNumber: createPhoneNumber("+12025550166"),
    });
    await engine.makeCall({
      callId: createCallId("line-2"),
      phoneNumber: createPhoneNumber("+12025550167"),
    });

    const resumeResult = await engine.resumeCall({ callId: createCallId("line-1") });
    expect(resumeResult.ok).toBe(true);
    expect(telephony.getHeldCalls()).toContain("line-2");
  });

  it("rolls back hold-all on gateway failure without starting outgoing dial", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    let projection = initialMultiCallProjection({ multiSessionsEnabled: true });
    events.subscribe((event) => {
      publishedTypes.push(event.type);
      projection = reduceMultiCallProjection(projection, event);
    });

    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: true },
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("hold-fail-a"),
      phoneNumber: createPhoneNumber("+12025550168"),
    });

    telephony.setHoldScenario("failure");

    const secondResult = await engine.makeCall({
      callId: createCallId("hold-fail-b"),
      phoneNumber: createPhoneNumber("+12025550169"),
    });

    expect(secondResult.ok).toBe(false);
    expect(publishedTypes).toContain("AllOtherCallsHeld");
    expect(
      publishedTypes.filter((type) => type === "OutgoingCallRequested"),
    ).toHaveLength(1);
    expect(projection.holdAllInProgress).toBe(false);
    expect(projection.isSecondSessionDisabled).toBe(false);
  });
});
