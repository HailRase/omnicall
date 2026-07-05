import {
  resolveEnabledCodecs,
  type ResolvedEnabledCodecs,
} from "@application/media/resolveEnabledCodecs.js";
import { createDefaultCodecPreferences } from "@domain/index.js";
import type { CodecPreferencesPort, Logger } from "@ports/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";
import { collectBrowserCodecCapabilities } from "./collectBrowserCodecCapabilities.js";

const FEATURE_ID_CODEC_PREFERENCES = "F-022";

/**
 * - Purpose: load persisted codec prefs with zero-regression fallback for JsSIP sessions.
 * - Inputs: optional CodecPreferencesPort, logger for load failures.
 * - Outputs: ordered enabled audio/video MIME types for one new RTC session.
 */
export async function resolveJsSipSessionCodecs(
  codecPreferencesPort: CodecPreferencesPort | null,
  logger: Logger,
): Promise<ResolvedEnabledCodecs> {
  const capabilities = collectBrowserCodecCapabilities();
  const defaults = resolveEnabledCodecs(createDefaultCodecPreferences(), capabilities);

  if (codecPreferencesPort === null) {
    return defaults;
  }

  try {
    const preferences = await codecPreferencesPort.getCodecPreferences();
    return resolveEnabledCodecs(preferences, capabilities);
  } catch (error: unknown) {
    const normalized = normalizeUnknownError(error);
    logger.warn("codec_preferences_load_failed", {
      featureId: FEATURE_ID_CODEC_PREFERENCES,
      boundedContext: "Media",
      operation: "resolve_jssip_session_codecs",
      result: "fallback_defaults",
      errorMessage: normalized.message,
    });
    return defaults;
  }
}
