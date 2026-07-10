/**
 * - Purpose: in-memory preferred softphone headset id for main HID picker.
 * - Inputs: softphone device id string or null from renderer IPC.
 * - Outputs: current preferred id for select-hid-device matching.
 */

let preferredSoftphoneHidDeviceId: string | null = null;

export function setPreferredSoftphoneHidDeviceId(deviceId: string | null): void {
  preferredSoftphoneHidDeviceId = deviceId;
}

export function getPreferredSoftphoneHidDeviceId(): string | null {
  return preferredSoftphoneHidDeviceId;
}
