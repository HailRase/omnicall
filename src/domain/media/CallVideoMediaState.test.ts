import { describe, expect, it } from "vitest";

import {
  areCameraControlsEnabled,
  createInitialCallVideoMediaState,
  isScreenShareAllowed,
  setCameraAvailable,
  setLocalVideoMuted,
  setLocalVideoSource,
  setRemoteVideoPresent,
  setSessionViewMode,
  shouldShowRemoteVideoSurface,
} from "./CallVideoMediaState.js";

describe("CallVideoMediaState", () => {
  it("creates audio mode without camera source", () => {
    const state = createInitialCallVideoMediaState("audio");
    expect(state.mediaMode).toBe("audio");
    expect(state.localVideoSource).toBe("none");
    expect(state.localVideoMuted).toBe(true);
    expect(areCameraControlsEnabled(state)).toBe(false);
    expect(shouldShowRemoteVideoSurface(state)).toBe(false);
  });

  it("creates video mode privacy-muted with camera intent", () => {
    const state = createInitialCallVideoMediaState("video");
    expect(state.mediaMode).toBe("video");
    expect(state.localVideoMuted).toBe(true);
    expect(state.localVideoSource).toBe("camera");
    expect(areCameraControlsEnabled(state)).toBe(false);
  });

  it("ignores mute/source changes in audio mode", () => {
    const state = createInitialCallVideoMediaState("audio");
    expect(setLocalVideoMuted(state, false)).toEqual(state);
    expect(setLocalVideoSource(state, "camera")).toEqual(state);
  });

  it("enables camera controls when camera available", () => {
    let state = createInitialCallVideoMediaState("video");
    state = setCameraAvailable(state, true);
    expect(areCameraControlsEnabled(state)).toBe(true);
    state = setLocalVideoMuted(state, false);
    expect(state.localVideoMuted).toBe(false);
  });

  it("disables camera controls while screen sharing", () => {
    let state = createInitialCallVideoMediaState("video");
    state = setCameraAvailable(state, true);
    state = setLocalVideoSource(state, "screen");
    expect(state.localVideoMuted).toBe(false);
    expect(areCameraControlsEnabled(state)).toBe(false);
  });

  it("allows screen share in expanded or fullscreen video mode", () => {
    let state = createInitialCallVideoMediaState("video");
    expect(isScreenShareAllowed(state)).toBe(true);
    state = setSessionViewMode(state, "hidden");
    expect(isScreenShareAllowed(state)).toBe(false);
    state = setSessionViewMode(state, "expanded");
    expect(isScreenShareAllowed(state)).toBe(true);
    state = setSessionViewMode(state, "fullscreen");
    expect(isScreenShareAllowed(state)).toBe(true);
  });

  it("shows remote surface only when remote video present", () => {
    let state = createInitialCallVideoMediaState("video");
    expect(shouldShowRemoteVideoSurface(state)).toBe(false);
    state = setRemoteVideoPresent(state, true);
    expect(shouldShowRemoteVideoSurface(state)).toBe(true);
  });
});
