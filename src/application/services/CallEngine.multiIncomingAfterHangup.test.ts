import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import {
  ArbiterMediaGateway,
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("CallEngine multi-incoming after hangup", () => {
  it("answers pending incoming after another established session is hung up", async () => {
    const delegate = new MockMediaGateway();
    const media = new ArbiterMediaGateway(delegate);
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
        multiCallSettings: { multiSessionsEnabled: true },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const firstIncomingId = createCallId("incoming-first");
    await engine.handleIncomingReceived({
      notification: {
        callId: firstIncomingId,
        remoteNumber: "+12025550148",
        correlationId: createCorrelationId(),
      },
    });

    const firstAnswer = await engine.answerCall({ callId: firstIncomingId });
    expect(firstAnswer.ok).toBe(true);

    const secondIncomingId = createCallId("incoming-second");
    await engine.handleIncomingReceived({
      notification: {
        callId: secondIncomingId,
        remoteNumber: "+12025550149",
        correlationId: createCorrelationId(),
      },
    });

    const hangupResult = await engine.hangupCall({ callId: firstIncomingId });
    expect(hangupResult.ok).toBe(true);

    const secondAnswer = await engine.answerCall({ callId: secondIncomingId });
    expect(secondAnswer.ok).toBe(true);
    expect(telephony.getAnsweredCalls()).toContain(secondIncomingId);
  });

  it("rejects pending incoming after another established session is hung up", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = new CallEngine(
      telephony,
      new ArbiterMediaGateway(new MockMediaGateway()),
      new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
        multiCallSettings: { multiSessionsEnabled: true },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const firstIncomingId = createCallId("incoming-first-reject");
    await engine.handleIncomingReceived({
      notification: {
        callId: firstIncomingId,
        remoteNumber: "+12025550150",
        correlationId: createCorrelationId(),
      },
    });
    await engine.answerCall({ callId: firstIncomingId });

    const secondIncomingId = createCallId("incoming-second-reject");
    await engine.handleIncomingReceived({
      notification: {
        callId: secondIncomingId,
        remoteNumber: "+12025550151",
        correlationId: createCorrelationId(),
      },
    });

    await engine.hangupCall({ callId: firstIncomingId });

    const rejectResult = await engine.rejectCall({ callId: secondIncomingId });
    expect(rejectResult.ok).toBe(true);
    expect(telephony.getRejectedCalls()).toEqual([
      { callId: secondIncomingId, sipCode: undefined, reason: undefined },
    ]);
  });
});
