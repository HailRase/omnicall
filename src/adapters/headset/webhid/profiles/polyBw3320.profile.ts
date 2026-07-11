import type { HeadsetVendorProfile } from "../../types/HeadsetVendorProfile.js";
import { capabilitiesFromParser } from "../capabilitiesFromParser.js";
import {
  HID_VENDOR_PLANTRONICS,
  PLANTRONICS_BW3320_HOOK_MASK,
  PLANTRONICS_BW3320_MUTE_MASK,
  PLANTRONICS_BW3320_PRODUCT_IDS,
  PLANTRONICS_BW3320_TELEPHONY_REPORT_ID,
} from "../hidConstants.js";
import type { HidReportParser, HidTelephonyUpdate } from "../hidTypes.js";
import { polyBw3320LedProfile } from "../ledProfiles.js";

/**
 * - Purpose: Poly/Plantronics BW3320 product-family HID profile.
 * - Inputs: HIDDevice match via vendorId + productId set.
 * - Outputs: latch mute parser and multi-report LED sender.
 */

const parser: HidReportParser = {
  vendor: "plantronics",
  supportsHold: false,
  muteInputMode: "latch",
  parseUpdate(reportId: number, data: DataView): HidTelephonyUpdate | null {
    if (reportId !== PLANTRONICS_BW3320_TELEPHONY_REPORT_ID || data.byteLength === 0) {
      return null;
    }
    const value = data.getUint8(0);
    return {
      hookSwitch: (value & PLANTRONICS_BW3320_HOOK_MASK) !== 0,
      phoneMute: (value & PLANTRONICS_BW3320_MUTE_MASK) !== 0,
    };
  },
};

export const polyBw3320Profile: HeadsetVendorProfile = {
  id: "poly-bw3320",
  match: (device: HIDDevice): boolean =>
    device.vendorId === HID_VENDOR_PLANTRONICS &&
    PLANTRONICS_BW3320_PRODUCT_IDS.has(device.productId),
  parser,
  ledProfile: () => polyBw3320LedProfile,
  capabilities: {
    ...capabilitiesFromParser(parser),
    muteEchoPolicy: "swallowAll",
  },
  quirks: {
    muteSemantics: "absolute",
    holdSemantics: "hookOffResumesWhenHoldLed",
  },
};
