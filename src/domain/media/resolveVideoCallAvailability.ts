/**
 * - Purpose: pure policy for enabling the Video call dial action.
 * - Inputs: registration, number validity, multi-call, capture availability.
 * - Outputs: enabled flag or semantic disabled reason key.
 */

export type VideoCallDisabledReason =
  | "videoCall.disabled.invalidNumber"
  | "videoCall.disabled.notRegistered"
  | "videoCall.disabled.secondSessionBlocked"
  | "videoCall.disabled.holdAllInProgress"
  | "videoCall.disabled.captureUnavailable"
  | "videoCall.disabled.featureNotReady";

export type ResolveVideoCallAvailabilityInput = Readonly<{
  numberValid: boolean;
  sipRegistered: boolean;
  secondSessionBlocked: boolean;
  holdAllInProgress: boolean;
  /** Local camera probe or stub-allowed path. */
  videoCaptureAvailable: boolean;
  /** Gate until JsSIP video WU is wired; default false keeps audio-only safe. */
  videoFeatureReady: boolean;
}>;

export type ResolveVideoCallAvailabilityResult =
  | Readonly<{ enabled: true }>
  | Readonly<{ enabled: false; reason: VideoCallDisabledReason }>;

/**
 * - Purpose: decide if Video call button may start a video-mode call.
 * - Inputs: ResolveVideoCallAvailabilityInput.
 * - Outputs: enabled or disabled with reason key for i18n.
 */
export function resolveVideoCallAvailability(
  input: ResolveVideoCallAvailabilityInput,
): ResolveVideoCallAvailabilityResult {
  if (!input.videoFeatureReady) {
    return { enabled: false, reason: "videoCall.disabled.featureNotReady" };
  }
  if (!input.numberValid) {
    return { enabled: false, reason: "videoCall.disabled.invalidNumber" };
  }
  if (!input.sipRegistered) {
    return { enabled: false, reason: "videoCall.disabled.notRegistered" };
  }
  if (input.holdAllInProgress) {
    return { enabled: false, reason: "videoCall.disabled.holdAllInProgress" };
  }
  if (input.secondSessionBlocked) {
    return { enabled: false, reason: "videoCall.disabled.secondSessionBlocked" };
  }
  if (!input.videoCaptureAvailable) {
    return { enabled: false, reason: "videoCall.disabled.captureUnavailable" };
  }
  return { enabled: true };
}
