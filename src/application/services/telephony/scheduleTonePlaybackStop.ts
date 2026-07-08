import { createToneStoppedEvent } from "@domain/index.js";
import type { CallId } from "@domain/index.js";
import type { DomainEventPublisher, MediaGateway } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

const scheduledToneStopTimers = new Map<string, ReturnType<typeof setTimeout>>();

export type ScheduleTonePlaybackStopDeps = Readonly<{
  mediaGateway: MediaGateway;
  eventPublisher: DomainEventPublisher;
}>;

/**
 * - Purpose: stop active call tones after bounded playback and update projections.
 * - Inputs: call id, correlation id, playback duration, media and event ports.
 * - Outputs: scheduled timer; prior timer for same call id is replaced.
 */
export function scheduleTonePlaybackStop(
  deps: ScheduleTonePlaybackStopDeps,
  callId: CallId,
  correlationId: CorrelationId,
  durationMs: number,
): void {
  cancelScheduledTonePlaybackStop(callId);

  const timer = setTimeout(() => {
    scheduledToneStopTimers.delete(callId);
    void deps.mediaGateway.stopTone({ callId, correlationId });
    deps.eventPublisher.publish(
      createToneStoppedEvent(correlationId, {
        callId,
      }),
    );
  }, durationMs);

  scheduledToneStopTimers.set(callId, timer);
}

export function cancelScheduledTonePlaybackStop(callId: CallId): void {
  const timer = scheduledToneStopTimers.get(callId);
  if (timer === undefined) {
    return;
  }

  clearTimeout(timer);
  scheduledToneStopTimers.delete(callId);
}
