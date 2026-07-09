import { describe, expect, it } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { MediaGateway } from "@ports/index.js";
import { attachRemoteAudioWhenReady } from "./remoteAudioAttach.js";

describe("attachRemoteAudioWhenReady", () => {
  it("publishes RemoteAudioAttached only when media gateway wires stream", async () => {
    const events = new InMemoryDomainEventBus();
    const publishedTypes: string[] = [];
    events.subscribe((event) => {
      publishedTypes.push(event.type);
    });

    let attempts = 0;
    const media: MediaGateway = {
      attachRemoteAudio: (command) => {
        void command;
        attempts += 1;
        return Promise.resolve(attempts === 1 ? ok("deferred") : ok("attached"));
      },
      bindCallVideoSurfaces: () => Promise.resolve(ok(undefined)),
      playRingbackTone: () => Promise.resolve(ok(undefined)),
      playIncomingRingtone: () => Promise.resolve(ok(undefined)),
      playRingtone: () => Promise.resolve(ok(undefined)),
      playBusyTone: () => Promise.resolve(ok(undefined)),
      playFailedTone: () => Promise.resolve(ok(undefined)),
      stopTone: () => Promise.resolve(ok(undefined)),
      stopRingtone: () => Promise.resolve(ok(undefined)),
      muteCall: () => Promise.resolve(ok(undefined)),
      unmuteCall: () => Promise.resolve(ok(undefined)),
      releaseAll: () => Promise.resolve(ok(undefined)),
    };

    const callId = createCallId("remote-audio-retry");
    const correlationId = createCorrelationId();

    const firstAttach = await attachRemoteAudioWhenReady(
      { mediaGateway: media, eventPublisher: events },
      callId,
      correlationId,
    );
    expect(firstAttach).toBe(false);
    expect(publishedTypes).not.toContain("RemoteAudioAttached");

    const secondAttach = await attachRemoteAudioWhenReady(
      { mediaGateway: media, eventPublisher: events },
      callId,
      correlationId,
    );
    expect(secondAttach).toBe(true);
    expect(publishedTypes).toContain("RemoteAudioAttached");
  });
});
