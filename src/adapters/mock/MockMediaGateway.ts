import type {
  AttachRemoteAudioCommand,
  MediaGateway,
  MuteCallCommand,
  PlayBusyToneCommand,
  PlayFailedToneCommand,
  PlayIncomingRingtoneCommand,
  PlayRingtoneCommand,
  PlayRingbackToneCommand,
  RemoteAudioAttachOutcome,
  StopRingtoneCommand,
  StopToneCommand,
  UnmuteCallCommand,
} from "@ports/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type MockMediaScenario = "success" | "failure";

/**
 * - Purpose: emulate media side effects for tests and renderer bootstrap.
 * - Inputs: media commands for remote audio and tones.
 * - Outputs: operation result plus in-memory traces.
 */
export class MockMediaGateway implements MediaGateway {
  private scenario: MockMediaScenario;
  private readonly remoteAudioAttachedCalls = new Set<string>();
  private readonly ringbackCalls = new Set<string>();
  private readonly incomingRingtoneCalls = new Set<string>();
  private readonly busyToneCalls = new Set<string>();
  private readonly mutedCalls = new Set<string>();
  private readonly failureTones: string[] = [];

  constructor(scenario: MockMediaScenario = "success") {
    this.scenario = scenario;
  }

  setScenario(scenario: MockMediaScenario): void {
    this.scenario = scenario;
  }

  isRemoteAudioAttached(callId: string): boolean {
    return this.remoteAudioAttachedCalls.has(callId);
  }

  isRingbackPlaying(callId: string): boolean {
    return this.ringbackCalls.has(callId);
  }

  isIncomingRingtonePlaying(callId: string): boolean {
    return this.incomingRingtoneCalls.has(callId);
  }

  getFailureTones(): ReadonlyArray<string> {
    return this.failureTones;
  }

  isBusyTonePlaying(callId: string): boolean {
    return this.busyToneCalls.has(callId);
  }

  isMuted(callId: string): boolean {
    return this.mutedCalls.has(callId);
  }

  attachRemoteAudio(
    command: AttachRemoteAudioCommand,
  ): Promise<Result<RemoteAudioAttachOutcome, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Remote audio attach failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.remoteAudioAttachedCalls.add(command.callId);
    return Promise.resolve(ok("attached"));
  }

  playRingbackTone(
    command: PlayRingbackToneCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Ringback failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.ringbackCalls.add(command.callId);
    return Promise.resolve(ok(undefined));
  }

  playIncomingRingtone(
    command: PlayIncomingRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Incoming ringtone failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.incomingRingtoneCalls.add(command.callId);
    return Promise.resolve(ok(undefined));
  }

  playRingtone(command: PlayRingtoneCommand): Promise<Result<void, PlatformError>> {
    return this.playIncomingRingtone(command);
  }

  playFailedTone(
    command: PlayFailedToneCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Failure tone failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.failureTones.push(`${command.callId}:${command.reason}`);
    return Promise.resolve(ok(undefined));
  }

  playBusyTone(
    command: PlayBusyToneCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Busy tone failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.busyToneCalls.add(command.callId);
    return Promise.resolve(ok(undefined));
  }

  stopTone(
    command: StopToneCommand,
  ): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Stop tone failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.ringbackCalls.delete(command.callId);
    this.incomingRingtoneCalls.delete(command.callId);
    this.busyToneCalls.delete(command.callId);
    return Promise.resolve(ok(undefined));
  }

  stopRingtone(
    command: StopRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.stopTone(command);
  }

  muteCall(command: MuteCallCommand): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(createPlatformError("operation_failed", `Mute failed for ${command.callId}`)),
      );
    }

    this.mutedCalls.add(command.callId);
    return Promise.resolve(ok(undefined));
  }

  unmuteCall(command: UnmuteCallCommand): Promise<Result<void, PlatformError>> {
    if (this.scenario === "failure") {
      return Promise.resolve(
        err(
          createPlatformError(
            "operation_failed",
            `Unmute failed for ${command.callId}`,
          ),
        ),
      );
    }

    this.mutedCalls.delete(command.callId);
    return Promise.resolve(ok(undefined));
  }
}

