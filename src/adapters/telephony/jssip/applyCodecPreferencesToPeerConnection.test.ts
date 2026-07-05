import { describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { applyCodecPreferencesToPeerConnection } from "./applyCodecPreferencesToPeerConnection.js";

const applyContext = {
  logger: createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
  correlationId: createCorrelationId(),
  featureId: "F-003",
};

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
      applyCodecPreferencesToPeerConnection(
        connection,
        {
          audioMimeTypes: ["audio/PCMU", "audio/opus", "audio/telephone-event"],
          videoMimeTypes: [],
        },
        applyContext,
      );
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

  it("preserves all browser capability variants for the same preferred MIME", () => {
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
          { mimeType: "audio/opus", clockRate: 48000, channels: 2, sdpFmtpLine: "minptime=10" },
          { mimeType: "audio/opus", clockRate: 48000, channels: 1, sdpFmtpLine: "maxaveragebitrate=20000" },
          { mimeType: "audio/PCMU", clockRate: 8000 },
          { mimeType: "audio/telephone-event", clockRate: 8000 },
        ],
      }),
    } as unknown as typeof RTCRtpReceiver;

    try {
      applyCodecPreferencesToPeerConnection(
        connection,
        {
          audioMimeTypes: ["audio/opus", "audio/PCMU", "audio/telephone-event"],
          videoMimeTypes: [],
        },
        applyContext,
      );
    } finally {
      globalThis.RTCRtpReceiver = originalReceiver;
    }

    const codecs = setCodecPreferences.mock.calls[0]?.[0] as Array<{ mimeType: string; channels?: number }>;
    const opusVariants = codecs.filter((codec) => codec.mimeType === "audio/opus");
    expect(opusVariants).toHaveLength(2);
    expect(codecs.map((codec) => codec.mimeType)).toContain("audio/telephone-event");
  });

  it("logs warning and continues when setCodecPreferences throws", () => {
    const warn = vi.fn();
    const logger = createTestLogger({ featureId: "F-022", boundedContext: "Media" });
    logger.warn = warn;

    const setCodecPreferences = vi.fn(() => {
      throw new Error("codec preferences rejected");
    });
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
        codecs: [{ mimeType: "audio/PCMU", clockRate: 8000 }],
      }),
    } as unknown as typeof RTCRtpReceiver;

    try {
      expect(() =>
        applyCodecPreferencesToPeerConnection(
          connection,
          { audioMimeTypes: ["audio/PCMU"], videoMimeTypes: [] },
          { ...applyContext, logger },
        ),
      ).not.toThrow();
    } finally {
      globalThis.RTCRtpReceiver = originalReceiver;
    }

    expect(warn).toHaveBeenCalledWith(
      "jssip_set_codec_preferences_failed",
      expect.objectContaining({
        featureId: "F-003",
        codecFeatureId: "F-022",
        boundedContext: "Media",
        operation: "jssip_set_codec_preferences",
        result: "sdp_munging_fallback",
      }),
    );
  });

  it("skips video transceivers and ignores video MIME preferences", () => {
    const setCodecPreferences = vi.fn();
    const connection = {
      getTransceivers: () => [
        {
          stopped: false,
          sender: { track: { kind: "video" } },
          setCodecPreferences,
        },
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
        codecs: [{ mimeType: "audio/PCMU", clockRate: 8000 }],
      }),
    } as unknown as typeof RTCRtpReceiver;

    try {
      applyCodecPreferencesToPeerConnection(
        connection,
        {
          audioMimeTypes: ["audio/PCMU"],
          videoMimeTypes: ["video/VP8"],
        },
        applyContext,
      );
    } finally {
      globalThis.RTCRtpReceiver = originalReceiver;
    }

    expect(setCodecPreferences).toHaveBeenCalledTimes(1);
  });

  it("no-ops for invalid peer connection input", () => {
    expect(() =>
      applyCodecPreferencesToPeerConnection(
        null,
        {
          audioMimeTypes: ["audio/PCMU"],
          videoMimeTypes: [],
        },
        applyContext,
      ),
    ).not.toThrow();
  });
});
