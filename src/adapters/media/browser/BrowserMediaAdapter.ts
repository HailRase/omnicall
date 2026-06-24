import type { CallId } from "@domain/index.js";
import type {
  AttachRemoteAudioCommand,
  MediaGateway,
  MuteCallCommand,
  PlayBusyToneCommand,
  PlayFailedToneCommand,
  PlayIncomingRingtoneCommand,
  PlayRingbackToneCommand,
  PlayRingtoneCommand,
  RemoteAudioAttachOutcome,
  StopRingtoneCommand,
  StopToneCommand,
  UnmuteCallCommand,
} from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  setLocalAudioTracksEnabled,
  wirePeerConnectionRemoteAudio,
} from "./peerConnectionMedia.js";
import { WebAudioTonePlayer } from "./WebAudioTonePlayer.js";

const FEATURE_ID = "F-005";

export type PeerConnectionProvider = (callId: CallId) => unknown;

export type BrowserMediaAdapterOptions = Readonly<{
  logger: Logger;
  getPeerConnection: PeerConnectionProvider;
  rootElement?: HTMLElement;
  tonePlayer?: WebAudioTonePlayer;
}>;

type CallMediaState = Readonly<{
  remoteAudioElement: HTMLAudioElement;
}>;

/**
 * - Purpose: browser-side MediaGateway using DOM audio and Web Audio tones (RAT R2).
 * - Inputs: media commands; peer connection resolved per call via adapter-private hook.
 * - Outputs: remote audio wiring, tone playback, local track mute/unmute results.
 */
export class BrowserMediaAdapter implements MediaGateway {
  private readonly logger: Logger;
  private readonly getPeerConnection: PeerConnectionProvider;
  private readonly explicitRootElement: HTMLElement | undefined;
  private resolvedRootElement: HTMLElement | null = null;
  private readonly tonePlayer: WebAudioTonePlayer;
  private readonly callStates = new Map<CallId, CallMediaState>();
  private readonly mutedCalls = new Set<CallId>();
  private readonly wiredRemoteAudioCalls = new Set<CallId>();

  constructor(options: BrowserMediaAdapterOptions) {
    this.logger = options.logger;
    this.getPeerConnection = options.getPeerConnection;
    this.explicitRootElement = options.rootElement;
    this.tonePlayer = options.tonePlayer ?? new WebAudioTonePlayer();
  }

