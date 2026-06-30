import type { CallId } from "@domain/index.js";
import {
  resolveActiveTonePlayback,
  type TonePlaybackKind,
  type TonePlaybackRequest,
} from "@domain/index.js";
import type {
  MediaGateway,
  PlayBusyToneCommand,
  PlayFailedToneCommand,
  PlayIncomingRingtoneCommand,
  PlayRingbackToneCommand,
  PlayRingtoneCommand,
  ReleaseAllMediaCommand,
  StopRingtoneCommand,
  StopToneCommand,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

type ToneRequestState = Readonly<{
  kind: TonePlaybackKind;
  correlationId: CorrelationId;
  sequence: number;
  failedReason?: string;
}>;

type ActivePlayback = Readonly<{
  callId: CallId;
  kind: TonePlaybackKind;
}>;

/**
 * - Purpose: arbitrate tone playback requests and drive a single audible stream.
 * - Inputs: tone play/stop commands from orchestrators via MediaGateway surface.
 * - Outputs: delegated play/stop calls on the underlying media gateway.
 */
export class TonePlaybackCoordinator {
  private sequence = 0;
  private readonly requests = new Map<CallId, ToneRequestState>();
  private activePlayback: ActivePlayback | null = null;

  constructor(private readonly delegate: MediaGateway) {}

  getActivePlayback(): ActivePlayback | null {
    return this.activePlayback;
  }

  getPendingRequestCount(): number {
    return this.requests.size;
  }

  async playRingbackTone(
    command: PlayRingbackToneCommand,
  ): Promise<Result<void, PlatformError>> {
    this.registerRequest(command.callId, "ringback", command.correlationId);
    return this.reconcile(command.correlationId);
  }

  async playIncomingRingtone(
    command: PlayIncomingRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    this.registerRequest(command.callId, "ringtone", command.correlationId);
    return this.reconcile(command.correlationId);
  }

  async playRingtone(
    command: PlayRingtoneCommand,
  ): Promise<Result<void, PlatformError>> {
    return this.playIncomingRingtone(command);
  }

  async playBusyTone(
    command: PlayBusyToneCommand,
  ): Promise<Result<void, PlatformError>> {
    this.registerRequest(command.callId, "busy", command.correlationId);
    return this.reconcile(command.correlationId);
  }

  async playFailedTone(
    command: PlayFailedToneCommand,
  ): Promise<Result<void, PlatformError>> {
    this.registerRequest(command.callId, "failed", command.correlationId, {
      failedReason: command.reason,
    });
    return this.reconcile(command.correlationId);
  }

  async stopTone(command: StopToneCommand): Promise<Result<void, PlatformError>> {
    this.requests.delete(command.callId);
    return this.reconcile(command.correlationId);
  }

  async stopRingtone(command: StopRingtoneCommand): Promise<Result<void, PlatformError>> {
    return this.stopTone(command);
  }

  async releaseAll(command: ReleaseAllMediaCommand): Promise<Result<void, PlatformError>> {
    this.requests.clear();
    const stopResult = await this.stopActivePlayback(command.correlationId);
    if (!stopResult.ok) {
      return stopResult;
    }

    return this.delegate.releaseAll(command);
  }

  private registerRequest(
    callId: CallId,
    kind: TonePlaybackKind,
    correlationId: CorrelationId,
    options: Readonly<{ failedReason?: string }> = {},
  ): void {
    this.sequence += 1;
    this.requests.set(callId, {
      kind,
      correlationId,
      sequence: this.sequence,
      ...(options.failedReason !== undefined ? { failedReason: options.failedReason } : {}),
    });
  }

  private async reconcile(
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const winner = resolveActiveTonePlayback(this.toArbiterRequests());
    if (this.isSamePlayback(winner, this.activePlayback)) {
      return ok(undefined);
    }

    const stopResult = await this.stopActivePlayback(correlationId);
    if (!stopResult.ok) {
      return stopResult;
    }

    if (winner === null) {
      return ok(undefined);
    }

    const playResult = await this.playWinner(winner);
    if (!playResult.ok) {
      return playResult;
    }

    this.activePlayback = {
      callId: winner.callId,
      kind: winner.kind,
    };
    return ok(undefined);
  }

  private toArbiterRequests(): ReadonlyArray<TonePlaybackRequest> {
    const requests: TonePlaybackRequest[] = [];
    for (const [callId, state] of this.requests) {
      requests.push({
        callId,
        kind: state.kind,
        sequence: state.sequence,
      });
    }
    return requests;
  }

  private isSamePlayback(
    winner: TonePlaybackRequest | null,
    activePlayback: ActivePlayback | null,
  ): boolean {
    if (winner === null) {
      return activePlayback === null;
    }

    if (activePlayback === null) {
      return false;
    }

    return winner.callId === activePlayback.callId && winner.kind === activePlayback.kind;
  }

  private async stopActivePlayback(
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    if (this.activePlayback === null) {
      return ok(undefined);
    }

    const stopResult = await this.delegate.stopTone({
      callId: this.activePlayback.callId,
      correlationId,
    });
    if (!stopResult.ok) {
      return stopResult;
    }

    this.activePlayback = null;
    return ok(undefined);
  }

  private async playWinner(
    winner: TonePlaybackRequest,
  ): Promise<Result<void, PlatformError>> {
    const state = this.requests.get(winner.callId);
    if (state === undefined) {
      return ok(undefined);
    }

    switch (winner.kind) {
      case "ringtone":
        return this.delegate.playIncomingRingtone({
          callId: winner.callId,
          correlationId: state.correlationId,
        });
      case "ringback":
        return this.delegate.playRingbackTone({
          callId: winner.callId,
          correlationId: state.correlationId,
        });
      case "busy":
        return this.delegate.playBusyTone({
          callId: winner.callId,
          correlationId: state.correlationId,
        });
      case "failed":
        return this.delegate.playFailedTone({
          callId: winner.callId,
          correlationId: state.correlationId,
          reason: state.failedReason ?? "unknown",
        });
    }
  }
}
