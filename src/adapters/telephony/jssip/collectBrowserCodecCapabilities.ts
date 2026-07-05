import type { MediaCodecCapabilitySnapshot } from "@application/media/resolveEnabledCodecs.js";

/**
 * - Purpose: snapshot browser RTCRtpReceiver codec capabilities for adapter filtering.
 * - Inputs: global RTCRtpReceiver when available in renderer/Electron.
 * - Outputs: audio/video capability lists or undefined outside WebRTC runtime.
 */
export function collectBrowserCodecCapabilities():
  | MediaCodecCapabilitySnapshot
  | undefined {
  if (typeof RTCRtpReceiver === "undefined") {
    return undefined;
  }

  if (typeof RTCRtpReceiver.getCapabilities !== "function") {
    return undefined;
  }

  const audio = RTCRtpReceiver.getCapabilities("audio");
  const video = RTCRtpReceiver.getCapabilities("video");

  return {
    audio: audio?.codecs.map((codec) => ({ mimeType: codec.mimeType })) ?? [],
    video: video?.codecs.map((codec) => ({ mimeType: codec.mimeType })) ?? [],
  };
}
