import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { Logger } from "@ports/index.js";
import { BrowserLocalMediaCaptureAdapter } from "./BrowserLocalMediaCaptureAdapter.js";
import type { MediaDevicesLike } from "./BrowserLocalMediaCaptureAdapter.js";

function createLogger(): Logger {
  const logger: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: () => logger,
  };
  return logger;
}

function createTrack(
  kind: "audio" | "video",
  stop: () => void = vi.fn(),
): MediaStreamTrack {
  const listeners = new Map<string, Set<() => void>>();
  return {
    kind,
    enabled: true,
    stop,
    addEventListener: (type: string, listener: () => void) => {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent: (type: string) => {
      for (const listener of listeners.get(type) ?? []) {
        listener();
      }
    },
  } as unknown as MediaStreamTrack & { dispatchEvent: (type: string) => void };
}

function createFakeStream(tracks: MediaStreamTrack[]): MediaStream {
  const list = [...tracks];
  return {
    getTracks: () => list,
    getAudioTracks: () => list.filter((track) => track.kind === "audio"),
    getVideoTracks: () => list.filter((track) => track.kind === "video"),
    addTrack: (track: MediaStreamTrack) => {
      list.push(track);
    },
    removeTrack: (track: MediaStreamTrack) => {
      const index = list.indexOf(track);
      if (index >= 0) {
        list.splice(index, 1);
      }
    },
  } as unknown as MediaStream;
}

class TestMediaStream {
  private readonly tracks: MediaStreamTrack[];

  constructor(tracks: MediaStreamTrack[] = []) {
    this.tracks = [...tracks];
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === "audio");
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === "video");
  }

  addTrack(track: MediaStreamTrack): void {
    this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack): void {
    const index = this.tracks.indexOf(track);
    if (index >= 0) {
      this.tracks.splice(index, 1);
    }
  }
}

