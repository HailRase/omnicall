/**
 * - Purpose: immutable per-call video media facts (no MediaStream).
 * - Inputs: media mode and optional overrides for mute/source/remote/view.
 * - Outputs: CallVideoMediaState snapshots and pure transitions.
 */

import {
  DEFAULT_CALL_MEDIA_MODE,
  type CallMediaMode,
} from "./CallMediaMode.js";
import {
  DEFAULT_LOCAL_VIDEO_SOURCE,
  type LocalVideoSource,
} from "./LocalVideoSource.js";
import {
  DEFAULT_SESSION_VIEW_MODE,
  type SessionViewMode,
} from "./SessionViewMode.js";

export type CallVideoMediaState = Readonly<{
  mediaMode: CallMediaMode;
  localVideoMuted: boolean;
  localVideoSource: LocalVideoSource;
  remoteVideoPresent: boolean;
  sessionView: SessionViewMode;
  cameraAvailable: boolean;
}>;

/**
 * - Purpose: initial video media state for a new call.
 * - Inputs: mediaMode; video mode starts privacy-muted with camera source intent.
 * - Outputs: CallVideoMediaState with safe defaults.
 */
export function createInitialCallVideoMediaState(
  mediaMode: CallMediaMode = DEFAULT_CALL_MEDIA_MODE,
): CallVideoMediaState {
  if (mediaMode === "audio") {
    return {
      mediaMode: "audio",
      localVideoMuted: true,
      localVideoSource: DEFAULT_LOCAL_VIDEO_SOURCE,
      remoteVideoPresent: false,
      sessionView: DEFAULT_SESSION_VIEW_MODE,
      cameraAvailable: false,
    };
  }

  return {
    mediaMode: "video",
    localVideoMuted: true,
    localVideoSource: "camera",
    remoteVideoPresent: false,
    sessionView: DEFAULT_SESSION_VIEW_MODE,
    cameraAvailable: false,
  };
}

export function setLocalVideoMuted(
  state: CallVideoMediaState,
  muted: boolean,
): CallVideoMediaState {
  if (state.mediaMode === "audio") {
    return state;
  }
  return { ...state, localVideoMuted: muted };
}

export function setLocalVideoSource(
  state: CallVideoMediaState,
  source: LocalVideoSource,
): CallVideoMediaState {
  if (state.mediaMode === "audio") {
    return state;
  }
  if (source === "screen") {
    return {
      ...state,
      localVideoSource: source,
      localVideoMuted: false,
    };
  }
  return { ...state, localVideoSource: source };
}

export function setRemoteVideoPresent(
  state: CallVideoMediaState,
  present: boolean,
): CallVideoMediaState {
  return { ...state, remoteVideoPresent: present };
}

export function setSessionViewMode(
  state: CallVideoMediaState,
  sessionView: SessionViewMode,
): CallVideoMediaState {
  return { ...state, sessionView };
}

export function setCameraAvailable(
  state: CallVideoMediaState,
  cameraAvailable: boolean,
): CallVideoMediaState {
  return { ...state, cameraAvailable };
}

/**
 * - Purpose: whether UI should show remote video surface vs placeholder.
 * - Inputs: CallVideoMediaState.
 * - Outputs: true when video mode and remote video is present.
 */
export function shouldShowRemoteVideoSurface(
  state: CallVideoMediaState,
): boolean {
  return state.mediaMode === "video" && state.remoteVideoPresent;
}

/**
 * - Purpose: whether camera on/off controls are allowed.
 * - Inputs: CallVideoMediaState.
 * - Outputs: true when video mode, camera source, and camera available.
 */
export function areCameraControlsEnabled(state: CallVideoMediaState): boolean {
  return (
    state.mediaMode === "video" &&
    state.localVideoSource === "camera" &&
    state.cameraAvailable
  );
}

/**
 * - Purpose: whether screen-share toggle is allowed (fullscreen layout).
 * - Inputs: CallVideoMediaState.
 * - Outputs: true when video mode and fullscreen session view.
 */
export function isScreenShareAllowed(state: CallVideoMediaState): boolean {
  return state.mediaMode === "video" && state.sessionView === "fullscreen";
}
