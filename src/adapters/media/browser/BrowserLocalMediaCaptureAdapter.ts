import type { CallId } from "@domain/index.js";
import type {
  CaptureLocalMediaCommand,
  CaptureLocalMediaResult,
  LocalMediaCapturePort,
  LocalMediaProbeResult,
  LocalMediaStreamHandle,
  MediaInputDeviceInfo,
  ProbeLocalMediaCommand,
  ReleaseLocalMediaCommand,
  ReplaceOutboundVideoTrackCommand,
  SetLocalVideoMutedCommand,
  StartCameraPreviewCommand,
  StartCameraPreviewResult,
  StopCameraPreviewCommand,
} from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import { createLocalMediaStreamHandle } from "./createLocalMediaStreamHandle.js";
import { createStubVideoTrack } from "./createStubVideoTrack.js";
import { applyScreenShareEncodingPolicy } from "./applyScreenShareEncodingPolicy.js";
import { replaceOutboundVideoSenderTrack } from "./replaceOutboundVideoTrack.js";

const FEATURE_ID = "F-027";

export type PeerConnectionProvider = (callId: CallId) => unknown;

export type MediaDevicesLike = Readonly<{
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  getDisplayMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  enumerateDevices?: () => Promise<ReadonlyArray<MediaDeviceInfo>>;
}>;

export type BrowserLocalMediaCaptureAdapterOptions = Readonly<{
  logger: Logger;
  getPeerConnection: PeerConnectionProvider;
  mediaDevices?: MediaDevicesLike;
  documentRef?: Document;
  createStubTrack?: typeof createStubVideoTrack;
}>;

type CallCaptureState = {
  handle: LocalMediaStreamHandle;
  stream: MediaStream;
  usedStubVideoTrack: boolean;
  source: "camera" | "screen" | "none";
  screenEndedHandler: (() => void) | null;
};

/**
 * - Purpose: browser LocalMediaCapturePort — gUM, stub video, replaceTrack mute/source.
 * - Inputs: probe/capture/mute/source/release commands; peer connection provider.
 * - Outputs: opaque handles and Result; no Domain MediaStream leakage.
 */
export class BrowserLocalMediaCaptureAdapter implements LocalMediaCapturePort {
  private readonly logger: Logger;
  private readonly getPeerConnection: PeerConnectionProvider;
  private readonly mediaDevices: MediaDevicesLike | null;
  private readonly documentRef: Document | undefined;
  private readonly createStubTrack: typeof createStubVideoTrack;
  private readonly byCallId = new Map<CallId, CallCaptureState>();
  private readonly previewByHandle = new Map<LocalMediaStreamHandle, MediaStream>();
  private readonly onScreenShareEndedListeners = new Set<
    (callId: CallId) => void
  >();

  constructor(options: BrowserLocalMediaCaptureAdapterOptions) {
    this.logger = options.logger;
    this.getPeerConnection = options.getPeerConnection;
    this.mediaDevices = options.mediaDevices ?? resolveDefaultMediaDevices();
    this.documentRef = options.documentRef;
    this.createStubTrack = options.createStubTrack ?? createStubVideoTrack;
  }

  onScreenShareEnded(listener: (callId: CallId) => void): () => void {
    this.onScreenShareEndedListeners.add(listener);
    return () => {
      this.onScreenShareEndedListeners.delete(listener);
    };
  }

  getStreamForHandle(handle: LocalMediaStreamHandle): MediaStream | null {
    const preview = this.previewByHandle.get(handle);
    if (preview !== undefined) {
      return preview;
    }
    for (const state of this.byCallId.values()) {
      if (state.handle === handle) {
        return state.stream;
      }
    }
    return null;
  }

