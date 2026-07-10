/**
 * - Purpose: choose a granted HID device for auto-reconnect.
 * - Inputs: granted devices with stable ids; optional preferred device id.
 * - Outputs: matching preferred device, else first granted, else undefined.
 */
export function pickGrantedHidDevice<T extends Readonly<{ id: string }>>(
  granted: ReadonlyArray<T>,
  preferredDeviceId: string | null | undefined,
): T | undefined {
  if (preferredDeviceId !== null && preferredDeviceId !== undefined) {
    const preferred = granted.find((device) => device.id === preferredDeviceId);
    if (preferred !== undefined) {
      return preferred;
    }
  }
  return granted[0];
}
