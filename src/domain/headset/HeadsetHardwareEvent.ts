/**
 * - Purpose: normalized headset hardware events from adapters.
 * - Inputs: HID/vendor edge detections mapped by adapters.
 * - Outputs: discriminated union consumed by HeadsetSessionOrchestrator.
 */
export type HeadsetHardwareEvent = Readonly<
  | { type: "hookOff" }
  | { type: "hookOn" }
  | { type: "muteChanged"; muted: boolean }
  | { type: "holdPressed" }
  | { type: "deviceError"; reason: string }
>;
