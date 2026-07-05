import { describe, expect, it, afterEach, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { MockCodecPreferencesPort } from "@adapters/mock/MockCodecPreferencesPort.js";
import {
  createDefaultCodecPreferences,
  reorderAudioCodecs,
} from "@domain/index.js";
import type {
  JsSipRtcSessionEventName,
  JsSipRtcSessionListener,
  JsSipRtcSessionPort,
} from "./JsSipRtcSessionPort.js";
import {
  clearJsSipSessionCodecPreferencesState,
  isJsSipSessionCodecPreferencesWired,
  prepareJsSipSessionCodecPreferences,
  resetJsSipSessionCodecPreferencesStateForTests,
  wireJsSipSessionCodecPreferencesSync,
} from "./prepareJsSipSessionCodecPreferences.js";

class MockSession implements JsSipRtcSessionPort {
  private readonly listeners = new Map<JsSipRtcSessionEventName, Set<JsSipRtcSessionListener>>();
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  on(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    const bucket = this.listeners.get(event) ?? new Set<JsSipRtcSessionListener>();
    bucket.add(listener);
    this.listeners.set(event, bucket);
  }

  off(): void {}
  emit(event: JsSipRtcSessionEventName, payload?: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload);
    }
  }
  answer(): void {}
  terminate(): void {}
  hold(): boolean {
    return false;
  }
  unhold(): boolean {
    return false;
  }
  refer(): unknown {
    return false;
  }
  sendDtmf(): void {}
  getConnection(): unknown {
    return null;
  }
  getRemoteIdentityHeader(): string {
    return '"Caller" <sip:100@pbx.example>';
  }
}

describe("prepareJsSipSessionCodecPreferences", () => {
  afterEach(() => {
    resetJsSipSessionCodecPreferencesStateForTests();
  });

  it("wires sdp listener before outbound local sdp mutation", async () => {
    const session = new MockSession("outbound-ready");
    const reordered = reorderAudioCodecs(createDefaultCodecPreferences(), 0, 1);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) {
      throw new Error("expected reorder to succeed");
    }

    const resolved = await prepareJsSipSessionCodecPreferences({
      session,
      codecPreferencesPort: new MockCodecPreferencesPort(reordered.value),
      logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-003",
    });

    expect(isJsSipSessionCodecPreferencesWired(session.id)).toBe(true);
    expect(resolved.audioMimeTypes[0]).toBe("audio/PCMU");

    const event = {
      originator: "local",
      type: "offer",
      sdp: [
        "m=audio 9 UDP/TLS/RTP/SAVPF 111 0 110",
        "a=rtpmap:111 opus/48000/2",
        "a=rtpmap:0 PCMU/8000",
        "a=rtpmap:110 telephone-event/48000",
      ].join("\r\n"),
    };
    session.emit("sdp", event);
    expect(event.sdp).toContain("m=audio 9 UDP/TLS/RTP/SAVPF 0 111 110");
  });

  it("is idempotent for incoming answer readiness", async () => {
    const session = new MockSession("incoming-ready");
    const port = new MockCodecPreferencesPort(createDefaultCodecPreferences());
    const options = {
      session,
      codecPreferencesPort: port,
      logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-002",
    };

    await prepareJsSipSessionCodecPreferences(options);
    const getCodecPreferences = vi.spyOn(port, "getCodecPreferences");
    await prepareJsSipSessionCodecPreferences(options);

    expect(isJsSipSessionCodecPreferencesWired(session.id)).toBe(true);
    expect(getCodecPreferences).not.toHaveBeenCalled();
  });

  it("clears wired state when session ends", async () => {
    const session = new MockSession("session-end");
    await prepareJsSipSessionCodecPreferences({
      session,
      codecPreferencesPort: null,
      logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-003",
    });

    expect(isJsSipSessionCodecPreferencesWired(session.id)).toBe(true);
    clearJsSipSessionCodecPreferencesState(session.id);
    expect(isJsSipSessionCodecPreferencesWired(session.id)).toBe(false);
  });

  it("sync wire attaches listeners immediately after resolve", () => {
    const session = new MockSession("sync-wire");
    wireJsSipSessionCodecPreferencesSync({
      session,
      resolved: {
        audioMimeTypes: ["audio/PCMU", "audio/telephone-event"],
        videoMimeTypes: ["video/VP8"],
      },
      logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-003",
    });

    const event = {
      originator: "local",
      type: "offer",
      sdp: [
        "m=audio 9 UDP/TLS/RTP/SAVPF 111 0 110",
        "a=rtpmap:111 opus/48000/2",
        "a=rtpmap:0 PCMU/8000",
        "a=rtpmap:110 telephone-event/48000",
      ].join("\r\n"),
    };
    session.emit("sdp", event);
    expect(event.sdp).toContain("m=audio 9 UDP/TLS/RTP/SAVPF 0 110");
    expect(event.sdp).not.toContain("111");
  });
});
