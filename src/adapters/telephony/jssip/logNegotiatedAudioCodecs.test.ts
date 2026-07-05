import { describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { logNegotiatedAudioCodecs } from "./logNegotiatedAudioCodecs.js";

describe("logNegotiatedAudioCodecs", () => {
  it("logs negotiated local and remote audio mime types from stats", async () => {
    const info = vi.fn();
    const logger = createTestLogger({ featureId: "F-022", boundedContext: "Media" });
    logger.info = info;

    const connection = {
      getStats: () =>
        Promise.resolve(
          new Map([
            [
              "out",
              {
                type: "outbound-rtp",
                kind: "audio",
                mimeType: "audio/opus",
                payloadType: 111,
              },
            ],
            [
              "in",
              {
                type: "inbound-rtp",
                kind: "audio",
                mimeType: "audio/PCMU",
                payloadType: 0,
              },
            ],
          ]),
        ),
    };

    await logNegotiatedAudioCodecs(connection, logger, {
      correlationId: createCorrelationId(),
      featureId: "F-003",
      operation: "jssip_negotiated_audio_codecs",
    });

    expect(info).toHaveBeenCalledWith(
      "jssip_negotiated_audio_codecs",
      expect.objectContaining({
        localAudioMime: "audio/opus",
        remoteAudioMime: "audio/PCMU",
        localPayloadType: 111,
        remotePayloadType: 0,
      }),
    );
  });

  it("warns without throwing when getStats fails", async () => {
    const warn = vi.fn();
    const logger = createTestLogger({ featureId: "F-022", boundedContext: "Media" });
    logger.warn = warn;

    const connection = {
      getStats: () => Promise.reject(new Error("stats unavailable")),
    };

    await expect(
      logNegotiatedAudioCodecs(connection, logger, {
        correlationId: createCorrelationId(),
        featureId: "F-003",
        operation: "jssip_negotiated_audio_codecs",
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      "jssip_negotiated_codecs_stats_failed",
      expect.objectContaining({
        result: "stats_unavailable",
      }),
    );
  });
});