  attachRemoteAudio(
    command: AttachRemoteAudioCommand,
  ): Promise<Result<RemoteAudioAttachOutcome, PlatformError>> {
    try {
      const audioResult = this.tryEnsureRemoteAudioElement(command.callId);
      if (!audioResult.ok) {
        return Promise.resolve(audioResult);
      }

      const connection = this.getPeerConnection(command.callId);

      if (connection === null || connection === undefined) {
        this.logger.warn("browser_media_peer_connection_missing", {
          correlationId: command.correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation: "attach_remote_audio",
          callId: command.callId,
        });
        return Promise.resolve(ok("deferred"));
      }

      const wired = wirePeerConnectionRemoteAudio(connection, audioResult.value);
      if (!wired) {
        const failure = err(
          createPlatformError(
            "operation_failed",
            `Remote audio attach failed for ${command.callId}: invalid peer connection`,
          ),
        );
        this.logger.error(
          "browser_media_operation_failed",
          {
            correlationId: command.correlationId,
            featureId: FEATURE_ID,
            boundedContext: "Media",
            operation: "attach_remote_audio",
            callId: command.callId,
            result: failure.error.code,
          },
          failure.error,
        );
        return Promise.resolve(failure);
      }

      this.logger.info("browser_media_remote_audio_attached", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "attach_remote_audio",
        callId: command.callId,
        result: "succeeded",
      });
      this.wiredRemoteAudioCalls.add(command.callId);
      return Promise.resolve(ok("attached"));
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "browser_media_operation_failed",
        {
          correlationId: command.correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation: "attach_remote_audio",
          callId: command.callId,
          result: normalized.code,
        },
        error,
      );
      return Promise.resolve(err(normalized));
    }
  }

  async playRingbackTone(
    command: PlayRingbackToneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.playTone(command.callId, command.correlationId, "ringback", "play_ringback_tone");
  }

  async playIncomingRingtone(
    command: PlayIncomingRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.playTone(command.callId, command.correlationId, "ringtone", "play_incoming_ringtone");
  }

  async playRingtone(command: PlayRingtoneCommand): Promise<Result<void, PlatformError>> {
    return this.playIncomingRingtone(command);
  }

  async playBusyTone(command: PlayBusyToneCommand): Promise<Result<void, PlatformError>> {
    return this.playTone(command.callId, command.correlationId, "busy", "play_busy_tone");
  }

  async playFailedTone(
    command: PlayFailedToneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.runMediaOperation(command.callId, command.correlationId, "play_failed_tone", async () => {
      await this.tonePlayer.play(command.callId, "failed");
      this.logger.info("browser_media_failed_tone_started", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "play_failed_tone",
        callId: command.callId,
        reason: command.reason,
        result: "succeeded",
      });
    });
  }

  async stopTone(command: StopToneCommand): Promise<Result<void, PlatformError>> {
    return this.runMediaOperation(command.callId, command.correlationId, "stop_tone", () => {
      this.tonePlayer.stop(command.callId);
      this.logger.info("browser_media_tone_stopped", {
        correlationId: command.correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation: "stop_tone",
        callId: command.callId,
        result: "succeeded",
      });
    });
  }

  async stopRingtone(command: StopRingtoneCommand): Promise<Result<void, PlatformError>> {
    return this.stopTone(command);
  }

  async muteCall(command: MuteCallCommand): Promise<Result<void, PlatformError>> {
    return this.setCallMuted(command.callId, command.correlationId, true, "mute_call");
  }

  async unmuteCall(command: UnmuteCallCommand): Promise<Result<void, PlatformError>> {
    return this.setCallMuted(command.callId, command.correlationId, false, "unmute_call");
  }

  isRemoteAudioElementAttached(callId: CallId): boolean {
    return this.callStates.has(callId);
  }

  isRemoteAudioStreamWired(callId: CallId): boolean {
    return this.wiredRemoteAudioCalls.has(callId);
  }

  isTonePlaying(callId: CallId): boolean {
    return this.tonePlayer.isPlaying(callId);
  }

  isMuted(callId: CallId): boolean {
    return this.mutedCalls.has(callId);
  }

  dispose(): void {
    for (const [callId, state] of this.callStates) {
      try {
        state.remoteAudioElement.pause();
      } catch {
        // jsdom may not implement HTMLMediaElement.pause.
      }
      state.remoteAudioElement.srcObject = null;
      state.remoteAudioElement.remove();
      this.callStates.delete(callId);
      this.wiredRemoteAudioCalls.delete(callId);
    }

    this.tonePlayer.dispose();
  }

  private async playTone(
    callId: CallId,
    correlationId: CorrelationId,
    kind: "ringtone" | "ringback" | "busy",
    operation: string,
  ): Promise<Result<void, PlatformError>> {
    return this.runMediaOperation(callId, correlationId, operation, async () => {
      await this.tonePlayer.play(callId, kind);
      this.logger.info("browser_media_tone_started", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation,
        callId,
        toneKind: kind,
        result: "succeeded",
      });
    });
  }

  private async setCallMuted(
    callId: CallId,
    correlationId: CorrelationId,
    muted: boolean,
    operation: string,
  ): Promise<Result<void, PlatformError>> {
    return this.runMediaOperation(callId, correlationId, operation, () => {
      const connection = this.getPeerConnection(callId);
      if (connection === null || connection === undefined) {
        return err(
          createPlatformError(
            "operation_failed",
            `${muted ? "Mute" : "Unmute"} failed for ${callId}: peer connection not found`,
          ),
        );
      }

      const changed = setLocalAudioTracksEnabled(connection, !muted);
      if (!changed) {
        return err(
          createPlatformError(
            "operation_failed",
            `${muted ? "Mute" : "Unmute"} failed for ${callId}: no local audio track`,
          ),
        );
      }

      if (muted) {
        this.mutedCalls.add(callId);
      } else {
        this.mutedCalls.delete(callId);
      }

      this.logger.info("browser_media_call_mute_changed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Media",
        operation,
        callId,
        muted,
        result: "succeeded",
      });
      return ok(undefined);
    });
  }

  private tryEnsureRemoteAudioElement(
    callId: CallId,
  ): Result<HTMLAudioElement, PlatformError> {
    const existing = this.callStates.get(callId);
    if (existing !== undefined) {
      return ok(existing.remoteAudioElement);
    }

    const rootResult = this.resolveRootElement();
    if (!rootResult.ok) {
      return rootResult;
    }

    const audioElement = document.createElement("audio");
    audioElement.dataset["callId"] = callId;
    audioElement.autoplay = true;
    audioElement.setAttribute("playsinline", "true");
    audioElement.style.display = "none";
    rootResult.value.appendChild(audioElement);

    this.callStates.set(callId, {
      remoteAudioElement: audioElement,
    });

    return ok(audioElement);
  }

  private resolveRootElement(): Result<HTMLElement, PlatformError> {
    if (this.explicitRootElement !== undefined) {
      return ok(this.explicitRootElement);
    }

    if (this.resolvedRootElement !== null) {
      return ok(this.resolvedRootElement);
    }

    if (typeof document === "undefined") {
      return err(
        createPlatformError(
          "operation_failed",
          "BrowserMediaAdapter requires a DOM document in the renderer process",
        ),
      );
    }

    this.resolvedRootElement = document.body;
    return ok(this.resolvedRootElement);
  }

  private async runMediaOperation(
    callId: CallId,
    correlationId: CorrelationId,
    operation: string,
    action: () => Promise<Result<void, PlatformError> | void> | Result<void, PlatformError> | void,
  ): Promise<Result<void, PlatformError>> {
    try {
      const result = await action();
      if (result !== undefined && !result.ok) {
        this.logger.error(
          "browser_media_operation_failed",
          {
            correlationId,
            featureId: FEATURE_ID,
            boundedContext: "Media",
            operation,
            callId,
            result: result.error.code,
          },
          result.error,
        );
        return result;
      }

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);

      this.logger.error(
        "browser_media_operation_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Media",
          operation,
          callId,
          result: normalized.code,
        },
        error,
      );

      return err(normalized);
    }
  }
}
