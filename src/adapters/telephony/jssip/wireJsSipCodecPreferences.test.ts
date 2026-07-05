import { describe, expect, it } from "vitest";
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
});
