import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "@application/services/CallEngine.js";
import {
  InMemorySettingsRepository,
  MockMediaGateway,
  MockTelephonyGateway,
} from "@adapters/index.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { HangupCallUseCase } from "./HangupCallUseCase.js";
import { HoldCallUseCase } from "./HoldCallUseCase.js";
import { MuteCallUseCase } from "./MuteCallUseCase.js";
import { ResumeCallUseCase } from "./ResumeCallUseCase.js";
import { UnmuteCallUseCase } from "./UnmuteCallUseCase.js";

describe("Active call controls use cases", () => {
  it("executes hold and resume flow", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = createEngine(telephony, new MockMediaGateway());
    const makeResult = await engine.makeCall({
      callId: createCallId("call-hold-1"),
      phoneNumber: createPhoneNumber("+12025550101"),
    });
    expect(makeResult.ok).toBe(true);

    const holdUseCase = new HoldCallUseCase(engine, createTestLogger());
    const holdResult = await holdUseCase.execute({ callId: createCallId("call-hold-1") });
    expect(holdResult.ok).toBe(true);

    const resumeUseCase = new ResumeCallUseCase(engine, createTestLogger());
    const resumeResult = await resumeUseCase.execute({
      callId: createCallId("call-hold-1"),
    });
    expect(resumeResult.ok).toBe(true);
  });

  it("executes mute and unmute flow", async () => {
    const engine = createEngine(
      new MockTelephonyGateway({ makeCallScenario: "answered" }),
      new MockMediaGateway(),
    );
    await engine.makeCall({
      callId: createCallId("call-mute-1"),
      phoneNumber: createPhoneNumber("+12025550102"),
    });

    const muteUseCase = new MuteCallUseCase(engine, createTestLogger());
    const muteResult = await muteUseCase.execute({ callId: createCallId("call-mute-1") });
    expect(muteResult.ok).toBe(true);

    const unmuteUseCase = new UnmuteCallUseCase(engine, createTestLogger());
    const unmuteResult = await unmuteUseCase.execute({
      callId: createCallId("call-mute-1"),
    });
    expect(unmuteResult.ok).toBe(true);
  });

  it("publishes ActiveCallControlFailed when hold gateway rejects command", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    telephony.setHoldScenario("failure");
    const events = new InMemoryDomainEventBus();
    const publishedEvents: Array<{ type: string; operation?: unknown }> = [];
    events.subscribe((event) => {
      publishedEvents.push({
        type: event.type,
        operation: event["operation"],
      });
    });
    const engine = createEngine(telephony, new MockMediaGateway(), events);
    await engine.makeCall({
      callId: createCallId("call-hold-fail-1"),
      phoneNumber: createPhoneNumber("+12025550104"),
    });

    const holdUseCase = new HoldCallUseCase(engine, createTestLogger());
    const holdResult = await holdUseCase.execute({
      callId: createCallId("call-hold-fail-1"),
    });

    expect(holdResult.ok).toBe(false);
    expect(publishedEvents).toContainEqual({
      type: "ActiveCallControlFailed",
      operation: "hold",
    });
  });

  it("hangs up active call", async () => {
    const telephony = new MockTelephonyGateway({ makeCallScenario: "answered" });
    const engine = createEngine(telephony, new MockMediaGateway());
    await engine.makeCall({
      callId: createCallId("call-end-1"),
      phoneNumber: createPhoneNumber("+12025550103"),
    });

    const hangupUseCase = new HangupCallUseCase(engine, createTestLogger());
    const hangupResult = await hangupUseCase.execute({ callId: createCallId("call-end-1") });
    expect(hangupResult.ok).toBe(true);
    expect(telephony.getHangupCalls()).toEqual(["call-end-1"]);
  });
});

function createEngine(
  telephonyGateway: MockTelephonyGateway,
  mediaGateway: MockMediaGateway,
  eventPublisher: InMemoryDomainEventBus = new InMemoryDomainEventBus(),
): CallEngine {
  return new CallEngine(
    telephonyGateway,
    mediaGateway,
    new InMemorySettingsRepository(),
    eventPublisher,
    createTestLogger(),
  );
}
