import type { HidLedProfile } from "../types/HidLedProfile.js";
import type { HidLedState } from "./hidTypes.js";
import { resolveHeadsetVendorProfile } from "./resolveHeadsetVendorProfile.js";

/**
 * - Purpose: send HID LED state using the resolved vendor profile.
 * - Inputs: HIDDevice, HidLedState.
 * - Outputs: success boolean; blocks further output on NotAllowedError.
 */

const ledOutputBlocked = new WeakSet<HIDDevice>();

export function isHidLedOutputBlocked(device: HIDDevice): boolean {
  return ledOutputBlocked.has(device);
}

export function resetHidLedOutputBlock(device: HIDDevice): void {
  ledOutputBlocked.delete(device);
}

function resolveLedOutputProfile(device: HIDDevice): HidLedProfile {
  return resolveHeadsetVendorProfile(device).ledProfile(device);
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
  resetHidLedOutputBlock(device);
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

export async function syncLedOnHold(
  device: HIDDevice,
  muted = false,
): Promise<boolean> {
  // Hold = ring pattern (offHook false). Green press then emits hookOff → resume.
  // Mute LED stays off on hold; session mute is restored on resume via setMute.
  return sendHidLedState(device, {
    mute: muted,
    offHook: false,
    ringing: true,
  });
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
