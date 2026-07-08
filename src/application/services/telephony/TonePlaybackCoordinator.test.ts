import { describe, expect, it } from "vitest";
import { MockMediaGateway } from "@adapters/index.js";
import { TonePlaybackCoordinator } from "./TonePlaybackCoordinator.js";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("TonePlaybackCoordinator", () => {
  it("plays only incoming ringtone when ringback is also requested", async () => {
    const delegate = new MockMediaGateway();
    const coordinator = new TonePlaybackCoordinator(delegate);
    const correlationId = createCorrelationId();

    await coordinator.playRingbackTone({
      callId: createCallId("outbound"),
      correlationId,
    });
    await coordinator.playIncomingRingtone({
      callId: createCallId("incoming"),
      correlationId,
    });

    expect(delegate.isRingbackPlaying("outbound")).toBe(false);
    expect(delegate.isIncomingRingtonePlaying("incoming")).toBe(true);
    expect(coordinator.getActivePlayback()).toEqual({
      callId: createCallId("incoming"),
      kind: "ringtone",
    });
  });

  it("resumes ringback after incoming ringtone is released", async () => {
    const delegate = new MockMediaGateway();
    const coordinator = new TonePlaybackCoordinator(delegate);
    const correlationId = createCorrelationId();
    const outboundId = createCallId("outbound");
    const incomingId = createCallId("incoming");

    await coordinator.playRingbackTone({ callId: outboundId, correlationId });
    await coordinator.playIncomingRingtone({ callId: incomingId, correlationId });
    await coordinator.stopTone({ callId: incomingId, correlationId });

    expect(delegate.isIncomingRingtonePlaying("incoming")).toBe(false);
    expect(delegate.isRingbackPlaying("outbound")).toBe(true);
    expect(coordinator.getActivePlayback()).toEqual({
      callId: outboundId,
      kind: "ringback",
    });
  });

  it("plays only the earliest incoming ringtone when two lines ring", async () => {
    const delegate = new MockMediaGateway();
    const coordinator = new TonePlaybackCoordinator(delegate);
    const correlationId = createCorrelationId();
    const firstIncoming = createCallId("incoming-a");
    const secondIncoming = createCallId("incoming-b");

    await coordinator.playIncomingRingtone({ callId: firstIncoming, correlationId });
    await coordinator.playIncomingRingtone({ callId: secondIncoming, correlationId });

    expect(delegate.isIncomingRingtonePlaying("incoming-a")).toBe(true);
    expect(delegate.isIncomingRingtonePlaying("incoming-b")).toBe(false);
  });

  it("switches to the second incoming ringtone after the first is answered", async () => {
    const delegate = new MockMediaGateway();
    const coordinator = new TonePlaybackCoordinator(delegate);
    const correlationId = createCorrelationId();
    const firstIncoming = createCallId("incoming-a");
    const secondIncoming = createCallId("incoming-b");

    await coordinator.playIncomingRingtone({ callId: firstIncoming, correlationId });
    await coordinator.playIncomingRingtone({ callId: secondIncoming, correlationId });
    await coordinator.stopTone({ callId: firstIncoming, correlationId });

    expect(delegate.isIncomingRingtonePlaying("incoming-a")).toBe(false);
    expect(delegate.isIncomingRingtonePlaying("incoming-b")).toBe(true);
  });

  it("clears all pending requests on releaseAll", async () => {
    const delegate = new MockMediaGateway();
    const coordinator = new TonePlaybackCoordinator(delegate);
    const correlationId = createCorrelationId();

    await coordinator.playIncomingRingtone({
      callId: createCallId("incoming"),
      correlationId,
    });
    await coordinator.releaseAll({ correlationId });

    expect(delegate.isIncomingRingtonePlaying("incoming")).toBe(false);
    expect(coordinator.getPendingRequestCount()).toBe(0);
    expect(coordinator.getActivePlayback()).toBeNull();
    expect(delegate.getReleaseAllInvocations()).toBe(1);
  });
});
