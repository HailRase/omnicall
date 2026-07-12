import type { CallMediaMode } from "@domain/index.js";

/**
 * - Purpose: build safe JsSIP media options for audio or video calls.
 * - Inputs: optional per-call media mode; defaults to audio.
 * - Outputs: media and rtcOfferConstraints for ua.call / session.answer.
 */
export type JsSipCallMediaOptions = Readonly<{
  mediaConstraints: Readonly<{ audio: true; video: boolean }>;
  rtcOfferConstraints: Readonly<{
    offerToReceiveAudio: true;
    offerToReceiveVideo: boolean;
  }>;
}>;

const DEFAULT_CALL_MEDIA_OPTIONS: JsSipCallMediaOptions = {
  mediaConstraints: { audio: true, video: false },
  rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
};

const VIDEO_CALL_MEDIA_OPTIONS: JsSipCallMediaOptions = {
  mediaConstraints: { audio: true, video: true },
  rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: true },
};

export function buildJsSipCallMediaOptions(
  mediaMode: CallMediaMode = "audio",
): JsSipCallMediaOptions {
  return mediaMode === "video" ? VIDEO_CALL_MEDIA_OPTIONS : DEFAULT_CALL_MEDIA_OPTIONS;
}
