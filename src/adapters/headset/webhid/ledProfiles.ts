import type { HidLedProfile } from "../types/HidLedProfile.js";
import {
  HID_OUTPUT_REPORT_ID_DEFAULT,
  HID_USAGE_PAGE_LED,
  PLANTRONICS_BW3320_LED_MUTE_REPORT_ID,
  PLANTRONICS_BW3320_LED_OFF_HOOK_REPORT_ID,
  PLANTRONICS_BW3320_LED_RING_REPORT_ID,
} from "./hidConstants.js";
import type { HidLedState } from "./hidTypes.js";

/**
 * - Purpose: shared LED encode/send profiles for Web HID vendors.
 * - Inputs: HidLedState and optional HIDDevice collections.
 * - Outputs: HidLedProfile instances used by vendor profiles.
 */

export const jabraEvolveLedProfile: HidLedProfile = {
  reportId: 2,
  encode: (state: HidLedState): Uint8Array => {
    let bits = 0;
    if (state.offHook) bits |= 0x01;
    if (state.mute) bits |= 0x02 | 0x10;
    if (state.ringing) bits |= 0x04 | 0x20;
    return new Uint8Array([bits, 0x00]);
  },
};

function findLedReportIdInCollections(device: HIDDevice): number | null {
  const visit = (collections: HIDCollectionInfo[]): number | null => {
    for (const collection of collections) {
      const ledOutput = collection.outputReports.find(
        (report) => report.reportId !== undefined,
      );
      if (collection.usagePage === HID_USAGE_PAGE_LED && ledOutput?.reportId !== undefined) {
        return ledOutput.reportId;
      }
      const child = visit(collection.children);
      if (child !== null) {
        return child;
      }
    }
    return null;
  };
  return visit(device.collections);
}

export function createStandardLedProfile(device: HIDDevice): HidLedProfile {
  return {
    reportId: findLedReportIdInCollections(device) ?? HID_OUTPUT_REPORT_ID_DEFAULT,
    encode: (state: HidLedState): Uint8Array => {
      const byte =
        (state.mute ? 0x01 : 0) |
        (state.offHook ? 0x02 : 0) |
        (state.ringing ? 0x04 : 0);
      return new Uint8Array([byte]);
    },
  };
}

async function sendPolyBw3320LedState(
  device: HIDDevice,
  state: HidLedState,
): Promise<boolean> {
  const targets = [
    { reportId: PLANTRONICS_BW3320_LED_MUTE_REPORT_ID, active: state.mute },
    { reportId: PLANTRONICS_BW3320_LED_OFF_HOOK_REPORT_ID, active: state.offHook },
    { reportId: PLANTRONICS_BW3320_LED_RING_REPORT_ID, active: state.ringing },
  ];
  let sent = false;
  for (const target of targets) {
    try {
      await device.sendReport(target.reportId, new Uint8Array([target.active ? 1 : 0]));
      sent = true;
    } catch {
      // Continue with remaining LED reports.
    }
  }
  return sent;
}

export const polyBw3320LedProfile: HidLedProfile = {
  reportId: PLANTRONICS_BW3320_LED_MUTE_REPORT_ID,
  encode: () => new Uint8Array([0]),
  sendState: sendPolyBw3320LedState,
};