  async listInputDevices(
    correlationId: CorrelationId,
  ): Promise<Result<ReadonlyArray<MediaInputDeviceInfo>, PlatformError>> {
    if (this.mediaDevices === null || this.mediaDevices.enumerateDevices === undefined) {
      return err(
        createPlatformError("operation_failed", "media_devices_unavailable"),
      );
    }

    try {
      let devices = await this.mediaDevices.enumerateDevices();
      const needsPermission = devices.some(
        (device) =>
          (device.kind === "audioinput" || device.kind === "videoinput") &&
          device.label.length === 0,
      );
      if (needsPermission) {
        const permissionStream = await this.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        stopTracks(permissionStream);
        devices = await this.mediaDevices.enumerateDevices();
      }

      const mapped = devices
        .filter(
          (device): device is MediaDeviceInfo & {
            kind: "audioinput" | "videoinput";
          } => device.kind === "audioinput" || device.kind === "videoinput",
        )
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label.length > 0 ? device.label : device.deviceId,
          kind: device.kind,
        }));

      this.logger.info("local_media_devices_listed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "list_input_devices",
        result: "succeeded",
        deviceCount: mapped.length,
      });

      return ok(mapped);
    } catch (error: unknown) {
      const platformError = normalizeUnknownError(error);
      this.logger.error(
        "local_media_devices_list_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation: "list_input_devices",
          result: platformError.code,
        },
        platformError,
      );
      return err(platformError);
    }
  }

  async startCameraPreview(
    command: StartCameraPreviewCommand,
  ): Promise<Result<StartCameraPreviewResult, PlatformError>> {
    if (this.mediaDevices === null) {
      return err(
        createPlatformError("operation_failed", "media_devices_unavailable"),
      );
    }

    try {
      const stream = await this.mediaDevices.getUserMedia({
        video: buildVideoConstraint(command.videoDeviceId),
      });
      if (stream.getVideoTracks().length === 0) {
        stopTracks(stream);
        return err(createPlatformError("operation_failed", "video_track_missing"));
      }
      const handle = createLocalMediaStreamHandle();
      this.previewByHandle.set(handle, stream);
      this.logger.info("local_media_camera_preview_started", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "start_camera_preview",
        result: "succeeded",
      });
      return ok({ handle });
    } catch (error: unknown) {
      const platformError = normalizeUnknownError(error);
      this.logger.error(
        "local_media_camera_preview_failed",
        {
          correlationId: command.correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation: "start_camera_preview",
          result: platformError.code,
        },
        platformError,
      );
      return err(platformError);
    }
  }

  stopCameraPreview(
    command: StopCameraPreviewCommand,
  ): Promise<Result<void, PlatformError>> {
    const stream = this.previewByHandle.get(command.handle);
    if (stream === undefined) {
      return Promise.resolve(ok(undefined));
    }
    stopTracks(stream);
    this.previewByHandle.delete(command.handle);
    this.logger.info("local_media_camera_preview_stopped", {
      correlationId: command.correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Media",
      operation: "stop_camera_preview",
      result: "succeeded",
    });
    return Promise.resolve(ok(undefined));
  }

  getStreamForCall(callId: CallId): MediaStream | null {
    return this.byCallId.get(callId)?.stream ?? null;
  }

  async probeAvailability(
    command: ProbeLocalMediaCommand,
  ): Promise<Result<LocalMediaProbeResult, PlatformError>> {
    if (this.mediaDevices === null) {
      return err(
        createPlatformError("operation_failed", "media_devices_unavailable"),
      );
    }

    let audioAvailable = false;
    let videoAvailable = false;

    try {
      const audioStream = await this.mediaDevices.getUserMedia({ audio: true });
      audioAvailable = audioStream.getAudioTracks().length > 0;
      stopTracks(audioStream);
    } catch {
      audioAvailable = false;
    }

    if (command.includeVideo) {
      try {
        const videoStream = await this.mediaDevices.getUserMedia({ video: true });
        videoAvailable = videoStream.getVideoTracks().length > 0;
        stopTracks(videoStream);
      } catch {
        videoAvailable = false;
      }
    }

    this.logger.info("local_media_probe_completed", {
      correlationId: command.correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Media",
      operation: "probe_local_media",
      result: "succeeded",
      audioAvailable,
      videoAvailable,
    });

    return ok({ audioAvailable, videoAvailable });
  }

  async captureLocalMedia(
    command: CaptureLocalMediaCommand,
  ): Promise<Result<CaptureLocalMediaResult, PlatformError>> {
    if (this.mediaDevices === null) {
      return err(
        createPlatformError("operation_failed", "media_devices_unavailable"),
      );
    }

    this.releaseCallState(command.callId);

    try {
      const audioStream = await this.mediaDevices.getUserMedia({
        audio: buildAudioConstraint(command.audioDeviceId),
      });
      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length === 0) {
        stopTracks(audioStream);
        return err(createPlatformError("operation_failed", "audio_track_missing"));
      }

      let videoTracks: MediaStreamTrack[] = [];
      let usedStubVideoTrack = false;

      if (command.includeVideo) {
        const videoResult = await this.captureVideoTracks(command);
        if (!videoResult.ok) {
          stopTracks(audioStream);
          return videoResult;
        }
        videoTracks = [...videoResult.value.tracks];
        usedStubVideoTrack = videoResult.value.usedStub;
      }

      const stream = new MediaStream([...audioTracks, ...videoTracks]);
      const handle = createLocalMediaStreamHandle();
      this.byCallId.set(command.callId, {
        handle,
        stream,
        usedStubVideoTrack,
        source: command.includeVideo ? "camera" : "none",
        screenEndedHandler: null,
      });

      this.logger.info("local_media_captured", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "capture_local_media",
        callId: command.callId,
        result: "succeeded",
        usedStubVideoTrack,
        includeVideo: command.includeVideo,
      });

      return ok({ handle, usedStubVideoTrack });
    } catch (error: unknown) {
      const platformError = normalizeUnknownError(error);
      this.logger.error(
        "local_media_capture_failed",
        {
          correlationId: command.correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation: "capture_local_media",
          callId: command.callId,
          result: platformError.code,
        },
        platformError,
      );
      return err(platformError);
    }
  }

  async replaceOutboundVideoTrack(
    command: ReplaceOutboundVideoTrackCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.mediaDevices === null) {
      return err(
        createPlatformError("operation_failed", "media_devices_unavailable"),
      );
    }

    const state = this.byCallId.get(command.callId);
    if (state === undefined) {
      return err(createPlatformError("operation_failed", "local_media_not_captured"));
    }

    try {
      this.clearScreenEndedHandler(state);

      let nextTrack: MediaStreamTrack;
      if (command.source === "screen") {
        const screenStream = await this.mediaDevices.getDisplayMedia({
          audio: false,
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 15, max: 30 },
          },
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack === undefined) {
          stopTracks(screenStream);
          return err(createPlatformError("operation_failed", "screen_track_missing"));
        }
        nextTrack = screenTrack;
        const onEnded = (): void => {
          this.notifyScreenShareEnded(command.callId);
        };
        screenTrack.addEventListener("ended", onEnded);
        state.screenEndedHandler = onEnded;
        state.source = "screen";
      } else {
        const cameraResult = await this.captureVideoTracks({
          callId: command.callId,
          includeVideo: true,
          ...(command.videoDeviceId !== undefined
            ? { videoDeviceId: command.videoDeviceId }
            : {}),
          initialVideoMuted: command.muted,
          allowStubVideoTrack: true,
          correlationId: command.correlationId,
        });
        if (!cameraResult.ok) {
          return cameraResult;
        }
        const cameraTrack = cameraResult.value.tracks[0];
        if (cameraTrack === undefined) {
          return err(createPlatformError("operation_failed", "video_track_missing"));
        }
        nextTrack = cameraTrack;
        state.source = "camera";
        state.usedStubVideoTrack = cameraResult.value.usedStub;
      }

      nextTrack.enabled = !command.muted;

      const connection = this.getPeerConnection(command.callId);
      const sender = await replaceOutboundVideoSenderTrack(connection, nextTrack);
      if (sender === null) {
        nextTrack.stop();
        return err(
          createPlatformError("operation_failed", "video_sender_replace_failed"),
        );
      }

      if (command.source === "screen") {
        applyScreenShareEncodingPolicy(nextTrack, sender);
      }

      replaceVideoTracksOnStream(state.stream, nextTrack);

      this.logger.info("local_media_video_source_replaced", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "replace_outbound_video_track",
        callId: command.callId,
        result: "succeeded",
        source: command.source,
        muted: command.muted,
      });

      return ok(undefined);
    } catch (error: unknown) {
      if (isDisplayMediaUserCancel(error)) {
        this.logger.info("local_media_screen_share_cancelled", {
          correlationId: command.correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation: "replace_outbound_video_track",
          callId: command.callId,
          result: "cancelled",
        });
        return err(
          createPlatformError("cancelled", "screen_share_picker_cancelled", error),
        );
      }
      if (isDisplayMediaNotSupported(error)) {
        this.logger.error(
          "local_media_screen_share_not_supported",
          {
            correlationId: command.correlationId,
            featureId: FEATURE_ID,
            boundedContext: "Media",
            operation: "replace_outbound_video_track",
            callId: command.callId,
            result: "operation_failed",
          },
          error,
        );
        return err(
          createPlatformError(
            "operation_failed",
            "screen_share_not_supported_in_host",
            error,
          ),
        );
      }
      const platformError = normalizeUnknownError(error);
      this.logger.error(
        "local_media_video_source_replace_failed",
        {
          correlationId: command.correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation: "replace_outbound_video_track",
          callId: command.callId,
          result: platformError.code,
        },
        platformError,
      );
      return err(platformError);
    }
  }

  async setLocalVideoMuted(
    command: SetLocalVideoMutedCommand,
  ): Promise<Result<void, PlatformError>> {
    const state = this.byCallId.get(command.callId);
    if (state === undefined) {
      return err(createPlatformError("operation_failed", "local_media_not_captured"));
    }

    if (state.source === "screen") {
      return err(
        createPlatformError("operation_failed", "camera_mute_blocked_during_screen_share"),
      );
    }

    try {
      const videoTracks = state.stream.getVideoTracks();
      if (videoTracks.length === 0 || (!command.muted && state.usedStubVideoTrack)) {
        // No live camera track yet, or unmute from stub — capture/replace real camera.
        return await this.replaceOutboundVideoTrack({
          callId: command.callId,
          source: "camera",
          ...(command.videoDeviceId !== undefined
            ? { videoDeviceId: command.videoDeviceId }
            : {}),
          muted: command.muted,
          correlationId: command.correlationId,
        });
      }

      for (const track of videoTracks) {
        if (track.readyState === "ended") {
          return await this.replaceOutboundVideoTrack({
            callId: command.callId,
            source: "camera",
            ...(command.videoDeviceId !== undefined
              ? { videoDeviceId: command.videoDeviceId }
              : {}),
            muted: command.muted,
            correlationId: command.correlationId,
          });
        }
        track.enabled = !command.muted;
      }

      this.logger.info("local_media_video_muted_toggled", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "set_local_video_muted",
        callId: command.callId,
        result: "succeeded",
        muted: command.muted,
      });
      return ok(undefined);
    } catch (error: unknown) {
      return err(normalizeUnknownError(error));
    }
  }

  releaseLocalMedia(
    command: ReleaseLocalMediaCommand,
  ): Promise<Result<void, PlatformError>> {
    this.releaseCallState(command.callId);
    this.logger.info("local_media_released", {
      correlationId: command.correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Media",
      operation: "release_local_media",
      callId: command.callId,
      result: "succeeded",
    });
    return Promise.resolve(ok(undefined));
  }

  private async captureVideoTracks(
    command: Readonly<{
      callId: CallId;
      includeVideo: boolean;
      videoDeviceId?: string;
      initialVideoMuted: boolean;
      allowStubVideoTrack: boolean;
      correlationId: CaptureLocalMediaCommand["correlationId"];
    }>,
  ): Promise<
    Result<{ tracks: ReadonlyArray<MediaStreamTrack>; usedStub: boolean }, PlatformError>
  > {
    if (this.mediaDevices === null) {
      return err(
        createPlatformError("operation_failed", "media_devices_unavailable"),
      );
    }

    try {
      const videoStream = await this.mediaDevices.getUserMedia({
        video: buildVideoConstraint(command.videoDeviceId),
      });
      const tracks = videoStream.getVideoTracks();
      for (const track of tracks) {
        track.enabled = !command.initialVideoMuted;
      }
      return ok({ tracks, usedStub: false });
    } catch (error: unknown) {
      if (!command.allowStubVideoTrack) {
        return err(normalizeUnknownError(error));
      }
      const stub = this.createStubTrack(
        this.documentRef !== undefined ? { documentRef: this.documentRef } : {},
      );
      if (stub === null) {
        return err(
          createPlatformError("operation_failed", "stub_video_track_unavailable"),
        );
      }
      stub.enabled = !command.initialVideoMuted;
      this.logger.warn("local_media_using_stub_video_track", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "capture_video",
        callId: command.callId,
        result: "stub",
      });
      return ok({ tracks: [stub], usedStub: true });
    }
  }

  private releaseCallState(callId: CallId): void {
    const state = this.byCallId.get(callId);
    if (state === undefined) {
      return;
    }
    this.clearScreenEndedHandler(state);
    stopTracks(state.stream);
    this.byCallId.delete(callId);
  }

  private clearScreenEndedHandler(state: CallCaptureState): void {
    if (state.screenEndedHandler === null) {
      return;
    }
    for (const track of state.stream.getVideoTracks()) {
      track.removeEventListener("ended", state.screenEndedHandler);
    }
    state.screenEndedHandler = null;
  }

  private notifyScreenShareEnded(callId: CallId): void {
    for (const listener of this.onScreenShareEndedListeners) {
      listener(callId);
    }
  }
}

function resolveDefaultMediaDevices(): MediaDevicesLike | null {
  if (typeof navigator === "undefined" || navigator.mediaDevices === undefined) {
    return null;
  }
  return navigator.mediaDevices;
}

function buildAudioConstraint(
  deviceId: string | undefined,
): boolean | MediaTrackConstraints {
  if (deviceId === undefined) {
    return true;
  }
  return { deviceId: { exact: deviceId } };
}

function buildVideoConstraint(
  deviceId: string | undefined,
): boolean | MediaTrackConstraints {
  if (deviceId === undefined) {
    return true;
  }
  return { deviceId: { exact: deviceId } };
}

function stopTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function replaceVideoTracksOnStream(stream: MediaStream, nextTrack: MediaStreamTrack): void {
  for (const track of stream.getVideoTracks()) {
    stream.removeTrack(track);
    track.stop();
  }
  stream.addTrack(nextTrack);
}

function isDisplayMediaUserCancel(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  return name === "NotAllowedError" || name === "AbortError";
}

function isDisplayMediaNotSupported(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  return name === "NotSupportedError";
}
