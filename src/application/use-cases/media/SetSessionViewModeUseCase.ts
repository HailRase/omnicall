/**
 * - Purpose: change session view mode for a video call.
 * - Inputs: call id and SessionViewMode.
 * - Outputs: updated CallVideoMediaState or failure when call has no video state.
 */

import {
  createSessionViewModeChangedEvent,
  type CallId,
  type CallVideoMediaState,
  type SessionViewMode,
} from "@domain/index.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallVideoMediaProjection } from "../../projections/media/CallVideoMediaProjection.js";

export type SetSessionViewModeInput = Readonly<{
  callId: CallId;
  sessionView: SessionViewMode;
  correlationId?: CorrelationId;
}>;

export class SetSessionViewModeUseCase {
  constructor(
    private readonly videoMediaProjection: CallVideoMediaProjection,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  execute(
    input: SetSessionViewModeInput,
  ): Result<CallVideoMediaState, PlatformError> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const current = this.videoMediaProjection.getByCallId(input.callId);
    if (current === null || current.mediaMode !== "video") {
      return err(createPlatformError("operation_failed", "video_media_not_active"));
    }

    const next = this.videoMediaProjection.setSessionViewModeState(
      input.callId,
      input.sessionView,
    );
    if (next === null) {
      return err(createPlatformError("operation_failed", "video_media_state_missing"));
    }

    this.eventPublisher.publish(
      createSessionViewModeChangedEvent(
        correlationId,
        input.callId,
        input.sessionView,
      ),
    );
    this.logger.info("set_session_view_mode_succeeded", {
      correlationId,
      featureId: "F-027",
      boundedContext: "Media",
      operation: "set_session_view_mode",
      callId: input.callId,
      result: "succeeded",
      sessionView: input.sessionView,
    });
    return ok(next);
  }
}
