import type { HeadsetHoldSemantics } from "@domain/index.js";

/**
 * - Purpose: map hookOff to hold resume under hold LED semantics.
 * - Inputs: hold semantics, focused-on-hold flag, hardware hold lock.
 * - Outputs: "resume" when hookOff should resume; otherwise null.
 */

export type { HeadsetHoldSemantics };

export function resolveHoldActionFromHookOff(options: Readonly<{
  holdSemantics: HeadsetHoldSemantics;
  focusedIsOnHold: boolean;
  hardwareHoldLocked: boolean;
}>): "resume" | null {
  if (options.holdSemantics === "dedicatedHoldButton") {
    return null;
  }
  if (!options.focusedIsOnHold || options.hardwareHoldLocked) {
    return null;
  }
  return "resume";
}
