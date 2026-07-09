import type { VideoCallDisabledReason } from "@application/index.js";
import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: map video-call disabled reason keys to localized dialpad copy.
 * - Inputs: VideoCallDisabledReason or null.
 * - Outputs: localized string or null when enabled.
 */
export function mapVideoCallDisabledReason(
  reason: VideoCallDisabledReason | null,
): string | null {
  if (reason === null) {
    return null;
  }
  switch (reason) {
    case "videoCall.disabled.invalidNumber":
      return translateCurrent("dialpad.disabled.invalidNumber");
    case "videoCall.disabled.notRegistered":
      return translateCurrent("dialpad.disabled.notRegistered");
    case "videoCall.disabled.secondSessionBlocked":
      return translateCurrent("dialpad.disabled.secondSessionDisabled");
    case "videoCall.disabled.holdAllInProgress":
      return translateCurrent("dialpad.disabled.holdAllInProgress");
    case "videoCall.disabled.captureUnavailable":
      return translateCurrent("dialpad.videoCall.disabled.captureUnavailable");
    case "videoCall.disabled.featureNotReady":
      return translateCurrent("dialpad.videoCall.disabled.featureNotReady");
    default:
      return translateCurrent("common.actionUnavailable");
  }
}
