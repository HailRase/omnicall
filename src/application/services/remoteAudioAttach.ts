import { createRemoteAudioAttachedEvent } from "@domain/index.js";
import type { CallId } from "@domain/index.js";
import type { DomainEventPublisher, MediaGateway } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

type RemoteAudioAttachDeps = Readonly<{
  mediaGateway: MediaGateway;
  eventPublisher: DomainEventPublisher;
}>;

/**
 * - Purpose: attach remote WebRTC audio and emit domain event when wired.
 * - Inputs: call id, correlation id, media and event ports.
 * - Outputs: whether remote audio stream is attached to the audio element.
 */
export async function attachRemoteAudioWhenReady(
  deps: RemoteAudioAttachDeps,
  callId: CallId,
  correlationId: CorrelationId,
): Promise<boolean> {
  const attachResult = await deps.mediaGateway.attachRemoteAudio({
    callId,
    correlationId,
  });
  if (!attachResult.ok || attachResult.value !== "attached") {
    return false;
  }

  deps.eventPublisher.publish(
    createRemoteAudioAttachedEvent(correlationId, { callId }),
  );
  return true;
}
