import type { HeadsetSyncBusyState } from "../../headset/HeadsetSyncQueue.js";

export type HeadsetSyncBusyProjection = HeadsetSyncBusyState;

export function initialHeadsetSyncBusyProjection(): HeadsetSyncBusyProjection {
  return {
    holdSessionId: null,
    muteSessionId: null,
    isBusy: false,
  };
}

export function mapHeadsetSyncBusyState(
  state: HeadsetSyncBusyState,
): HeadsetSyncBusyProjection {
  return state;
}
