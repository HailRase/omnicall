import { describe, expect, it, vi } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import type { DomainEvent } from "@domain/index.js";
import { CallEngine } from "./CallEngine.js";
import {
  InMemorySettingsRepository,
  MockHostIntegrationGateway,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("CallEngine", () => {
  it("activates outbound call on deferred answer after progress 180", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "progress_180",
    });

    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.state).toBe("Ringing");
    expect(media.isRingbackPlaying(result.value.id)).toBe(true);

    await engine.handleOutboundCallAnswered(result.value.id);

    expect(media.isRingbackPlaying(result.value.id)).toBe(false);
    expect(media.isRemoteAudioAttached(result.value.id)).toBe(true);
  });

  it("handles progress 183 and enables ringback tone", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "progress_183",
    });

    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.state).toBe("Ringing");
    expect(media.isRingbackPlaying(result.value.id)).toBe(true);
  });

  it("attaches remote audio for answered outgoing calls", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
    });

    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.state).toBe("Active");
    expect(media.isRemoteAudioAttached(result.value.id)).toBe(true);
  });

  it("plays busy tone for busy failures", async () => {
    vi.useFakeTimers();
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "failed_busy",
    });
    let failedReason = "";
    let failedCallId = "";

    events.subscribe((event) => {
      if (event.type === "CallFailed") {
        const reason = event["reason"];
        failedReason = typeof reason === "string" ? reason : "";
        const callId = event["callId"];
        failedCallId = typeof callId === "string" ? callId : "";
      }
    });

    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });

    expect(result.ok).toBe(false);
    expect(failedReason).toBe("busy");
    expect(media.isBusyTonePlaying(failedCallId)).toBe(true);
    expect(media.getFailureTones().length).toBe(0);

    await vi.advanceTimersByTimeAsync(3_000);

    expect(media.isBusyTonePlaying(failedCallId)).toBe(false);
    vi.useRealTimers();
  });

  it("rejects outbound makeCall before events when SIP is not registered", async () => {
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
    });
    await telephony.unregister(createCorrelationId());

    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("1"),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe("SIP not registered for outbound call");
    expect(telephony.getMakeCallCommands()).toHaveLength(0);
    expect(publishedTypes).not.toContain("OutgoingCallRequested");
    expect(publishedTypes).not.toContain("CallFailed");
  });

  it("maps rejected failures to failed tone", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "failed_rejected",
    });
    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });
    expect(result.ok).toBe(false);
    expect(media.getFailureTones().length).toBe(1);
  });

  it("maps unavailable failures to failed tone", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "failed_unavailable",
    });
    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });
    expect(result.ok).toBe(false);
    expect(media.getFailureTones().length).toBe(1);
  });

  it("maps incoming event to IncomingCallReceived and starts ringtone", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway();
    let receivedEventSeen = false;
    events.subscribe((event) => {
      if (event.type === "IncomingCallReceived") {
        receivedEventSeen = true;
      }
    });

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
      }),
      events,
      createTestLogger(),
    );

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-1"),
        remoteNumber: "+12025550100",
        correlationId: createCorrelationId(),
      },
    });

    expect(receivedEventSeen).toBe(true);
    expect(media.isIncomingRingtonePlaying("incoming-1")).toBe(true);
  });

  it("auto-rejects with 486 in dnd mode", async () => {
    const telephony = new MockTelephonyGateway();
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        phoneStatus: "dnd",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-2"),
        remoteNumber: "+12025550111",
        correlationId: createCorrelationId(),
      },
    });

    expect(telephony.getRejectedCalls()).toEqual([
      { callId: "incoming-2", sipCode: 486, reason: undefined },
    ]);
  });

  it("emits host integration event for reject reason", async () => {
    const hostIntegration = new MockHostIntegrationGateway();
    const engine = new CallEngine(
      new MockTelephonyGateway(),
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: null,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: true,
          allowedBreakReasons: [],
        },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
      hostIntegration,
    );

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-3"),
        remoteNumber: "+12025550112",
        correlationId: createCorrelationId(),
      },
    });
    await engine.rejectCall({
      callId: createCallId("incoming-3"),
      breakReason: "break",
    });

    expect(hostIntegration.getEmittedBreakReasons()[0]?.breakReason).toBe("break");
  });

  it("cleans auto-answer timer when call is rejected manually", async () => {
    vi.useFakeTimers();
    const telephony = new MockTelephonyGateway();
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: 2,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const callId = createCallId("incoming-4");
    await engine.handleIncomingReceived({
      notification: {
        callId,
        remoteNumber: "+12025550113",
        correlationId: createCorrelationId(),
      },
    });
    await engine.rejectCall({ callId });
    await vi.advanceTimersByTimeAsync(2100);

    expect(telephony.getAnsweredCalls()).toHaveLength(0);
    vi.useRealTimers();
  });

  it("auto-answers call on timeout", async () => {
    vi.useFakeTimers();
    const telephony = new MockTelephonyGateway();
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: 1,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-5"),
        remoteNumber: "+12025550114",
        correlationId: createCorrelationId(),
      },
    });
    await vi.advanceTimersByTimeAsync(1100);

    expect(telephony.getAnsweredCalls()).toContain("incoming-5");
    vi.useRealTimers();
  });

  it("auto-answers while active session when busy policy is enabled", async () => {
    vi.useFakeTimers();
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
        incomingCallSettings: {
          autoAnswerTimeoutSec: 1,
          autoAnswerDuringActiveSessionEnabled: true,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("active-before-auto"),
      phoneNumber: createPhoneNumber("+12025550120"),
    });

    const incomingId = createCallId("incoming-auto-busy");
    await engine.handleIncomingReceived({
      notification: {
        callId: incomingId,
        remoteNumber: "+12025550121",
        correlationId: createCorrelationId(),
      },
    });
    await vi.advanceTimersByTimeAsync(1100);

    expect(telephony.getHeldCalls()).toContain("active-before-auto");
    expect(telephony.getAnsweredCalls()).toContain("incoming-auto-busy");
    expect(publishedTypes).toContain("CallAutoAnswered");
    vi.useRealTimers();
  });

  it("blocks auto-answer while active session when busy policy is disabled", async () => {
    vi.useFakeTimers();
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
        incomingCallSettings: {
          autoAnswerTimeoutSec: 1,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      events,
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("active-block-auto"),
      phoneNumber: createPhoneNumber("+12025550122"),
    });

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-blocked-auto"),
        remoteNumber: "+12025550123",
        correlationId: createCorrelationId(),
      },
    });
    await vi.advanceTimersByTimeAsync(1100);

    expect(telephony.getAnsweredCalls()).not.toContain("incoming-blocked-auto");
    expect(publishedTypes).toContain("MultiCallOperationRejected");
    vi.useRealTimers();
  });

  it("does not auto-answer while outgoing call is connecting", async () => {
    vi.useFakeTimers();
    const telephony = new MockTelephonyGateway({ makeCallScenario: "connecting" });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository({
        multiCallSettings: { multiSessionsEnabled: true },
        phoneStatus: "online",
        incomingCallSettings: {
          autoAnswerTimeoutSec: 1,
          autoAnswerDuringActiveSessionEnabled: true,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    await engine.makeCall({
      callId: createCallId("connecting-out"),
      phoneNumber: createPhoneNumber("+12025550124"),
    });

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-connecting-block"),
        remoteNumber: "+12025550125",
        correlationId: createCorrelationId(),
      },
    });
    await vi.advanceTimersByTimeAsync(1100);

    expect(telephony.getAnsweredCalls()).not.toContain("incoming-connecting-block");
    vi.useRealTimers();
  });

  it("does not schedule auto-answer for second incoming when busy policy is disabled", async () => {
    vi.useFakeTimers();
    const telephony = new MockTelephonyGateway();
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
        incomingCallSettings: {
          autoAnswerTimeoutSec: 2,
          autoAnswerDuringActiveSessionEnabled: false,
          rejectReasonRequired: false,
          allowedBreakReasons: [],
        },
      }),
      events,
      createTestLogger(),
    );

    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-first"),
        remoteNumber: "+12025550126",
        correlationId: createCorrelationId(),
      },
    });
    await engine.handleIncomingReceived({
      notification: {
        callId: createCallId("incoming-second"),
        remoteNumber: "+12025550127",
        correlationId: createCorrelationId(),
      },
    });
    await vi.advanceTimersByTimeAsync(2100);

    expect(telephony.getAnsweredCalls()).toContain("incoming-first");
    expect(telephony.getAnsweredCalls()).not.toContain("incoming-second");
    expect(
      publishedTypes.filter((type) => type === "MultiCallOperationRejected").length,
    ).toBeGreaterThanOrEqual(1);
    vi.useRealTimers();
  });

  it("fails answer in invalid state when incoming call is missing", async () => {
    const engine = new CallEngine(
      new MockTelephonyGateway(),
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const result = await engine.answerCall({ callId: createCallId("missing-call") });
    expect(result.ok).toBe(false);
  });

  it("projects selected media mode when answering an incoming call", async () => {
    const telephony = new MockTelephonyGateway();
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    const callId = createCallId("incoming-video");

    await engine.handleIncomingReceived({
      notification: {
        callId,
        remoteNumber: "+12025550130",
        correlationId: createCorrelationId(),
      },
    });
    const result = await engine.answerCall({ callId, mediaMode: "video" });

    expect(result.ok).toBe(true);
    expect(engine.getCallVideoMediaState(callId)?.mediaMode).toBe("video");
    expect(telephony.getAnswerCallCommands()[0]?.mediaMode).toBe("video");
  });

  it("downgrades outbound video call to audio when remote party has no video", async () => {
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
    const callId = createCallId("outbound-audio-only");

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550199"),
      mediaMode: "video",
    });

    expect(engine.getCallVideoMediaState(callId)?.mediaMode).toBe("video");

    engine.handleRemoteVideoPresence(callId, false, createCorrelationId());

    expect(engine.getCallVideoMediaState(callId)?.mediaMode).toBe("audio");
    expect(
      collectedEvents.some((event) => event.type === "CallDowngradedToAudioOnly"),
    ).toBe(true);
  });

  it("defers outbound downgrade until call is active when remote audio-only arrives early", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "connecting" });
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
    const callId = createCallId("outbound-audio-only-deferred");

    const makeResult = await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550188"),
      mediaMode: "video",
    });
    expect(makeResult.ok).toBe(true);
    expect(engine.getCallVideoMediaState(callId)?.mediaMode).toBe("video");

    engine.handleRemoteVideoPresence(callId, false, createCorrelationId());
    expect(engine.getCallVideoMediaState(callId)?.mediaMode).toBe("video");
    expect(
      collectedEvents.some((event) => event.type === "CallDowngradedToAudioOnly"),
    ).toBe(false);

    await engine.handleOutboundCallAnswered(callId, createCorrelationId());

    expect(engine.getCallVideoMediaState(callId)?.mediaMode).toBe("audio");
    expect(
      collectedEvents.some((event) => event.type === "CallDowngradedToAudioOnly"),
    ).toBe(true);
  });

  it("projects remote video presence reported by telephony adapter", async () => {
    const engine = new CallEngine(
      new MockTelephonyGateway(),
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    const callId = createCallId("incoming-remote-video");
    await engine.handleIncomingReceived({
      notification: {
        callId,
        remoteNumber: "+12025550131",
        correlationId: createCorrelationId(),
      },
    });
    await engine.answerCall({ callId, mediaMode: "video" });

    engine.handleRemoteVideoPresence(callId, true, createCorrelationId());

    expect(engine.getCallVideoMediaState(callId)?.remoteVideoPresent).toBe(true);
  });

  it("does not downgrade outbound video call on media-track absence signal", async () => {
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
    const callId = createCallId("outbound-media-signal-only");

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550193"),
      mediaMode: "video",
    });

    engine.handleRemoteVideoPresenceFromMedia(callId, false, createCorrelationId());

    expect(engine.getCallVideoMediaState(callId)?.mediaMode).toBe("video");
    expect(
      collectedEvents.some((event) => event.type === "CallDowngradedToAudioOnly"),
    ).toBe(false);
  });

  it("fails reject in invalid state when incoming call is missing", async () => {
    const engine = new CallEngine(
      new MockTelephonyGateway(),
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );

    const result = await engine.rejectCall({ callId: createCallId("missing-call") });
    expect(result.ok).toBe(false);
  });

  it("holds and resumes active call", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-1"),
      phoneNumber: createPhoneNumber("+12025550150"),
    });

    const holdResult = await engine.holdCall({ callId: createCallId("active-1") });
    expect(holdResult.ok).toBe(true);
    if (!holdResult.ok) {
      return;
    }
    expect(holdResult.value.state).toBe("Held");

    const resumeResult = await engine.resumeCall({ callId: createCallId("active-1") });
    expect(resumeResult.ok).toBe(true);
    if (!resumeResult.ok) {
      return;
    }
    expect(resumeResult.value.state).toBe("Active");
  });

  it("reapplies media mute after local hold resume when call is muted", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const media = new MockMediaGateway();
    const muteSpy = vi.spyOn(media, "muteCall");
    const events = new InMemoryDomainEventBus();
    const collectedEvents: DomainEvent[] = [];
    events.subscribe((event) => {
      collectedEvents.push(event);
    });
    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    const callId = createCallId("hold-resume-muted");

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550152"),
    });
    const muteResult = await engine.muteCall({ callId });
    expect(muteResult.ok).toBe(true);

    muteSpy.mockClear();

    const holdResult = await engine.holdCall({ callId });
    expect(holdResult.ok).toBe(true);
    const resumeResult = await engine.resumeCall({ callId });
    expect(resumeResult.ok).toBe(true);

    expect(muteSpy).toHaveBeenCalledTimes(1);
    expect(muteSpy).toHaveBeenCalledWith({ callId, correlationId: expect.any(String) });
    expect(media.isMuted(callId)).toBe(true);
    expect(collectedEvents.some((event) => event.type === "CallUnmuted")).toBe(false);
  });

  it("does not reapply mute after local hold resume when call is not muted", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const media = new MockMediaGateway();
    const muteSpy = vi.spyOn(media, "muteCall");
    const engine = new CallEngine(
      telephony,
      media,
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    const callId = createCallId("hold-resume-unmuted");

    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550153"),
    });

    const holdResult = await engine.holdCall({ callId });
    expect(holdResult.ok).toBe(true);
    const resumeResult = await engine.resumeCall({ callId });
    expect(resumeResult.ok).toBe(true);

    expect(muteSpy).not.toHaveBeenCalled();
    expect(media.isMuted(callId)).toBe(false);
  });

  it("mutes and unmutes active call through media gateway", async () => {
    const media = new MockMediaGateway();
    const engine = new CallEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
      media,
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-2"),
      phoneNumber: createPhoneNumber("+12025550151"),
    });

    const muteResult = await engine.muteCall({ callId: createCallId("active-2") });
    expect(muteResult.ok).toBe(true);
    expect(media.isMuted("active-2")).toBe(true);

    const unmuteResult = await engine.unmuteCall({ callId: createCallId("active-2") });
    expect(unmuteResult.ok).toBe(true);
    expect(media.isMuted("active-2")).toBe(false);
  });

  it("hangs up active call", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-3"),
      phoneNumber: createPhoneNumber("+12025550152"),
    });

    const hangupResult = await engine.hangupCall({ callId: createCallId("active-3") });
    expect(hangupResult.ok).toBe(true);
    if (!hangupResult.ok) {
      return;
    }
    expect(hangupResult.value.state).toBe("Ended");
    expect(telephony.getHangupCalls()).toEqual(["active-3"]);
  });

  it("publishes CallEnded once when hangup also notifies session ended", async () => {
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "answered",
      hangupNotifiesEnded: true,
    });
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    telephony.setCallEndedHandler(async (notification) => {
      await engine.handleCallEnded(notification.callId, notification.correlationId);
    });

    const callId = createCallId("active-hangup-once");
    await engine.makeCall({
      callId,
      phoneNumber: createPhoneNumber("+12025550199"),
    });

    const hangupResult = await engine.hangupCall({ callId });
    expect(hangupResult.ok).toBe(true);
    expect(publishedTypes.filter((type) => type === "CallEnded")).toHaveLength(1);
    expect(publishedTypes).toContain("CallHangupRequested");
  });

  it("returns hold failure when gateway rejects command", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    telephony.setHoldScenario("failure");
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-4"),
      phoneNumber: createPhoneNumber("+12025550153"),
    });

    const holdResult = await engine.holdCall({ callId: createCallId("active-4") });
    expect(holdResult.ok).toBe(false);
    expect(publishedTypes).toContain("ActiveCallControlFailed");
  });

  it("keeps call active when hangup gateway fails", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    telephony.setHangupScenario("failure");
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      events,
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-5"),
      phoneNumber: createPhoneNumber("+12025550154"),
    });

    const hangupResult = await engine.hangupCall({ callId: createCallId("active-5") });
    expect(hangupResult.ok).toBe(false);
    expect(publishedTypes).not.toContain("CallHangupRequested");
    expect(publishedTypes).toContain("ActiveCallControlFailed");

    const holdResult = await engine.holdCall({ callId: createCallId("active-5") });
    expect(holdResult.ok).toBe(true);
    if (holdResult.ok) {
      expect(holdResult.value.state).toBe("Held");
    }
  });

  it("returns resume failure when gateway rejects command", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = new CallEngine(
      telephony,
      new MockMediaGateway(),
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-6"),
      phoneNumber: createPhoneNumber("+12025550155"),
    });
    await engine.holdCall({ callId: createCallId("active-6") });
    telephony.setResumeScenario("failure");

    const resumeResult = await engine.resumeCall({ callId: createCallId("active-6") });
    expect(resumeResult.ok).toBe(false);
  });

  it("returns mute failure when media gateway rejects command", async () => {
    const media = new MockMediaGateway();
    media.setScenario("failure");
    const engine = new CallEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
      media,
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-7"),
      phoneNumber: createPhoneNumber("+12025550156"),
    });

    const muteResult = await engine.muteCall({ callId: createCallId("active-7") });
    expect(muteResult.ok).toBe(false);
  });

  it("returns unmute failure when media gateway rejects command", async () => {
    const media = new MockMediaGateway();
    const engine = new CallEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
      media,
      new InMemorySettingsRepository(),
      new InMemoryDomainEventBus(),
      createTestLogger(),
    );
    await engine.makeCall({
      callId: createCallId("active-8"),
      phoneNumber: createPhoneNumber("+12025550157"),
    });
    await engine.muteCall({ callId: createCallId("active-8") });
    media.setScenario("failure");

    const unmuteResult = await engine.unmuteCall({ callId: createCallId("active-8") });
    expect(unmuteResult.ok).toBe(false);
  });
});

