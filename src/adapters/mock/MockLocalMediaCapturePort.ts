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
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import { createLocalMediaStreamHandle } from "../media/browser/createLocalMediaStreamHandle.js";

export type MockLocalMediaCaptureScenario = "success" | "failure" | "no_camera";

type CaptureTrace = Readonly<{
  callId: CallId;
  includeVideo: boolean;
  initialVideoMuted: boolean;
}>;

/**
 * - Purpose: in-memory LocalMediaCapturePort for Application/UI tests.
 * - Inputs: capture/mute/source commands and scenario flags.
 * - Outputs: Result plus traces; no real MediaStream.
 */
export class MockLocalMediaCapturePort implements LocalMediaCapturePort {
  private scenario: MockLocalMediaCaptureScenario;
  private readonly captures: CaptureTrace[] = [];
  private readonly mutedByCall = new Map<CallId, boolean>();
  private readonly sourceByCall = new Map<CallId, "camera" | "screen" | "none">();
  private readonly handlesByCall = new Map<CallId, LocalMediaStreamHandle>();
  private readonly previewHandles = new Set<LocalMediaStreamHandle>();
  private devices: ReadonlyArray<MediaInputDeviceInfo> = [
    { deviceId: "mic-1", label: "Mock Mic", kind: "audioinput" },
    { deviceId: "cam-1", label: "Mock Camera", kind: "videoinput" },
  ];
  private screenEndedListener: ((callId: CallId) => void) | null = null;

  constructor(scenario: MockLocalMediaCaptureScenario = "success") {
    this.scenario = scenario;
  }

  setScenario(scenario: MockLocalMediaCaptureScenario): void {
    this.scenario = scenario;
  }

  setDevices(devices: ReadonlyArray<MediaInputDeviceInfo>): void {
    this.devices = devices;
  }

  getCaptures(): ReadonlyArray<CaptureTrace> {
    return this.captures;
  }

  getPreviewHandles(): ReadonlyArray<LocalMediaStreamHandle> {
    return [...this.previewHandles];
  }

  listInputDevices(
    _correlationId: CorrelationId,
  ): Promise<Result<ReadonlyArray<MediaInputDeviceInfo>, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(createPlatformError("operation_failed", "mock_list_devices_failed")),
      );
    }
    return Promise.resolve(ok(this.devices));
  }

  startCameraPreview(
    _command: StartCameraPreviewCommand,
  ): Promise<Result<StartCameraPreviewResult, PlatformError>> {
    if (this.scenario === "failure" || this.scenario === "no_camera") {
      return Promise.resolve(
        err(createPlatformError("operation_failed", "mock_preview_failed")),
      );
    }
    const handle = createLocalMediaStreamHandle(`mock-preview-${this.previewHandles.size}`);
    this.previewHandles.add(handle);
    return Promise.resolve(ok({ handle }));
  }

  stopCameraPreview(
    command: StopCameraPreviewCommand,
  ): Promise<Result<void, PlatformError>> {
    this.previewHandles.delete(command.handle);
    return Promise.resolve(ok(undefined));
  }

  getSource(callId: CallId): "camera" | "screen" | "none" | null {
    return this.sourceByCall.get(callId) ?? null;
  }

  isMuted(callId: CallId): boolean | null {
    return this.mutedByCall.get(callId) ?? null;
  }

  emitScreenShareEnded(callId: CallId): void {
    this.screenEndedListener?.(callId);
  }

  onScreenShareEnded(listener: (callId: CallId) => void): () => void {
    this.screenEndedListener = listener;
    return () => {
      if (this.screenEndedListener === listener) {
        this.screenEndedListener = null;
      }
    };
  }

  probeAvailability(
    command: ProbeLocalMediaCommand,
  ): Promise<Result<LocalMediaProbeResult, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(createPlatformError("operation_failed", "mock_probe_failed")),
      );
    }
    return Promise.resolve(
      ok({
        audioAvailable: true,
        videoAvailable: this.scenario !== "no_camera" && command.includeVideo,
      }),
    );
  }

  captureLocalMedia(
    command: CaptureLocalMediaCommand,
  ): Promise<Result<CaptureLocalMediaResult, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(createPlatformError("operation_failed", "mock_capture_failed")),
      );
    }

    this.captures.push({
      callId: command.callId,
      includeVideo: command.includeVideo,
      initialVideoMuted: command.initialVideoMuted,
    });

    const handle = createLocalMediaStreamHandle(`mock-${command.callId}`);
    this.handlesByCall.set(command.callId, handle);
    this.sourceByCall.set(command.callId, command.includeVideo ? "camera" : "none");
    this.mutedByCall.set(
      command.callId,
      command.includeVideo ? command.initialVideoMuted : true,
    );

    const usedStubVideoTrack =
      command.includeVideo &&
      command.allowStubVideoTrack &&
      this.scenario === "no_camera";

    return Promise.resolve(ok({ handle, usedStubVideoTrack }));
  }

  replaceOutboundVideoTrack(
    command: ReplaceOutboundVideoTrackCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(createPlatformError("operation_failed", "mock_replace_failed")),
      );
    }
    if (!this.handlesByCall.has(command.callId)) {
      return Promise.resolve(
        err(createPlatformError("operation_failed", "local_media_not_captured")),
      );
    }
    this.sourceByCall.set(command.callId, command.source);
    this.mutedByCall.set(command.callId, command.muted);
    return Promise.resolve(ok(undefined));
  }

  setLocalVideoMuted(
    command: SetLocalVideoMutedCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.sourceByCall.get(command.callId) === "screen") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            "camera_mute_blocked_during_screen_share",
          ),
        ),
      );
    }
    return this.replaceOutboundVideoTrack({
      callId: command.callId,
      source: "camera",
      ...(command.videoDeviceId !== undefined
        ? { videoDeviceId: command.videoDeviceId }
        : {}),
      muted: command.muted,
      correlationId: command.correlationId,
    });
  }

  releaseLocalMedia(
    command: ReleaseLocalMediaCommand,
  ): Promise<Result<void, PlatformError>> {
    this.handlesByCall.delete(command.callId);
    this.sourceByCall.delete(command.callId);
    this.mutedByCall.delete(command.callId);
    return Promise.resolve(ok(undefined));
  }
}
