import type { CallId } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

/**
 * - Purpose: abstract remote audio and telephony tone side effects.
 * - Inputs: call id, correlation id, normalized tone reasons.
 * - Outputs: success or normalized media operation failure.
 */
export type AttachRemoteAudioCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type PlayRingbackToneCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type PlayIncomingRingtoneCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type PlayRingtoneCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type PlayFailedToneCommand = Readonly<{
  callId: CallId;
  reason: string;
  correlationId: CorrelationId;
}>;

export type PlayBusyToneCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type StopToneCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type StopRingtoneCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type MuteCallCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type UnmuteCallCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type ReleaseAllMediaCommand = Readonly<{
  correlationId: CorrelationId;
}>;

export type RemoteAudioAttachOutcome = "attached" | "deferred";

export interface MediaGateway {
  attachRemoteAudio(
    command: AttachRemoteAudioCommand,
  ): Promise<Result<RemoteAudioAttachOutcome, PlatformError>>;
  playRingbackTone(
    command: PlayRingbackToneCommand,
  ): Promise<Result<void, PlatformError>>;
  playIncomingRingtone(
    command: PlayIncomingRingtoneCommand,
  ): Promise<Result<void, PlatformError>>;
  playRingtone(command: PlayRingtoneCommand): Promise<Result<void, PlatformError>>;
  playBusyTone(
    command: PlayBusyToneCommand,
  ): Promise<Result<void, PlatformError>>;
  playFailedTone(
    command: PlayFailedToneCommand,
  ): Promise<Result<void, PlatformError>>;
  stopTone(
    command: StopToneCommand,
  ): Promise<Result<void, PlatformError>>;
  stopRingtone(command: StopRingtoneCommand): Promise<Result<void, PlatformError>>;
  muteCall(command: MuteCallCommand): Promise<Result<void, PlatformError>>;
  unmuteCall(command: UnmuteCallCommand): Promise<Result<void, PlatformError>>;
  releaseAll(command: ReleaseAllMediaCommand): Promise<Result<void, PlatformError>>;
}

