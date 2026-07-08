import { describe, expect, it, vi } from "vitest";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  InMemorySettingsRepository,
  MockHostIntegrationGateway,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("IncomingCallFlow integration", () => {
  it("maps incoming adapter event to domain event and ringtone", async () => {
    const telephony = new MockTelephonyGateway();
    const media = new MockMediaGateway();
    const facade = createFacade({
      telephony,
      media,
      settings: new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
    });
    const events: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      events.push(event.type);
    });

    await telephony.simulateIncomingCall({
      callId: createCallId("incoming-it-1"),
      remoteNumber: "+12025550151",
      correlationId: createCorrelationId(),
    });

    expect(events).toContain("IncomingCallReceived");
    expect(events).toContain("IncomingRingtoneStarted");
    expect(media.isIncomingRingtonePlaying("incoming-it-1")).toBe(true);
  });

  it("answers and rejects incoming through gateway methods", async () => {
    const telephony = new MockTelephonyGateway();
    const facade = createFacade({
      telephony,
      media: new MockMediaGateway(),
      settings: new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: true,
          allowedBreakReasons: ["break"],
        },
      }),
    });
    const answerCallId = createCallId("incoming-it-2");
    await telephony.simulateIncomingCall({
      callId: answerCallId,
      remoteNumber: "+12025550152",
      correlationId: createCorrelationId(),
    });
    await facade.answerCall(answerCallId);
    expect(telephony.getAnsweredCalls()).toContain("incoming-it-2");

    const rejectCallId = createCallId("incoming-it-3");
    await telephony.simulateIncomingCall({
      callId: rejectCallId,
      remoteNumber: "+12025550153",
      correlationId: createCorrelationId(),
    });
    await facade.rejectCall(rejectCallId, "break");
    expect(telephony.getRejectedCalls()[0]?.callId).toBe("incoming-it-3");
  });

  it("auto-rejects with 486 in dnd mode", async () => {
    const telephony = new MockTelephonyGateway();
    const facade = createFacade({
      telephony,
      media: new MockMediaGateway(),
      settings: new InMemorySettingsRepository({
        phoneStatus: "dnd",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
    });

    await telephony.simulateIncomingCall({
      callId: createCallId("incoming-it-4"),
      remoteNumber: "+12025550154",
      correlationId: createCorrelationId(),
    });

    expect(telephony.getRejectedCalls()).toEqual([
      { callId: "incoming-it-4", sipCode: 486, reason: undefined },
    ]);
    expect(facade).toBeDefined();
  });

  it("emits host integration event for reject reason", async () => {
    const telephony = new MockTelephonyGateway();
    const host = new MockHostIntegrationGateway();
    const facade = createFacade({
      telephony,
      media: new MockMediaGateway(),
      settings: new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: true,
          allowedBreakReasons: ["break"],
        },
      }),
      host,
    });

    const callId = createCallId("incoming-it-5");
    await telephony.simulateIncomingCall({
      callId,
      remoteNumber: "+12025550155",
      correlationId: createCorrelationId(),
    });
    await facade.rejectCall(callId, "break");

    expect(host.getEmittedBreakReasons()[0]?.breakReason).toBe("break");
  });

  it("recovers projection when incoming ended before answer", async () => {
    const telephony = new MockTelephonyGateway();
    const facade = createFacade({
      telephony,
      media: new MockMediaGateway(),
      settings: new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
    });
    const events: string[] = [];
    facade.eventPublisher.subscribe((event) => {
      events.push(event.type);
    });

    await telephony.simulateIncomingCall({
      callId: createCallId("incoming-it-6"),
      remoteNumber: "+12025550156",
      correlationId: createCorrelationId(),
    });
    await telephony.simulateCallEnded({
      callId: createCallId("incoming-it-6"),
      correlationId: createCorrelationId(),
    });

    expect(events).toContain("IncomingCallEndedBeforeAnswer");
  });

  it("auto-answers incoming call by timeout", async () => {
    vi.useFakeTimers();
    const telephony = new MockTelephonyGateway();
    createFacade({
      telephony,
      media: new MockMediaGateway(),
      settings: new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: 1,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
    });

    await telephony.simulateIncomingCall({
      callId: createCallId("incoming-it-7"),
      remoteNumber: "+12025550157",
      correlationId: createCorrelationId(),
    });
    await vi.advanceTimersByTimeAsync(1100);

    expect(telephony.getAnsweredCalls()).toContain("incoming-it-7");
    vi.useRealTimers();
  });
});

type FacadeInput = Readonly<{
  telephony: MockTelephonyGateway;
  media: MockMediaGateway;
  settings: InMemorySettingsRepository;
  host?: MockHostIntegrationGateway;
}>;

function createFacade(input: FacadeInput): AccountBootstrapFacade {
  const deps = {    telephonyGateway: input.telephony,
    mediaGateway: input.media,
    settingsRepository: input.settings,
    logger: createTestLogger(),
  };
  if (input.host === undefined) {
    return new AccountBootstrapFacade(deps);
  }
  return new AccountBootstrapFacade({
    ...deps,
    hostIntegrationGateway: input.host,
  });
}
