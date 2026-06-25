import { describe, expect, it } from "vitest";
import { CallEngine } from "@application/services/CallEngine.js";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import {
  initialMultiCallProjection,
  reduceMultiCallProjection,
} from "@application/projections/multiCallProjection.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("MultiCallCompleteness integration", () => {
  it("LF-021 holds established call before incoming answer", async () => {
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
        multiCallSettings: { multiSessionsEnabled: true },
        phoneStatus: "online",
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("active-a"),
      phoneNumber: createPhoneNumber("+12025550200"),
    });

    const incomingId = createCallId("incoming-b");
    await engine.handleIncomingReceived({
      notification: {
        callId: incomingId,
        remoteNumber: "+12025550201",
        correlationId: createCorrelationId(),
      },
    });

    const answerResult = await engine.answerCall({ callId: incomingId });
    expect(answerResult.ok).toBe(true);
    expect(publishedTypes).toContain("AllOtherCallsHeld");
    expect(telephony.getHeldCalls()).toContain("active-a");
    expect(telephony.getAnsweredCalls()).toContain("incoming-b");
  });

  it("A3 auto-rejects second incoming with 486 when multi-sessions disabled", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const events = new InMemoryDomainEventBus();
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: false },
        phoneStatus: "online",
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("established"),
      phoneNumber: createPhoneNumber("+12025550202"),
    });

    const incomingId = createCallId("second-incoming");
    const incomingResult = await engine.handleIncomingReceived({
      notification: {
        callId: incomingId,
        remoteNumber: "+12025550203",
        correlationId: createCorrelationId(),
      },
    });

    expect(incomingResult.ok).toBe(true);
    expect(telephony.getRejectedCalls()).toEqual(
      expect.arrayContaining([expect.objectContaining({ callId: "second-incoming", sipCode: 486 })]),
    );
  });

  it("A1 blocks second dial while connecting", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "connecting" });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
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
      callId: createCallId("connecting-line"),
      phoneNumber: createPhoneNumber("+12025550204"),
    });

    const blocked = await engine.makeCall({
      callId: createCallId("blocked-line"),
      phoneNumber: createPhoneNumber("+12025550205"),
    });

    expect(blocked.ok).toBe(false);
    expect(publishedTypes).toContain("MultiCallOperationRejected");
    expect(publishedTypes.filter((type) => type === "OutgoingCallRequested")).toHaveLength(1);
  });

  it("maps MultiCallOperationRejected to lastPolicyViolation projection", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "connecting" });
    const events = new InMemoryDomainEventBus();
    let projection = initialMultiCallProjection({ multiSessionsEnabled: true });
    events.subscribe((event) => {
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
      callId: createCallId("proj-connecting"),
      phoneNumber: createPhoneNumber("+12025550206"),
    });
    await engine.makeCall({
      callId: createCallId("proj-blocked"),
      phoneNumber: createPhoneNumber("+12025550207"),
    });

    expect(projection.lastPolicyViolation).not.toBeNull();
    expect(projection.lastPolicyViolation?.scenario).toBe("connecting_in_progress");
  });
});
