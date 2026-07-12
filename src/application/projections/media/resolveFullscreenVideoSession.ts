/**
 * - Purpose: find the call currently in fullscreen video session view (F-027).
 * - Inputs: callId → CallVideoMediaState map from UI projection.
 * - Outputs: call id + state, or null when no fullscreen video session.
 */

import type { CallVideoMediaState } from "@domain/index.js";

export type FullscreenVideoSession = Readonly<{
  callId: string;
  videoState: CallVideoMediaState;
}>;

/**
 * - Purpose: keep fullscreen layout/modal bound to the video session, not the selected line.
 * - Inputs: projection map (may include ringing/held lines).
 * - Outputs: first video+fullscreen entry, or null.
 */
export function resolveFullscreenVideoSession(
  byCallId: Readonly<Record<string, CallVideoMediaState>>,
): FullscreenVideoSession | null {
  for (const [callId, videoState] of Object.entries(byCallId)) {
    if (videoState.mediaMode === "video" && videoState.sessionView === "fullscreen") {
      return { callId, videoState };
    }
  }
  return null;
}
