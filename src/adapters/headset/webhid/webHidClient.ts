import { HID_DEVICE_FILTERS, HID_SUPPORTED_VENDOR_IDS } from "./hidConstants.js";
import { isWebHidSupported } from "./hidTypes.js";

function getNavigatorHid(): HID | null {
  if (!isWebHidSupported()) {
    return null;
  }
  return navigator.hid;
}

function isSupportedHidDevice(device: HIDDevice): boolean {
  return HID_SUPPORTED_VENDOR_IDS.has(device.vendorId);
}

export async function requestHidDevice(): Promise<HIDDevice | null> {
  const hid = getNavigatorHid();
  if (hid === null) {
    return null;
  }
  const devices = await hid.requestDevice({ filters: HID_DEVICE_FILTERS });
  const device = devices[0];
  if (device === undefined || !isSupportedHidDevice(device)) {
    return null;
  }
  return device;
}

export async function getGrantedHidDevices(): Promise<HIDDevice[]> {
  const hid = getNavigatorHid();
  if (hid === null) {
    return [];
  }
  const devices = await hid.getDevices();
  return devices.filter(isSupportedHidDevice);
}

export async function openHidDevice(device: HIDDevice): Promise<void> {
  if (!device.opened) {
    await device.open();
  }
}

export async function closeHidDevice(device: HIDDevice): Promise<void> {
  if (device.opened) {
    await device.close();
  }
}

export function subscribeInputReports(
  device: HIDDevice,
  handler: (event: HIDInputReportEvent) => void,
  signal: AbortSignal,
): void {
  const listener = (event: HIDInputReportEvent) => {
    if (event.device === device) {
      handler(event);
    }
  };
  device.addEventListener("inputreport", listener);
  signal.addEventListener("abort", () => {
    device.removeEventListener("inputreport", listener);
  });
}

export function subscribeHidConnectEvents(
  onConnect: (device: HIDDevice) => void,
  onDisconnect: (device: HIDDevice) => void,
  signal: AbortSignal,
): void {
  const hid = getNavigatorHid();
  if (hid === null) {
    return;
  }
  const handleConnect = (event: HIDConnectionEvent) => {
    if (isSupportedHidDevice(event.device)) {
      onConnect(event.device);
    }
  };
  const handleDisconnect = (event: HIDConnectionEvent) => {
    if (isSupportedHidDevice(event.device)) {
      onDisconnect(event.device);
    }
  };
  hid.addEventListener("connect", handleConnect);
  hid.addEventListener("disconnect", handleDisconnect);
  signal.addEventListener("abort", () => {
    hid.removeEventListener("connect", handleConnect);
    hid.removeEventListener("disconnect", handleDisconnect);
  });
}
