/**
 * - Purpose: abstract local mic/camera/screen capture without leaking MediaStream to Domain.
 * - Inputs: device ids, mute intent, call id, correlation id.
 * - Outputs: opaque stream handle ids or normalized media failures.
 */

import type { CallId } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

/** Opaque handle owned by the Media adapter; never a live MediaStream in Domain. */
export type LocalMediaStreamHandle = string & {
  readonly __brand: "LocalMediaStreamHandle";
};

export type ProbeLocalMediaCommand = Readonly<{
  includeVideo: boolean;
  correlationId: CorrelationId;
}>;

export type LocalMediaProbeResult = Readonly<{
  audioAvailable: boolean;
  videoAvailable: boolean;
}>;

export type CaptureLocalMediaCommand = Readonly<{
  callId: CallId;
  includeVideo: boolean;
  audioDeviceId?: string;
  videoDeviceId?: string;
  /** Privacy default for video tracks. */
  initialVideoMuted: boolean;
  allowStubVideoTrack: boolean;
  correlationId: CorrelationId;
}>;

export type CaptureLocalMediaResult = Readonly<{
  handle: LocalMediaStreamHandle;
  usedStubVideoTrack: boolean;
}>;

export type ReplaceOutboundVideoTrackCommand = Readonly<{
  callId: CallId;
  source: "camera" | "screen";
  videoDeviceId?: string;
  muted: boolean;
  correlationId: CorrelationId;
}>;

export type SetLocalVideoMutedCommand = Readonly<{
  callId: CallId;
  muted: boolean;
  videoDeviceId?: string;
  correlationId: CorrelationId;
}>;

export type ReleaseLocalMediaCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type MediaInputDeviceInfo = Readonly<{
  deviceId: string;
  label: string;
  kind: "audioinput" | "videoinput";
}>;

export type StartCameraPreviewCommand = Readonly<{
  videoDeviceId?: string;
  correlationId: CorrelationId;
}>;

export type StartCameraPreviewResult = Readonly<{
  handle: LocalMediaStreamHandle;
}>;

export type StopCameraPreviewCommand = Readonly<{
  handle: LocalMediaStreamHandle;
  correlationId: CorrelationId;
}>;

export interface LocalMediaCapturePort {
  probeAvailability(
    command: ProbeLocalMediaCommand,
  ): Promise<Result<LocalMediaProbeResult, PlatformError>>;

  listInputDevices(
    correlationId: CorrelationId,
  ): Promise<Result<ReadonlyArray<MediaInputDeviceInfo>, PlatformError>>;

  startCameraPreview(
    command: StartCameraPreviewCommand,
  ): Promise<Result<StartCameraPreviewResult, PlatformError>>;

  stopCameraPreview(
    command: StopCameraPreviewCommand,
  ): Promise<Result<void, PlatformError>>;

  /** Adapter-owned stream for UI element binding; never stored in Domain/Zustand. */
  getStreamForHandle?(handle: LocalMediaStreamHandle): MediaStream | null;

  captureLocalMedia(
    command: CaptureLocalMediaCommand,
  ): Promise<Result<CaptureLocalMediaResult, PlatformError>>;

  replaceOutboundVideoTrack(
    command: ReplaceOutboundVideoTrackCommand,
  ): Promise<Result<void, PlatformError>>;

  setLocalVideoMuted(
    command: SetLocalVideoMutedCommand,
  ): Promise<Result<void, PlatformError>>;

  releaseLocalMedia(
    command: ReleaseLocalMediaCommand,
  ): Promise<Result<void, PlatformError>>;

  /** Optional: screen-share track ended by user/OS; Application maps to camera restore. */
  onScreenShareEnded?(listener: (callId: CallId) => void): () => void;
}
