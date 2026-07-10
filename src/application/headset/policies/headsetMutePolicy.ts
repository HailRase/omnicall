import type { HeadsetMuteSemantics } from "@domain/index.js";

/**
 * - Purpose: decide whether a hardware muteChanged should change app mute.
 * - Inputs: mute semantics, event muted bit, focused session muted.
 * - Outputs: true when the orchestrator should apply a mute change.
 */

export type { HeadsetMuteSemantics };

export function shouldApplyHardwareMuteChange(
  semantics: HeadsetMuteSemantics,
  eventMuted: boolean,
  snapshotFocusedMuted: boolean,
): boolean {
  if (semantics === "toggle") {
    return true;
  }
  return eventMuted !== snapshotFocusedMuted;
}

export function resolveNextMutedForHardwareEvent(
  semantics: HeadsetMuteSemantics,
  eventMuted: boolean,
  snapshotFocusedMuted: boolean,
): boolean {
  if (semantics === "toggle") {
    return !snapshotFocusedMuted;
  }
  return eventMuted;
}
