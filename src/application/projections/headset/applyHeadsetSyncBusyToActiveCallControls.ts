import type { ActiveCallControlsProjection } from "../telephony/activeCallControlsProjection.js";
import type { CallLineCardViewModel } from "../telephony/deriveCallLinesShell.js";
import type { HeadsetSyncBusyProjection } from "./headsetSyncBusyProjection.js";

/**
 * - Purpose: block conflicting hold/mute UI while headset sync intent is pending (LF-074).
 * - Inputs: active call controls projection and headset sync busy state.
 * - Outputs: projection with only the matching control family disabled.
 */
export function applyHeadsetSyncBusyToActiveCallControls(
  projection: ActiveCallControlsProjection,
  syncBusy: HeadsetSyncBusyProjection,
): ActiveCallControlsProjection {
  if (!syncBusy.isBusy || projection.callId === null) {
    return projection;
  }

  const callId = projection.callId;
  let next = projection;

  if (syncBusy.holdSessionId === callId) {
    next = {
      ...next,
      holdDisabledReason: "headset_sync_in_progress",
      resumeDisabledReason: "headset_sync_in_progress",
    };
  }

  if (syncBusy.muteSessionId === callId) {
    next = {
      ...next,
      muteDisabledReason: "headset_sync_in_progress",
      unmuteDisabledReason: "headset_sync_in_progress",
    };
  }

  return next;
}

/**
 * - Purpose: apply mute/hold sync lock to a call-line / controls-bar view-model.
 * - Inputs: call line card view-model and headset sync busy projection.
 * - Outputs: line with only the in-flight control family disabled.
 */
export function applyHeadsetSyncBusyToCallLine(
  line: CallLineCardViewModel,
  syncBusy: HeadsetSyncBusyProjection,
): CallLineCardViewModel {
  if (!syncBusy.isBusy) {
    return line;
  }

  let next = line;

  if (syncBusy.holdSessionId === line.callId) {
    next = {
      ...next,
      holdDisabledReason: "headset_sync_in_progress",
      resumeDisabledReason: "headset_sync_in_progress",
    };
  }

  if (syncBusy.muteSessionId === line.callId) {
    next = {
      ...next,
      muteDisabledReason: "headset_sync_in_progress",
      unmuteDisabledReason: "headset_sync_in_progress",
    };
  }

  return next;
}
