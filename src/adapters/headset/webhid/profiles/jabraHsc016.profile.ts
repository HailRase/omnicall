import type { HeadsetVendorProfile } from "../../types/HeadsetVendorProfile.js";
import { capabilitiesFromParser } from "../capabilitiesFromParser.js";
import {
  HID_VENDOR_JABRA,
  JABRA_HSC016_HOOK_REPORT_ID,
  JABRA_HSC016_LEGACY_MUTE_MASK,
  JABRA_HSC016_LEGACY_MUTE_REPORT_ID,
  JABRA_HSC016_MUTE_MASK,
  JABRA_HSC016_OFF_HOOK_MASK,
  JABRA_HSC016_ON_HOOK_MASK,
  JABRA_HSC016_PRODUCT_IDS,
  JABRA_HSC016_VOLUME_REPORT_ID,
} from "../hidConstants.js";
import type { HidReportParser, HidTelephonyUpdate } from "../hidTypes.js";
import { jabraEvolveLedProfile } from "../ledProfiles.js";
import { jabraSyntheticEventsOnFirstReport } from "../quirks/jabraFirstReportQuirk.js";

/**
 * - Purpose: Jabra HSC016 product-family HID profile.
 * - Inputs: HIDDevice match via vendorId + productId set.
 * - Outputs: parser, Evolve-style LED, first-report hookOff quirk.
 */

const parser: HidReportParser = {
  vendor: "jabra",
  supportsHold: false,
  muteInputMode: "pulse",
  parseUpdate(reportId: number, data: DataView): HidTelephonyUpdate | null {
    if (data.byteLength === 0) {
      return null;
    }
    if (reportId === JABRA_HSC016_VOLUME_REPORT_ID) {
      return null;
    }
    if (reportId === JABRA_HSC016_HOOK_REPORT_ID) {
      const byte0 = data.getUint8(0);
      if (byte0 === 0x07 || byte0 === 0x03) {
        return { phoneMute: (byte0 & JABRA_HSC016_MUTE_MASK) !== 0 };
      }
      if (byte0 === JABRA_HSC016_OFF_HOOK_MASK) {
        return { hookSwitch: true, phoneMute: (byte0 & JABRA_HSC016_MUTE_MASK) !== 0 };
      }
      if (byte0 === JABRA_HSC016_ON_HOOK_MASK || byte0 === 0) {
        return { hookSwitch: false, phoneMute: (byte0 & JABRA_HSC016_MUTE_MASK) !== 0 };
      }
      return { phoneMute: (byte0 & JABRA_HSC016_MUTE_MASK) !== 0 };
    }
    if (reportId === JABRA_HSC016_LEGACY_MUTE_REPORT_ID) {
      const byte0 = data.getUint8(0);
      if (byte0 & JABRA_HSC016_LEGACY_MUTE_MASK) {
        return { phoneMute: true };
      }
      if (byte0 === 0) {
        return { phoneMute: false };
      }
    }
    return null;
  },
};

export const jabraHsc016Profile: HeadsetVendorProfile = {
  id: "jabra-hsc016",
  match: (device: HIDDevice): boolean =>
    device.vendorId === HID_VENDOR_JABRA && JABRA_HSC016_PRODUCT_IDS.has(device.productId),
  parser,
  ledProfile: () => jabraEvolveLedProfile,
  capabilities: capabilitiesFromParser(parser),
  quirks: {
    muteSemantics: "absolute",
    holdSemantics: "hookOffResumesWhenHoldLed",
    syntheticEventsOnFirstReport: jabraSyntheticEventsOnFirstReport,
  },
};
