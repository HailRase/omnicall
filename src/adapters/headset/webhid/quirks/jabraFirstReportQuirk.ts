import type { HeadsetHardwareEvent } from "@domain/index.js";
import type { HidTelephonyUpdate } from "../hidTypes.js";

/**
 * - Purpose: Jabra first-report hookOff when device already off-hook.
 * - Inputs: first HidTelephonyUpdate after attach.
 * - Outputs: synthetic hookOff events or empty list.
 */
export function jabraSyntheticEventsOnFirstReport(
  update: HidTelephonyUpdate,
): ReadonlyArray<HeadsetHardwareEvent> {
  if (update.hookSwitch === true) {
    return [{ type: "hookOff" }];
  }
  return [];
}
