import type { CallId } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallTracker } from "./CallTracker.js";
import type { MediaGateway } from "@ports/index.js";

type StopTonesDeps = Readonly<{
  mediaGateway: MediaGateway;
  callTracker: CallTracker;
}>;

/**
 * - Purpose: stop non-priority line tones during active-line swaps.
 * - Inputs: priority call id, correlation id, media gateway, call tracker.
 * - Outputs: awaited stopTone calls on other tracked lines.
 */
export async function stopTonesOnOtherLines(
  deps: StopTonesDeps,
  priorityCallId: CallId,
  correlationId: CorrelationId,
): Promise<void> {
  for (const call of deps.callTracker.getAllTrackedCalls()) {
    if (call.id === priorityCallId) {
      continue;
    }
    await deps.mediaGateway.stopTone({ callId: call.id, correlationId });
  }
}
