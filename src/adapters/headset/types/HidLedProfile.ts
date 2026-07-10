import type { HidLedState } from "../webhid/hidTypes.js";

/**
 * - Purpose: vendor LED encode/send contract for Web HID output reports.
 * - Inputs: HidLedState; optional device for multi-report senders.
 * - Outputs: report bytes or sendState success flag.
 */
export type HidLedProfile = Readonly<{
  reportId: number;
  encode: (state: HidLedState) => Uint8Array;
  sendState?: (device: HIDDevice, state: HidLedState) => Promise<boolean>;
}>;
