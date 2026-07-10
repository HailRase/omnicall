import type {
  HeadsetCapabilities,
  HeadsetHardwareEvent,
  HeadsetHoldSemantics,
  HeadsetMuteSemantics,
} from "@domain/index.js";
import type { HidReportParser, HidTelephonyUpdate } from "../webhid/hidTypes.js";
import type { HidLedProfile } from "./HidLedProfile.js";

/**
 * - Purpose: per-vendor Web HID headset profile (match, parser, LED, quirks).
 * - Inputs: HIDDevice for match and LED resolution.
 * - Outputs: parser, capabilities, LED profile, optional first-report quirks.
 */
export type HeadsetVendorProfile = Readonly<{
  id: string;
  match: (device: HIDDevice) => boolean;
  parser: HidReportParser;
  /** Device-aware: standard LED discovers reportId from collections. */
  ledProfile: (device: HIDDevice) => HidLedProfile;
  capabilities: HeadsetCapabilities;
  quirks?: Readonly<{
    syntheticEventsOnFirstReport?: (
      update: HidTelephonyUpdate,
    ) => ReadonlyArray<HeadsetHardwareEvent>;
    muteSemantics?: HeadsetMuteSemantics;
    holdSemantics?: HeadsetHoldSemantics;
  }>;
}>;
