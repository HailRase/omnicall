import type { HeadsetVendorProfile } from "../../types/HeadsetVendorProfile.js";
import { capabilitiesFromParser } from "../capabilitiesFromParser.js";
import {
  HID_INPUT_REPORT_ID_DEFAULT,
  HID_VENDOR_JABRA,
} from "../hidConstants.js";
import type { HidReportParser, HidTelephonyUpdate } from "../hidTypes.js";
import { createStandardLedProfile, jabraEvolveLedProfile } from "../ledProfiles.js";
import { jabraSyntheticEventsOnFirstReport } from "../quirks/jabraFirstReportQuirk.js";

/**
 * - Purpose: generic Jabra vendorId HID profile (non-HSC016).
 * - Inputs: HIDDevice with vendorId Jabra.
 * - Outputs: generic Jabra parser; Evolve LED when productName matches.
 */

function parseStandardTelephonyByte(byte0: number): HidTelephonyUpdate {
  return {
    hookSwitch: (byte0 & 0x01) !== 0,
    phoneMute: (byte0 & 0x02) !== 0,
  };
}

const parser: HidReportParser = {
  vendor: "jabra",
  supportsHold: false,
  muteInputMode: "pulse",
  parseUpdate(reportId: number, data: DataView): HidTelephonyUpdate | null {
    if (reportId === 1 || data.byteLength === 0) {
      return null;
    }
    if (reportId === 2) {
      const byte0 = data.getUint8(0);
      if (byte0 === 0x07 || byte0 === 0x03) {
        return { phoneMute: (byte0 & 0x04) !== 0 };
      }
      return {
        hookSwitch: (byte0 & 0x01) !== 0,
        phoneMute: (byte0 & 0x04) !== 0,
      };
    }
    if (reportId === 3) {
      return { phoneMute: (data.getUint8(0) & 0x08) !== 0 };
    }
    if (reportId === HID_INPUT_REPORT_ID_DEFAULT) {
      return parseStandardTelephonyByte(data.getUint8(0));
    }
    return null;
  },
};

export const jabraEvolveProfile: HeadsetVendorProfile = {
  id: "jabra-evolve",
  match: (device: HIDDevice): boolean => device.vendorId === HID_VENDOR_JABRA,
  parser,
  ledProfile: (device: HIDDevice) =>
    device.productName.toLowerCase().includes("evolve")
      ? jabraEvolveLedProfile
      : createStandardLedProfile(device),
  capabilities: capabilitiesFromParser(parser),
  quirks: {
    muteSemantics: "absolute",
    holdSemantics: "hookOffResumesWhenHoldLed",
    syntheticEventsOnFirstReport: jabraSyntheticEventsOnFirstReport,
  },
};
