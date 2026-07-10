import {
  HID_INPUT_REPORT_ID_DEFAULT,
  JABRA_HSC016_HOOK_REPORT_ID,
  JABRA_HSC016_LEGACY_MUTE_MASK,
  JABRA_HSC016_LEGACY_MUTE_REPORT_ID,
  JABRA_HSC016_MUTE_MASK,
  JABRA_HSC016_OFF_HOOK_MASK,
  JABRA_HSC016_ON_HOOK_MASK,
  JABRA_HSC016_PRODUCT_IDS,
  JABRA_HSC016_VOLUME_REPORT_ID,
  PLANTRONICS_BW3320_HOOK_MASK,
  PLANTRONICS_BW3320_MUTE_MASK,
  PLANTRONICS_BW3320_PRODUCT_IDS,
  PLANTRONICS_BW3320_TELEPHONY_REPORT_ID,
} from "./hidConstants.js";
import type { HidReportParser, HidTelephonyUpdate } from "./hidTypes.js";

function parseStandardTelephonyByte(byte0: number): HidTelephonyUpdate {
  return {
    hookSwitch: (byte0 & 0x01) !== 0,
    phoneMute: (byte0 & 0x02) !== 0,
  };
}

const jabraHsc016Parser: HidReportParser = {
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

const jabraParser: HidReportParser = {
  vendor: "jabra",
  supportsHold: false,
  // Many Jabra telephony reports pulse mute (press/release); treat as pulse.
  muteInputMode: "pulse",
  parseUpdate(reportId: number, data: DataView): HidTelephonyUpdate | null {
    if (reportId === 1 || data.byteLength === 0) {
      return null;
    }
    if (reportId === 2) {
      const byte0 = data.getUint8(0);
      // Same press/release pair as HSC016 — do not treat as hook transitions.
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
      const parsed = parseStandardTelephonyByte(data.getUint8(0));
      return parsed;
    }
    return null;
  },
};

const plantronicsBw3320Parser: HidReportParser = {
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

const plantronicsParser: HidReportParser = {
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

const genericTelephonyParser: HidReportParser = {
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

export function resolveHidReportParser(device: HIDDevice): HidReportParser {
  if (device.vendorId === 0x0b0e && JABRA_HSC016_PRODUCT_IDS.has(device.productId)) {
    return jabraHsc016Parser;
  }
  if (device.vendorId === 0x047f && PLANTRONICS_BW3320_PRODUCT_IDS.has(device.productId)) {
    return plantronicsBw3320Parser;
  }
  if (device.vendorId === 0x0b0e) {
    return jabraParser;
  }
  if (device.vendorId === 0x047f) {
    return plantronicsParser;
  }
  return genericTelephonyParser;
}

export function resolveHeadsetCapabilitiesFromParser(
  parser: HidReportParser,
): import("@domain/index.js").HeadsetCapabilities {
  return {
    supportsAnswer: true,
    supportsReject: true,
    supportsHangup: true,
    supportsHold: parser.supportsHold,
    supportsMute: true,
    supportsOutgoingSignal: true,
    supportsIncomingSignal: true,
    supportsRejectOnHookOn: true,
    muteInputMode: parser.muteInputMode,
  };
}