describe("BrowserLocalMediaCaptureAdapter", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaStream", TestMediaStream);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("probes audio and video availability", async () => {
    const mediaDevices: MediaDevicesLike = {
      getUserMedia: vi.fn((constraints: MediaStreamConstraints) => {
        if (constraints.audio) {
          return Promise.resolve(createFakeStream([createTrack("audio")]));
        }
        return Promise.resolve(createFakeStream([createTrack("video")]));
      }),
      getDisplayMedia: vi.fn(),
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => null,
      mediaDevices,
    });

    const result = await adapter.probeAvailability({
      includeVideo: true,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ audioAvailable: true, videoAvailable: true });
    }
  });

  it("captures audio+video with privacy-muted video tracks", async () => {
    const videoTrack = createTrack("video");
    const mediaDevices: MediaDevicesLike = {
      getUserMedia: vi.fn((constraints: MediaStreamConstraints) => {
        if (constraints.audio) {
          return Promise.resolve(createFakeStream([createTrack("audio")]));
        }
        return Promise.resolve(createFakeStream([videoTrack]));
      }),
      getDisplayMedia: vi.fn(),
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => null,
      mediaDevices,
    });

    const callId = createCallId("call-capture-1");
    const result = await adapter.captureLocalMedia({
      callId,
      includeVideo: true,
      initialVideoMuted: true,
      allowStubVideoTrack: true,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.usedStubVideoTrack).toBe(false);
      expect(videoTrack.enabled).toBe(false);
      expect(adapter.getStreamForCall(callId)?.getVideoTracks()).toHaveLength(1);
    }
  });

  it("falls back to stub video track when camera fails", async () => {
    const stubTrack = createTrack("video");
    const mediaDevices: MediaDevicesLike = {
      getUserMedia: vi.fn((constraints: MediaStreamConstraints) => {
        if (constraints.audio) {
          return Promise.resolve(createFakeStream([createTrack("audio")]));
        }
        return Promise.reject(new Error("camera denied"));
      }),
      getDisplayMedia: vi.fn(),
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => null,
      mediaDevices,
      createStubTrack: () => stubTrack,
    });

    const result = await adapter.captureLocalMedia({
      callId: createCallId("call-stub-1"),
      includeVideo: true,
      initialVideoMuted: true,
      allowStubVideoTrack: true,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.usedStubVideoTrack).toBe(true);
    }
  });

  it("replaces outbound video with screen track and notifies on ended", async () => {
    const screenTrack = createTrack("video") as MediaStreamTrack & {
      dispatchEvent: (type: string) => void;
    };
    const replaceTrack = vi.fn(() => Promise.resolve(undefined));
    const peerConnection = {
      getSenders: () => [{ track: createTrack("video"), replaceTrack }],
    };

    const mediaDevices: MediaDevicesLike = {
      getUserMedia: vi.fn((constraints: MediaStreamConstraints) => {
        if (constraints.audio) {
          return Promise.resolve(createFakeStream([createTrack("audio")]));
        }
        return Promise.resolve(createFakeStream([createTrack("video")]));
      }),
      getDisplayMedia: vi.fn(() => Promise.resolve(createFakeStream([screenTrack]))),
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => peerConnection,
      mediaDevices,
    });

    const callId = createCallId("call-screen-1");
    const capture = await adapter.captureLocalMedia({
      callId,
      includeVideo: true,
      initialVideoMuted: true,
      allowStubVideoTrack: false,
      correlationId: createCorrelationId(),
    });
    expect(capture.ok).toBe(true);

    const ended = vi.fn();
    adapter.onScreenShareEnded(ended);

    const replaced = await adapter.replaceOutboundVideoTrack({
      callId,
      source: "screen",
      muted: false,
      correlationId: createCorrelationId(),
    });

    expect(replaced.ok).toBe(true);
    expect(replaceTrack).toHaveBeenCalledWith(screenTrack);

    screenTrack.dispatchEvent("ended");
    expect(ended).toHaveBeenCalledWith(callId);
  });

  it("setLocalVideoMuted uses replaceTrack camera path", async () => {
    const replaceTrack = vi.fn(() => Promise.resolve(undefined));
    const peerConnection = {
      getSenders: () => [{ track: createTrack("video"), replaceTrack }],
    };
    const unmutedTrack = createTrack("video");

    const mediaDevices: MediaDevicesLike = {
      getUserMedia: vi
        .fn()
        .mockImplementationOnce(() => Promise.resolve(createFakeStream([createTrack("audio")])))
        .mockImplementationOnce(() => Promise.resolve(createFakeStream([createTrack("video")])))
        .mockImplementationOnce(() => Promise.resolve(createFakeStream([unmutedTrack]))),
      getDisplayMedia: vi.fn(),
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => peerConnection,
      mediaDevices,
    });

    const callId = createCallId("call-mute-1");
    await adapter.captureLocalMedia({
      callId,
      includeVideo: true,
      initialVideoMuted: true,
      allowStubVideoTrack: false,
      correlationId: createCorrelationId(),
    });

    const result = await adapter.setLocalVideoMuted({
      callId,
      muted: false,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(replaceTrack).toHaveBeenCalled();
    expect(unmutedTrack.enabled).toBe(true);
  });

  it("releases local media and stops tracks", async () => {
    const audioStop = vi.fn();
    const videoStop = vi.fn();
    const audioTrack = createTrack("audio", audioStop);
    const videoTrack = createTrack("video", videoStop);
    const mediaDevices: MediaDevicesLike = {
      getUserMedia: vi.fn((constraints: MediaStreamConstraints) => {
        if (constraints.audio) {
          return Promise.resolve(createFakeStream([audioTrack]));
        }
        return Promise.resolve(createFakeStream([videoTrack]));
      }),
      getDisplayMedia: vi.fn(),
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => null,
      mediaDevices,
    });

    const callId = createCallId("call-release-1");
    await adapter.captureLocalMedia({
      callId,
      includeVideo: true,
      initialVideoMuted: true,
      allowStubVideoTrack: false,
      correlationId: createCorrelationId(),
    });

    const released = await adapter.releaseLocalMedia({
      callId,
      correlationId: createCorrelationId(),
    });

    expect(released.ok).toBe(true);
    expect(audioStop).toHaveBeenCalled();
    expect(videoStop).toHaveBeenCalled();
    expect(adapter.getStreamForCall(callId)).toBeNull();
  });

  it("lists input devices after permission probe", async () => {
    const enumerateDevices = vi
      .fn()
      .mockResolvedValueOnce([
        { deviceId: "mic-1", label: "", kind: "audioinput" },
        { deviceId: "cam-1", label: "", kind: "videoinput" },
      ])
      .mockResolvedValueOnce([
        { deviceId: "mic-1", label: "Mock Mic", kind: "audioinput" },
        { deviceId: "cam-1", label: "Mock Camera", kind: "videoinput" },
      ]);
    const getUserMedia = vi.fn().mockResolvedValue(
      createFakeStream([createTrack("audio"), createTrack("video")]),
    );
    const mediaDevices: MediaDevicesLike = {
      getUserMedia,
      getDisplayMedia: vi.fn(),
      enumerateDevices,
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => null,
      mediaDevices,
    });

    const result = await adapter.listInputDevices(createCorrelationId());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(getUserMedia).toHaveBeenCalled();
    expect(result.value).toEqual([
      { deviceId: "mic-1", label: "Mock Mic", kind: "audioinput" },
      { deviceId: "cam-1", label: "Mock Camera", kind: "videoinput" },
    ]);
  });

  it("starts and stops camera preview by opaque handle", async () => {
    const videoStop = vi.fn();
    const mediaDevices: MediaDevicesLike = {
      getUserMedia: vi.fn().mockResolvedValue(createFakeStream([createTrack("video", videoStop)])),
      getDisplayMedia: vi.fn(),
    };

    const adapter = new BrowserLocalMediaCaptureAdapter({
      logger: createLogger(),
      getPeerConnection: () => null,
      mediaDevices,
    });

    const started = await adapter.startCameraPreview({
      correlationId: createCorrelationId(),
      videoDeviceId: "cam-1",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    expect(adapter.getStreamForHandle(started.value.handle)).not.toBeNull();

    const stopped = await adapter.stopCameraPreview({
      handle: started.value.handle,
      correlationId: createCorrelationId(),
    });
    expect(stopped.ok).toBe(true);
    expect(videoStop).toHaveBeenCalled();
    expect(adapter.getStreamForHandle(started.value.handle)).toBeNull();
  });
});
