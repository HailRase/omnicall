import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { CallEngine } from "./CallEngine.js";
import { MockMediaGateway, MockTelephonyGateway } from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { createPhoneNumber } from "@domain/index.js";

describe("CallEngine", () => {
  it("handles progress 183 and enables ringback tone", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "progress_183",
    });

    const engine = new CallEngine(telephony, media, events, createTestLogger());
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

    const engine = new CallEngine(telephony, media, events, createTestLogger());
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

    const engine = new CallEngine(telephony, media, events, createTestLogger());
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });

    expect(result.ok).toBe(false);
    expect(failedReason).toBe("busy");
    expect(media.isBusyTonePlaying(failedCallId)).toBe(true);
    expect(media.getFailureTones().length).toBe(0);
  });

  it("maps rejected failures to failed tone", async () => {
    const events = new InMemoryDomainEventBus();
    const media = new MockMediaGateway();
    const telephony = new MockTelephonyGateway({
      makeCallScenario: "failed_rejected",
    });
    const engine = new CallEngine(telephony, media, events, createTestLogger());
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
    const engine = new CallEngine(telephony, media, events, createTestLogger());
    const result = await engine.makeCall({
      phoneNumber: createPhoneNumber("+12025550147"),
    });
    expect(result.ok).toBe(false);
    expect(media.getFailureTones().length).toBe(1);
  });
});

