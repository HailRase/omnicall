import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/telephony/CallEngine.js";
import {
  ArbiterMediaGateway,
  InMemorySettingsRepository,
  MockTelephonyGateway,
  MockMediaGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

function createIncomingSettingsRepository(
  multiSessionsEnabled: boolean,
): InMemorySettingsRepository {
  return new InMemorySettingsRepository({
    phoneStatus: "online",
    incomingCallSettings: {
      autoAnswerTimeoutSec: null,
      autoAnswerDuringActiveSessionEnabled: false,
      rejectReasonRequired: false,
      allowedBreakReasons: [],
    },
    multiCallSettings: { multiSessionsEnabled },
  });
}

describe("ArbiterMediaGateway with CallEngine", () => {
  it("keeps incoming ringtone when an active outbound line ends during ringing", async () => {
    const delegate = new MockMediaGateway();
    const media = new ArbiterMediaGateway(delegate);
    const engine = new CallEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
      media,
      createIncomingSettingsRepository(true),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const outbound = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });
    expect(outbound.ok).toBe(true);
    if (!outbound.ok) {
      return;
    }

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-priority"),
        remoteNumber: "+12025550148",
        correlationId: createCorrelationId(),
      },
    });

    await engine.hangupCall({ callId: outbound.value.id });

    expect(delegate.isIncomingRingtonePlaying("incoming-priority")).toBe(true);
    expect(delegate.isRingbackPlaying(outbound.value.id)).toBe(false);
  });

  it("plays only one ringtone when two incoming calls are ringing", async () => {
    const delegate = new MockMediaGateway();
    const media = new ArbiterMediaGateway(delegate);
    const engine = new CallEngine(
      new MockTelephonyGateway(),
      media,
      createIncomingSettingsRepository(true),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-a"),
        remoteNumber: "+12025550148",
        correlationId: createCorrelationId(),
      },
    });
    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-b"),
        remoteNumber: "+12025550149",
        correlationId: createCorrelationId(),
      },
    });

    expect(delegate.isIncomingRingtonePlaying("incoming-a")).toBe(true);
    expect(delegate.isIncomingRingtonePlaying("incoming-b")).toBe(false);
  });
});
