/**
 * - Purpose: switch outbound video source between camera and screen share.
 * - Inputs: call id, source, mute intent, optional device id.
 * - Outputs: updated CallVideoMediaState or normalized failure.
 */

import {
  createLocalVideoSourceChangedEvent,
  createLocalVideoMutedChangedEvent,
  isScreenShareAllowed,
  type CallId,
  type CallVideoMediaState,
  type LocalVideoSource,
} from "@domain/index.js";
import type { DomainEventPublisher, LocalMediaCapturePort, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallVideoMediaProjection } from "../../projections/media/CallVideoMediaProjection.js";

export type SwitchLocalVideoSourceInput = Readonly<{
  callId: CallId;
  source: Exclude<LocalVideoSource, "none">;
  muted: boolean;
  videoDeviceId?: string;
  correlationId?: CorrelationId;
}>;

export class SwitchLocalVideoSourceUseCase {
  constructor(
    private readonly localMediaCapturePort: LocalMediaCapturePort,
    private readonly videoMediaProjection: CallVideoMediaProjection,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: SwitchLocalVideoSourceInput,
  ): Promise<Result<CallVideoMediaState, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const current = this.videoMediaProjection.getByCallId(input.callId);
    if (current === null || current.mediaMode !== "video") {
      return err(createPlatformError("operation_failed", "video_media_not_active"));
    }
    if (input.source === "screen" && !isScreenShareAllowed(current)) {
      return err(
        createPlatformError("operation_failed", "screen_share_requires_expanded_view"),
      );
    }

    const mediaResult = await this.localMediaCapturePort.replaceOutboundVideoTrack({
      callId: input.callId,
      source: input.source,
      muted: input.muted,
      correlationId,
      ...(input.videoDeviceId !== undefined
        ? { videoDeviceId: input.videoDeviceId }
        : {}),
    });
    if (!mediaResult.ok) {
      return err(mediaResult.error);
    }

    const withSource = this.videoMediaProjection.setLocalVideoSourceState(
      input.callId,
      input.source,
    );
    if (withSource === null) {
      return err(createPlatformError("operation_failed", "video_media_state_missing"));
    }
    const next =
      this.videoMediaProjection.setLocalVideoMutedState(input.callId, input.muted) ??
      withSource;

    this.eventPublisher.publish(
      createLocalVideoSourceChangedEvent(correlationId, input.callId, input.source),
    );
    this.eventPublisher.publish(
      createLocalVideoMutedChangedEvent(correlationId, input.callId, input.muted),
    );
    this.logger.info("switch_local_video_source_succeeded", {
      correlationId,
      featureId: "F-027",
      boundedContext: "Media",
      operation: "switch_local_video_source",
      callId: input.callId,
      result: "succeeded",
      source: input.source,
    });
    return ok(next);
  }
}
