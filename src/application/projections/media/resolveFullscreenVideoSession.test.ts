import { describe, expect, it } from "vitest";
import type { CallVideoMediaState } from "@domain/index.js";
import { resolveFullscreenVideoSession } from "./resolveFullscreenVideoSession.js";

const videoFullscreen: CallVideoMediaState = {
  mediaMode: "video",
  localVideoMuted: false,
  localVideoSource: "camera",
  remoteVideoPresent: true,
  sessionView: "fullscreen",
  cameraAvailable: true,
};

const videoExpanded: CallVideoMediaState = {
  ...videoFullscreen,
  sessionView: "expanded",
};

describe("resolveFullscreenVideoSession", () => {
  it("returns null when no fullscreen video session exists", () => {
    expect(resolveFullscreenVideoSession({})).toBeNull();
    expect(
      resolveFullscreenVideoSession({
        "call-1": videoExpanded,
      }),
    ).toBeNull();
  });

  it("returns the fullscreen video session even when another call is present", () => {
    expect(
      resolveFullscreenVideoSession({
        "incoming-2": {
          mediaMode: "audio",
          localVideoMuted: true,
          localVideoSource: "none",
          remoteVideoPresent: false,
          sessionView: "expanded",
          cameraAvailable: false,
        },
        "call-1": videoFullscreen,
      }),
    ).toEqual({
      callId: "call-1",
      videoState: videoFullscreen,
    });
  });
});
