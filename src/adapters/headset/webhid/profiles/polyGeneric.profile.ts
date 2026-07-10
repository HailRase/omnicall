import type { HeadsetVendorProfile } from "../../types/HeadsetVendorProfile.js";
import { capabilitiesFromParser } from "../capabilitiesFromParser.js";
import {
  HID_INPUT_REPORT_ID_DEFAULT,
  HID_VENDOR_PLANTRONICS,
} from "../hidConstants.js";
import type { HidReportParser, HidTelephonyUpdate } from "../hidTypes.js";
import { createStandardLedProfile } from "../ledProfiles.js";

/**
 * - Purpose: generic Poly/Plantronics vendorId HID profile (non-BW3320).
 * - Inputs: HIDDevice with vendorId Plantronics.
 * - Outputs: standard telephony parser and collection-based LED.
 */

function parseStandardTelephonyByte(byte0: number): HidTelephonyUpdate {
  return {
    hookSwitch: (byte0 & 0x01) !== 0,
    phoneMute: (byte0 & 0x02) !== 0,
  };
}

const parser: HidReportParser = {
  vendor: "plantronics",
  supportsHold: false,
  muteInputMode: "latch",
  parseUpdate(reportId: number, data: DataView): HidTelephonyUpdate | null {
    if (reportId !== HID_INPUT_REPORT_ID_DEFAULT || data.byteLength === 0) {
      return null;
    }
    return parseStandardTelephonyByte(data.getUint8(0));
  },
};

export const polyGenericProfile: HeadsetVendorProfile = {
  id: "poly-generic",
  match: (device: HIDDevice): boolean => device.vendorId === HID_VENDOR_PLANTRONICS,
  parser,
  ledProfile: createStandardLedProfile,
  capabilities: capabilitiesFromParser(parser),
  quirks: {
    muteSemantics: "absolute",
    holdSemantics: "hookOffResumesWhenHoldLed",
  },
};
