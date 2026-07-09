import type { ActiveCallControlsProjection } from "../telephony/activeCallControlsProjection.js";
import type { HeadsetSyncBusyProjection } from "./headsetSyncBusyProjection.js";

/**
 * - Purpose: block conflicting hold/mute UI while headset sync is in progress (LF-074).
 * - Inputs: active call controls projection and headset sync busy state.
 * - Outputs: projection with headset sync disabled reasons applied.
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
