import type { HeadsetVendorProfile } from "../../types/HeadsetVendorProfile.js";
import { capabilitiesFromParser } from "../capabilitiesFromParser.js";
import { HID_INPUT_REPORT_ID_DEFAULT } from "../hidConstants.js";
import type { HidReportParser, HidTelephonyUpdate } from "../hidTypes.js";
import { createStandardLedProfile } from "../ledProfiles.js";

/**
 * - Purpose: fallback HID telephony profile for unknown vendors.
 * - Inputs: any HIDDevice not matched by earlier profiles.
 * - Outputs: standard telephony byte parser; no first-report quirks.
 */

function parseStandardTelephonyByte(byte0: number): HidTelephonyUpdate {
  return {
    hookSwitch: (byte0 & 0x01) !== 0,
    phoneMute: (byte0 & 0x02) !== 0,
  };
}

const parser: HidReportParser = {
  vendor: "generic",
  supportsHold: false,
  muteInputMode: "pulse",
  parseUpdate(reportId: number, data: DataView): HidTelephonyUpdate | null {
    if (reportId !== HID_INPUT_REPORT_ID_DEFAULT || data.byteLength === 0) {
      return null;
    }
    return parseStandardTelephonyByte(data.getUint8(0));
  },
};

export const genericTelephonyProfile: HeadsetVendorProfile = {
  id: "generic-telephony",
  match: (): boolean => true,
  parser,
  ledProfile: createStandardLedProfile,
  capabilities: capabilitiesFromParser(parser),
  quirks: {
    muteSemantics: "absolute",
    holdSemantics: "hookOffResumesWhenHoldLed",
  },
};
