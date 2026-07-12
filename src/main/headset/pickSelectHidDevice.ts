/**
 * - Purpose: pick Electron HID deviceId for select-hid-device using softphone preferred id.
 * - Inputs: Electron deviceList candidates; optional softphone id `vendorId:productId:name`.
 * - Outputs: Electron deviceId string, or empty when list is empty.
 */

export type SelectHidDeviceCandidate = Readonly<{
  deviceId: string;
  name: string;
  vendorId: number;
  productId: number;
}>;

export function parseSoftphoneHidDeviceId(
  deviceId: string,
): Readonly<{ vendorId: number; productId: number; productName: string }> | null {
  const firstColon = deviceId.indexOf(":");
  if (firstColon <= 0) {
    return null;
  }
  const secondColon = deviceId.indexOf(":", firstColon + 1);
  if (secondColon <= firstColon + 1 || secondColon >= deviceId.length - 1) {
    return null;
  }
  const vendorId = Number.parseInt(deviceId.slice(0, firstColon), 10);
  const productId = Number.parseInt(deviceId.slice(firstColon + 1, secondColon), 10);
  const productName = deviceId.slice(secondColon + 1);
  if (!Number.isFinite(vendorId) || !Number.isFinite(productId) || productName.length === 0) {
    return null;
  }
  return { vendorId, productId, productName };
}

export function pickSelectHidDeviceId(
  deviceList: ReadonlyArray<SelectHidDeviceCandidate>,
  preferredSoftphoneId: string | null | undefined,
): string {
  if (deviceList.length === 0) {
    return "";
  }

  if (preferredSoftphoneId !== null && preferredSoftphoneId !== undefined) {
    const parsed = parseSoftphoneHidDeviceId(preferredSoftphoneId);
    if (parsed !== null) {
      const preferred = deviceList.find(
        (device) =>
          device.vendorId === parsed.vendorId &&
          device.productId === parsed.productId &&
          device.name === parsed.productName,
      );
      if (preferred !== undefined) {
        return preferred.deviceId;
      }
    }
  }

  return deviceList[0]?.deviceId ?? "";
}
