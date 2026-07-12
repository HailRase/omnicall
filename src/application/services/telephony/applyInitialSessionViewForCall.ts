/**
 * - Purpose: apply default/auto session view after video media mode is selected.
 * - Inputs: call id, remote number, settings repository, video projection, events.
 * - Outputs: SessionViewModeChanged when video mode and prefs require a non-default view.
 */

import {
  createSessionViewModeChangedEvent,
  resolveInitialSessionView,
  type CallId,
  type CallMediaMode,
  type SessionViewMode,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  SettingsRepository,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallVideoMediaProjection } from "../../projections/media/CallVideoMediaProjection.js";
import { resolveSettingsAccountKey } from "../../settings/resolveSettingsAccountKey.js";

export type ApplyInitialSessionViewDeps = Readonly<{
  settingsRepository: SettingsRepository;
  videoMediaProjection: CallVideoMediaProjection;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
}>;

export async function applyInitialSessionViewForCall(
  deps: ApplyInitialSessionViewDeps,
  input: Readonly<{
    callId: CallId;
    mediaMode: CallMediaMode;
    remoteNumber: string;
    correlationId: CorrelationId;
  }>,
): Promise<SessionViewMode | null> {
  if (input.mediaMode !== "video") {
    return null;
  }

  const accountKey = await resolveSettingsAccountKey(deps.settingsRepository);
  const settings = await deps.settingsRepository.getUserSettings(accountKey);
  const sessionView = resolveInitialSessionView({
    mediaMode: input.mediaMode,
    remoteNumber: input.remoteNumber,
    defaultSessionView: settings.defaultSessionView,
    autoFullscreenOnConference: settings.autoFullscreenOnConference,
    conferenceNumberSubstring: settings.conferenceNumberSubstring,
  });

  const current = deps.videoMediaProjection.getByCallId(input.callId);
  if (current === null) {
    return null;
  }
  if (current.sessionView === sessionView) {
    return sessionView;
  }

  const next = deps.videoMediaProjection.setSessionViewModeState(
    input.callId,
    sessionView,
  );
  if (next === null) {
    return null;
  }

  deps.eventPublisher.publish(
    createSessionViewModeChangedEvent(
      input.correlationId,
      input.callId,
      sessionView,
    ),
  );
  deps.logger.info("initial_session_view_applied", {
    correlationId: input.correlationId,
    featureId: "F-027",
    boundedContext: "Media",
    operation: "apply_initial_session_view",
    callId: input.callId,
    result: "succeeded",
    sessionView,
  });
  return sessionView;
}
