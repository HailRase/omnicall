/**
 * - Purpose: resolve initial session view for a video-mode call from user prefs.
 * - Inputs: media mode, remote number, default view, auto-fullscreen prefs.
 * - Outputs: SessionViewMode to apply after CallMediaModeSelected.
 */

import { DEFAULT_SESSION_VIEW_MODE, type SessionViewMode } from "./SessionViewMode.js";
import type { CallMediaMode } from "./CallMediaMode.js";

export type ResolveInitialSessionViewInput = Readonly<{
  mediaMode: CallMediaMode;
  remoteNumber: string;
  defaultSessionView: SessionViewMode;
  autoFullscreenOnConference: boolean;
  conferenceNumberSubstring: string | null;
}>;

/**
 * - Purpose: pick compact/expanded/fullscreen for a new call.
 * - Inputs: ResolveInitialSessionViewInput.
 * - Outputs: SessionViewMode (audio calls keep default compact).
 */
export function resolveInitialSessionView(
  input: ResolveInitialSessionViewInput,
): SessionViewMode {
  if (input.mediaMode !== "video") {
    return DEFAULT_SESSION_VIEW_MODE;
  }

  const substring = input.conferenceNumberSubstring?.trim() ?? "";
  if (
    input.autoFullscreenOnConference &&
    substring.length > 0 &&
    input.remoteNumber.includes(substring)
  ) {
    return "fullscreen";
  }

  return input.defaultSessionView;
}
