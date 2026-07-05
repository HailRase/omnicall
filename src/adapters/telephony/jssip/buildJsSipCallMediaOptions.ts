/**
 * - Purpose: default JsSIP CallOptions/AnswerOptions for audio-only calls.
 * - Inputs: none (video remains disabled until product enables video calls).
 * - Outputs: media and rtcOfferConstraints for ua.call / session.answer.
 */
export type JsSipCallMediaOptions = Readonly<{
  mediaConstraints: Readonly<{ audio: true; video: false }>;
  rtcOfferConstraints: Readonly<{
    offerToReceiveAudio: true;
    offerToReceiveVideo: false;
  }>;
}>;

const DEFAULT_CALL_MEDIA_OPTIONS: JsSipCallMediaOptions = {
  mediaConstraints: { audio: true, video: false },
  rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
};

export function buildJsSipCallMediaOptions(): JsSipCallMediaOptions {
  return DEFAULT_CALL_MEDIA_OPTIONS;
}
