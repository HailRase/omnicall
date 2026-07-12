import { describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import type {
  JsSipRtcSessionEventName,
  JsSipRtcSessionListener,
  JsSipRtcSessionPort,
} from "./JsSipRtcSessionPort.js";
import { wireJsSipCodecPreferences } from "./wireJsSipCodecPreferences.js";

class MockSession implements JsSipRtcSessionPort {
  private readonly listeners = new Map<JsSipRtcSessionEventName, Set<JsSipRtcSessionListener>>();
  readonly id = "session-1";
  private connection: unknown = null;

  on(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    const bucket = this.listeners.get(event) ?? new Set<JsSipRtcSessionListener>();
    bucket.add(listener);
    this.listeners.set(event, bucket);
  }

  off(event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener): void {
    this.listeners.get(event)?.delete(listener);
  }

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
    return this.connection;
  }
  setConnection(connection: unknown): void {
    this.connection = connection;
  }
  getRemoteIdentityHeader(): string {
    return '"Caller" <sip:100@pbx.example>';
  }
}

const sampleSdp = [
  "m=audio 9 UDP/TLS/RTP/SAVPF 111 0 110",
  "a=rtpmap:111 opus/48000/2",
  "a=rtpmap:0 PCMU/8000",
  "a=rtpmap:110 telephone-event/48000",
].join("\r\n");

describe("wireJsSipCodecPreferences", () => {
  it("munges local sdp events using resolved audio MIME order", () => {
    const session = new MockSession();
    wireJsSipCodecPreferences({
      session,
      resolved: {
        audioMimeTypes: ["audio/PCMU", "audio/opus", "audio/telephone-event"],
        videoMimeTypes: [],
      },
      logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-003",
    });

    const event = {
      originator: "local",
      type: "offer",
      sdp: sampleSdp,
    };

    session.emit("sdp", event);
    expect(event.sdp).toContain("m=audio 9 UDP/TLS/RTP/SAVPF 0 111 110");
  });

  it("munges repeated local sdp events on hold/resume re-INVITE", () => {
    const session = new MockSession();
    wireJsSipCodecPreferences({
      session,
      resolved: {
        audioMimeTypes: ["audio/PCMU", "audio/opus", "audio/telephone-event"],
        videoMimeTypes: [],
      },
      logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-004",
    });

    const firstOffer = { originator: "local", type: "offer", sdp: sampleSdp };
    const reinviteOffer = { originator: "local", type: "offer", sdp: sampleSdp };

    session.emit("sdp", firstOffer);
    session.emit("sdp", reinviteOffer);

    expect(firstOffer.sdp).toContain("m=audio 9 UDP/TLS/RTP/SAVPF 0 111 110");
    expect(reinviteOffer.sdp).toContain("m=audio 9 UDP/TLS/RTP/SAVPF 0 111 110");
  });

  it("munges video codec order for video sessions", () => {
    const session = new MockSession();
    wireJsSipCodecPreferences({
      session,
      resolved: {
        audioMimeTypes: ["audio/opus"],
        videoMimeTypes: ["video/H264", "video/VP8"],
      },
      logger: createTestLogger({ featureId: "F-027", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-027",
      includeVideo: true,
    });
    const event = {
      originator: "local",
      type: "offer",
      sdp: [
        "m=audio 9 UDP/TLS/RTP/SAVPF 111",
        "a=rtpmap:111 opus/48000/2",
        "m=video 9 UDP/TLS/RTP/SAVPF 96 102 97",
        "a=rtpmap:96 VP8/90000",
        "a=rtpmap:102 H264/90000",
        "a=rtpmap:97 rtx/90000",
      ].join("\r\n"),
    };

    session.emit("sdp", event);

    expect(event.sdp).toContain("m=video 9 UDP/TLS/RTP/SAVPF 102 96 97");
  });

  it("ignores remote sdp events", () => {
    const session = new MockSession();
    wireJsSipCodecPreferences({
      session,
      resolved: { audioMimeTypes: ["audio/PCMU"], videoMimeTypes: [] },
      logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
      correlationId: createCorrelationId(),
      featureId: "F-003",
    });

    const event = {
      originator: "remote",
      type: "offer",
      sdp: "m=audio 9 UDP/TLS/RTP/SAVPF 111 0",
    };
    session.emit("sdp", event);
    expect(event.sdp).toBe("m=audio 9 UDP/TLS/RTP/SAVPF 111 0");
  });

  it("logs negotiated audio codecs after session confirmed", async () => {
    const info = vi.fn();
    const logger = createTestLogger({ featureId: "F-022", boundedContext: "Media" });
    logger.info = info;

    const session = new MockSession();
    session.setConnection({
      getStats: () =>
        Promise.resolve(
          new Map([
            [
              "outbound",
              {
                type: "outbound-rtp",
                kind: "audio",
                mimeType: "audio/PCMU",
                payloadType: 0,
              },
            ],
            [
              "inbound",
              {
                type: "inbound-rtp",
                kind: "audio",
                mimeType: "audio/PCMU",
                payloadType: 0,
              },
            ],
          ]),
        ),
    });

    wireJsSipCodecPreferences({
      session,
      resolved: { audioMimeTypes: ["audio/PCMU"], videoMimeTypes: [] },
      logger,
      correlationId: createCorrelationId(),
      featureId: "F-003",
    });

    session.emit("confirmed");
    await vi.waitFor(() => {
      expect(info).toHaveBeenCalledWith(
        "jssip_negotiated_audio_codecs",
        expect.objectContaining({
          localAudioMime: "audio/PCMU",
          remoteAudioMime: "audio/PCMU",
        }),
      );
    });
  });
});
