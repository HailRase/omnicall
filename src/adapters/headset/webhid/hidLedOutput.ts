import {
  HID_OUTPUT_REPORT_ID_DEFAULT,
  HID_USAGE_PAGE_LED,
  HID_VENDOR_JABRA,
  JABRA_HSC016_PRODUCT_IDS,
  PLANTRONICS_BW3320_LED_MUTE_REPORT_ID,
  PLANTRONICS_BW3320_LED_OFF_HOOK_REPORT_ID,
  PLANTRONICS_BW3320_LED_RING_REPORT_ID,
  PLANTRONICS_BW3320_PRODUCT_IDS,
} from "./hidConstants.js";
import type { HidLedState } from "./hidTypes.js";

type LedOutputProfile = Readonly<{
  reportId: number;
  encode: (state: HidLedState) => Uint8Array;
  sendState?: (device: HIDDevice, state: HidLedState) => Promise<boolean>;
}>;

const ledOutputBlocked = new WeakSet<HIDDevice>();

const jabraEvolveLedProfile: LedOutputProfile = {
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

function createStandardLedProfile(device: HIDDevice): LedOutputProfile {
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

const polyBw3320LedProfile: LedOutputProfile = {
  reportId: PLANTRONICS_BW3320_LED_MUTE_REPORT_ID,
  encode: () => new Uint8Array([0]),
  sendState: sendPolyBw3320LedState,
};

function resolveLedOutputProfile(device: HIDDevice): LedOutputProfile {
  if (
    device.vendorId === HID_VENDOR_JABRA &&
    (JABRA_HSC016_PRODUCT_IDS.has(device.productId) ||
      device.productName.toLowerCase().includes("evolve"))
  ) {
    return jabraEvolveLedProfile;
  }
  if (PLANTRONICS_BW3320_PRODUCT_IDS.has(device.productId)) {
    return polyBw3320LedProfile;
  }
  return createStandardLedProfile(device);
}

export async function sendHidLedState(
  device: HIDDevice,
  state: HidLedState,
): Promise<boolean> {
  if (!device.opened || ledOutputBlocked.has(device)) {
    return false;
  }
  const profile = resolveLedOutputProfile(device);
  try {
    if (profile.sendState !== undefined) {
      return await profile.sendState(device, state);
    }
    await device.sendReport(profile.reportId, profile.encode(state) as BufferSource);
    return true;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      ledOutputBlocked.add(device);
      return false;
    }
    return false;
  }
}

export async function performTelephonyHandshake(device: HIDDevice): Promise<void> {
  await sendHidLedState(device, { mute: false, offHook: false, ringing: false });
}

export async function syncLedIncomingRing(device: HIDDevice): Promise<boolean> {
  return sendHidLedState(device, { mute: false, offHook: false, ringing: true });
}

export async function syncLedAfterAnswer(device: HIDDevice): Promise<boolean> {
  return sendHidLedState(device, { mute: false, offHook: true, ringing: false });
}

export async function syncLedAfterHangup(device: HIDDevice): Promise<boolean> {
  return sendHidLedState(device, { mute: false, offHook: false, ringing: false });
}

export async function syncLedOnHold(device: HIDDevice): Promise<boolean> {
  return sendHidLedState(device, { mute: false, offHook: false, ringing: true });
}

export async function syncLedMute(
  device: HIDDevice,
  isMuted: boolean,
  isOffHook = true,
): Promise<boolean> {
  return sendHidLedState(device, {
    mute: isMuted,
    offHook: isOffHook,
    ringing: false,
  });
}
