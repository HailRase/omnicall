/**
 * - Purpose: apply screen-share encoding hints on outbound video track/sender (F-027).
 * - Inputs: video MediaStreamTrack and optional RTCRtpSender-like object.
 * - Outputs: best-effort contentHint + maxFramerate/maxBitrate; never throws.
 */

const SCREEN_MAX_FRAMERATE = 30;
const SCREEN_MAX_BITRATE_BPS = 2_500_000;

type RtpEncodingParametersLike = {
  maxFramerate?: number;
  maxBitrate?: number;
};

type RtpSendParametersLike = {
  encodings?: RtpEncodingParametersLike[];
};

type RtpSenderLike = {
  getParameters?: () => RtpSendParametersLike;
  setParameters?: (parameters: RtpSendParametersLike) => Promise<void>;
};

/**
 * - Purpose: tune track/sender for screen detail content after replaceTrack.
 * - Inputs: outbound video track; optional sender with get/setParameters.
 * - Outputs: void; failures are swallowed (graceful fallback).
 */
export function applyScreenShareEncodingPolicy(
  track: MediaStreamTrack,
  sender: unknown,
): void {
  try {
    if ("contentHint" in track) {
      (track as MediaStreamTrack & { contentHint: string }).contentHint = "detail";
    }
  } catch {
    // contentHint unsupported on some runtimes.
  }

  if (typeof sender !== "object" || sender === null) {
    return;
  }
  const rtpSender = sender as RtpSenderLike;
  if (
    typeof rtpSender.getParameters !== "function" ||
    typeof rtpSender.setParameters !== "function"
  ) {
    return;
  }

  try {
    const parameters = rtpSender.getParameters();
    const encodings =
      parameters.encodings !== undefined && parameters.encodings.length > 0
        ? parameters.encodings.map((encoding) => ({
            ...encoding,
            maxFramerate: SCREEN_MAX_FRAMERATE,
            maxBitrate: SCREEN_MAX_BITRATE_BPS,
          }))
        : [
            {
              maxFramerate: SCREEN_MAX_FRAMERATE,
              maxBitrate: SCREEN_MAX_BITRATE_BPS,
            },
          ];
    void rtpSender.setParameters({ ...parameters, encodings }).catch(() => undefined);
  } catch {
    // setParameters unsupported or rejected by peer connection.
  }
}
