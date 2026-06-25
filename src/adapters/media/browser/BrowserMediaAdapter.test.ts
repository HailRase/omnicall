// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { BrowserMediaAdapter } from "./BrowserMediaAdapter.js";
import type { BrowserMediaAdapterOptions } from "./BrowserMediaAdapter.js";
import { WebAudioTonePlayer } from "./WebAudioTonePlayer.js";

function createMockAudioContext(): AudioContext {
  return {
    state: "running",
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    destination: {},
    createGain: () => ({
      gain: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createOscillator: () => ({
      frequency: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
  } as unknown as AudioContext;
}

describe("BrowserMediaAdapter", () => {
  const rootElement = document.createElement("div");
  document.body.appendChild(rootElement);

  afterEach(() => {
    rootElement.replaceChildren();
    vi.restoreAllMocks();
  });

  function createAdapter(
    getPeerConnection: (callId: ReturnType<typeof createCallId>) => unknown = () => null,
    tonePlayer?: WebAudioTonePlayer,
  ): BrowserMediaAdapter {
    const options: BrowserMediaAdapterOptions =
      tonePlayer === undefined
        ? {
            logger: createTestLogger({ featureId: "F-005", boundedContext: "Media" }),
            getPeerConnection,
            rootElement,
          }
        : {
            logger: createTestLogger({ featureId: "F-005", boundedContext: "Media" }),
            getPeerConnection,
            rootElement,
            tonePlayer,
          };
    return new BrowserMediaAdapter(options);
  }

  it("plays and stops incoming ringtone", async () => {
    const tonePlayer = new WebAudioTonePlayer({
      createAudioContext: createMockAudioContext,
    });
    const adapter = createAdapter(() => null, tonePlayer);
    const callId = createCallId("call-ringtone");
    const correlationId = createCorrelationId();

    const playResult = await adapter.playRingtone({ callId, correlationId });
    expect(playResult.ok).toBe(true);
    expect(adapter.isTonePlaying(callId)).toBe(true);

    const stopResult = await adapter.stopRingtone({ callId, correlationId });
    expect(stopResult.ok).toBe(true);
    expect(adapter.isTonePlaying(callId)).toBe(false);

    adapter.dispose();
  });

  it("plays ringback and busy tones", async () => {
    const tonePlayer = new WebAudioTonePlayer({
      createAudioContext: createMockAudioContext,
    });
    const adapter = createAdapter(() => null, tonePlayer);
    const callId = createCallId("call-tones");
    const correlationId = createCorrelationId();

    expect((await adapter.playRingbackTone({ callId, correlationId })).ok).toBe(true);
    expect(adapter.isTonePlaying(callId)).toBe(true);

    expect((await adapter.stopTone({ callId, correlationId })).ok).toBe(true);
    expect(adapter.isTonePlaying(callId)).toBe(false);

    expect((await adapter.playBusyTone({ callId, correlationId })).ok).toBe(true);
    expect(adapter.isTonePlaying(callId)).toBe(true);

    adapter.dispose();
  });

  it("attaches remote audio to a hidden audio element", async () => {
    const playSpy = vi.spyOn(HTMLAudioElement.prototype, "play").mockResolvedValue(undefined);
    class TestMediaStream {
      private readonly tracks: MediaStreamTrack[];

      constructor(tracks: MediaStreamTrack[] = []) {
        this.tracks = [...tracks];
      }

      addTrack(track: MediaStreamTrack): void {
        this.tracks.push(track);
      }

      getTracks(): MediaStreamTrack[] {
        return this.tracks;
      }
    }

    vi.stubGlobal("MediaStream", TestMediaStream);

    const track = { kind: "audio", enabled: true } as MediaStreamTrack;
    const connection = {
      getReceivers: () => [{ track }],
      getSenders: () => [],
      addEventListener: vi.fn(),
    };

    const adapter = createAdapter(() => connection);
    const callId = createCallId("call-remote");
    const correlationId = createCorrelationId();

    const result = await adapter.attachRemoteAudio({ callId, correlationId });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("attached");
    }
    expect(adapter.isRemoteAudioElementAttached(callId)).toBe(true);

    const audioElement = rootElement.querySelector(`audio[data-call-id="${callId}"]`);
    expect(audioElement).not.toBeNull();
    expect(playSpy).toHaveBeenCalled();

    adapter.dispose();
  });

  it("pauses other lines when attaching exclusive active remote audio (C1)", async () => {
    const pauseSpy = vi.spyOn(HTMLAudioElement.prototype, "pause").mockImplementation(() => {});
    const playSpy = vi.spyOn(HTMLAudioElement.prototype, "play").mockResolvedValue(undefined);
    class TestMediaStream {
      private readonly tracks: MediaStreamTrack[];

      constructor(tracks: MediaStreamTrack[] = []) {
        this.tracks = [...tracks];
      }

      addTrack(track: MediaStreamTrack): void {
        this.tracks.push(track);
      }

      getTracks(): MediaStreamTrack[] {
        return this.tracks;
      }
    }

    vi.stubGlobal("MediaStream", TestMediaStream);

    const track = { kind: "audio", enabled: true } as MediaStreamTrack;
    const connection = {
      getReceivers: () => [{ track }],
      getSenders: () => [],
      addEventListener: vi.fn(),
    };

    const adapter = createAdapter(() => connection);
    const callIdA = createCallId("exclusive-a");
    const callIdB = createCallId("exclusive-b");
    const correlationId = createCorrelationId();

    await adapter.attachRemoteAudio({ callId: callIdA, correlationId });
    pauseSpy.mockClear();

    await adapter.attachRemoteAudio({ callId: callIdB, correlationId });

    expect(pauseSpy).toHaveBeenCalled();
    expect(adapter.isRemoteAudioStreamWired(callIdA)).toBe(true);
    expect(adapter.isRemoteAudioStreamWired(callIdB)).toBe(true);

    playSpy.mockRestore();
    pauseSpy.mockRestore();
    adapter.dispose();
  });

  it("returns deferred when peer connection is missing but still prepares audio element", async () => {
    const adapter = createAdapter(() => null);
    const callId = createCallId("call-missing-pc");
    const correlationId = createCorrelationId();

    const result = await adapter.attachRemoteAudio({ callId, correlationId });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("deferred");
    }
    expect(adapter.isRemoteAudioElementAttached(callId)).toBe(true);
    expect(adapter.isRemoteAudioStreamWired(callId)).toBe(false);

    adapter.dispose();
  });

  it("wires remote audio when peer connection becomes available after deferred attach", async () => {
    const playSpy = vi.spyOn(HTMLAudioElement.prototype, "play").mockResolvedValue(undefined);
    class TestMediaStream {
      private readonly tracks: MediaStreamTrack[];

      constructor(tracks: MediaStreamTrack[] = []) {
        this.tracks = [...tracks];
      }

      addTrack(track: MediaStreamTrack): void {
        this.tracks.push(track);
      }

      getTracks(): MediaStreamTrack[] {
        return this.tracks;
      }
    }

    vi.stubGlobal("MediaStream", TestMediaStream);

    const track = { kind: "audio", enabled: true } as MediaStreamTrack;
    const connection = {
      getReceivers: () => [{ track }],
      getSenders: () => [],
      addEventListener: vi.fn(),
    };

    let peerConnection: unknown = null;
    const adapter = createAdapter((callId) => {
      void callId;
      return peerConnection;
    });
    const callId = createCallId("call-deferred-pc");
    const correlationId = createCorrelationId();

    const deferredResult = await adapter.attachRemoteAudio({ callId, correlationId });
    expect(deferredResult.ok).toBe(true);
    if (deferredResult.ok) {
      expect(deferredResult.value).toBe("deferred");
    }

    peerConnection = connection;
    const attachedResult = await adapter.attachRemoteAudio({ callId, correlationId });
    expect(attachedResult.ok).toBe(true);
    if (attachedResult.ok) {
      expect(attachedResult.value).toBe("attached");
    }
    expect(adapter.isRemoteAudioStreamWired(callId)).toBe(true);
    expect(playSpy).toHaveBeenCalled();

    adapter.dispose();
  });

  it("mutes and unmutes local audio tracks", async () => {
    const track = { kind: "audio", enabled: true } as MediaStreamTrack;
    const connection = {
      getReceivers: () => [],
      getSenders: () => [{ track }],
      addEventListener: vi.fn(),
    };

    const adapter = createAdapter(() => connection);
    const callId = createCallId("call-mute");
    const correlationId = createCorrelationId();

    const muteResult = await adapter.muteCall({ callId, correlationId });
    expect(muteResult.ok).toBe(true);
    expect(track.enabled).toBe(false);
    expect(adapter.isMuted(callId)).toBe(true);

    const unmuteResult = await adapter.unmuteCall({ callId, correlationId });
    expect(unmuteResult.ok).toBe(true);
    expect(track.enabled).toBe(true);

    adapter.dispose();
  });

  it("fails mute when peer connection has no local audio track", async () => {
    const connection = {
      getReceivers: () => [],
      getSenders: () => [],
      addEventListener: vi.fn(),
    };
    const adapter = createAdapter(() => connection);
    const callId = createCallId("call-mute-fail");
    const correlationId = createCorrelationId();

    const result = await adapter.muteCall({ callId, correlationId });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("no local audio track");
    }

    adapter.dispose();
  });
});
