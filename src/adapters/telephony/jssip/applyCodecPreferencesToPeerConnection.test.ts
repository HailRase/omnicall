import { describe, expect, it, vi } from "vitest";
import { applyCodecPreferencesToPeerConnection } from "./applyCodecPreferencesToPeerConnection.js";

describe("applyCodecPreferencesToPeerConnection", () => {
  it("sets ordered audio codec preferences on audio transceivers", () => {
    const setCodecPreferences = vi.fn();
    const connection = {
      getTransceivers: () => [
        {
          stopped: false,
          sender: { track: { kind: "audio" } },
          setCodecPreferences,
        },
      ],
    };

    const originalReceiver = globalThis.RTCRtpReceiver;
    globalThis.RTCRtpReceiver = {
      getCapabilities: () => ({
        codecs: [
          { mimeType: "audio/opus", clockRate: 48000, channels: 2 },
          { mimeType: "audio/PCMU", clockRate: 8000 },
          { mimeType: "audio/telephone-event", clockRate: 8000 },
          { mimeType: "audio/rtx", clockRate: 48000 },
        ],
      }),
    } as unknown as typeof RTCRtpReceiver;

    try {
      applyCodecPreferencesToPeerConnection(connection, {
        audioMimeTypes: ["audio/PCMU", "audio/opus", "audio/telephone-event"],
        videoMimeTypes: [],
      });
    } finally {
      globalThis.RTCRtpReceiver = originalReceiver;
    }

    expect(setCodecPreferences).toHaveBeenCalledTimes(1);
    const codecs = setCodecPreferences.mock.calls[0]?.[0] as Array<{ mimeType: string }>;
    expect(codecs[0]?.mimeType).toBe("audio/PCMU");
    expect(codecs[1]?.mimeType).toBe("audio/opus");
    expect(codecs.map((codec) => codec.mimeType)).toContain("audio/telephone-event");
    expect(codecs.map((codec) => codec.mimeType)).toContain("audio/rtx");
  });

  it("no-ops for invalid peer connection input", () => {
    expect(() =>
      applyCodecPreferencesToPeerConnection(null, {
        audioMimeTypes: ["audio/PCMU"],
        videoMimeTypes: [],
      }),
    ).not.toThrow();
  });
});
