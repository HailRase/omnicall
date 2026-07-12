/**
 * - Purpose: toggle local camera mute for a video-mode call via Media capture port.
 * - Inputs: call id, muted flag, optional device id and correlation id.
 * - Outputs: updated CallVideoMediaState or normalized failure.
 */

import {
  createLocalVideoMutedChangedEvent,
  type CallId,
  type CallVideoMediaState,
} from "@domain/index.js";
import type { DomainEventPublisher, LocalMediaCapturePort, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallVideoMediaProjection } from "../../projections/media/CallVideoMediaProjection.js";

export type SetLocalVideoMutedInput = Readonly<{
  callId: CallId;
  muted: boolean;
  videoDeviceId?: string;
  correlationId?: CorrelationId;
}>;

export class SetLocalVideoMutedUseCase {
  constructor(
    private readonly localMediaCapturePort: LocalMediaCapturePort,
    private readonly videoMediaProjection: CallVideoMediaProjection,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: SetLocalVideoMutedInput,
  ): Promise<Result<CallVideoMediaState, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const current = this.videoMediaProjection.getByCallId(input.callId);
    if (current === null || current.mediaMode !== "video") {
      return err(createPlatformError("operation_failed", "video_media_not_active"));
    }
    if (current.localVideoSource === "screen") {
      return err(
        createPlatformError(
          "operation_failed",
          "camera_mute_blocked_during_screen_share",
        ),
      );
    }

    const mediaResult = await this.localMediaCapturePort.setLocalVideoMuted({
      callId: input.callId,
      muted: input.muted,
      correlationId,
      ...(input.videoDeviceId !== undefined
        ? { videoDeviceId: input.videoDeviceId }
        : {}),
    });
    if (!mediaResult.ok) {
      this.logger.error(
        "set_local_video_muted_failed",
        {
          correlationId,
          featureId: "F-027",
          boundedContext: "Media",
          operation: "set_local_video_muted",
          callId: input.callId,
          result: mediaResult.error.code,
        },
        mediaResult.error,
      );
      return err(mediaResult.error);
    }

    const next = this.videoMediaProjection.setLocalVideoMutedState(
      input.callId,
      input.muted,
    );
    if (next === null) {
      return err(createPlatformError("operation_failed", "video_media_state_missing"));
    }

    this.eventPublisher.publish(
      createLocalVideoMutedChangedEvent(correlationId, input.callId, input.muted),
    );
    this.logger.info("set_local_video_muted_succeeded", {
      correlationId,
      featureId: "F-027",
      boundedContext: "Media",
      operation: "set_local_video_muted",
      callId: input.callId,
      result: "succeeded",
      muted: input.muted,
    });
    return ok(next);
  }
}
