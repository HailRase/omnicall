import {
  createDefaultHeadsetCapabilities,
  createHeadsetDeviceId,
  type HeadsetCapabilities,
  type HeadsetCommand,
  type HeadsetDevice,
  type HeadsetHardwareEvent,
} from "@domain/index.js";
import type {
  HeadsetGateway,
  HeadsetGrantedDeviceInfo,
  TryAutoReconnectOptions,
} from "@ports/headset/HeadsetGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  createHidEdgeDetector,
  mapHidPhoneActionToHardwareEvent,
} from "./hidEdgeDetector.js";
import {
  isHidLedOutputBlocked,
  performTelephonyHandshake,
} from "./hidLedOutput.js";
import {
  resolveHeadsetCapabilitiesFromParser,
  resolveHidReportParser,
} from "./hidParsers.js";
import { isWebHidSupported } from "./hidTypes.js";
import { executeHeadsetCommand } from "./executeHeadsetCommand.js";
import {
  closeHidDevice,
  getGrantedHidDevices,
  openHidDevice,
  requestHidDevice,
  subscribeHidConnectEvents,
  subscribeInputReports,
} from "./webHidClient.js";
import { pickGrantedHidDevice } from "./pickGrantedHidDevice.js";

function mapNativeDevice(device: HIDDevice): HeadsetDevice {
  return {
    id: createHeadsetDeviceId(`${device.vendorId}:${device.productId}:${device.productName}`),
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName,
    connectionState: device.opened ? "connected" : "disconnected",
  };
}

function nativeDeviceId(device: HIDDevice): string {
  return `${device.vendorId}:${device.productId}:${device.productName}`;
}

function pickGrantedDevice(
  granted: ReadonlyArray<HIDDevice>,
  preferredDeviceId: string | null | undefined,
): HIDDevice | undefined {
  const withIds = granted.map((device) => ({ device, id: nativeDeviceId(device) }));
  return pickGrantedHidDevice(withIds, preferredDeviceId)?.device;
}

/**
 * - Purpose: Web HID headset gateway for Jabra and Plantronics/Poly devices.
 * - Inputs: connect/disconnect, headset commands, HID input reports.
 * - Outputs: normalized hardware events and LED sync results.
 */
export class WebHidHeadsetAdapter implements HeadsetGateway {
  private nativeDevice: HIDDevice | null = null;
  private readonly listeners = new Set<(event: HeadsetHardwareEvent) => void>();
  private abortController: AbortController | null = null;
  private edgeDetector = createHidEdgeDetector(false);
  private firstReportSeen = false;
  private autoReconnectEnabled = true;
  private preferredDeviceId: string | null = null;

  setAutoReconnectEnabled(enabled: boolean): void {
    this.autoReconnectEnabled = enabled;
  }

  setPreferredDeviceId(deviceId: string | null): void {
    this.preferredDeviceId = deviceId;
  }

  isSupported(): boolean {
    return isWebHidSupported();
  }

  async connect(): Promise<Result<HeadsetDevice, PlatformError>> {
    return this.connectGrantedDevice(null);
  }

  async connectGrantedDevice(
    deviceId: string | null,
  ): Promise<Result<HeadsetDevice, PlatformError>> {
    if (!this.isSupported()) {
      return err(createPlatformError("operation_failed", "headset_hid_unsupported"));
    }
    try {
      if (deviceId !== null) {
        const granted = await getGrantedHidDevices();
        const match = granted.find((device) => nativeDeviceId(device) === deviceId);
        if (match === undefined) {
          return err(createPlatformError("operation_failed", "headset_device_not_found"));
        }
        return await this.attachDevice(match);
      }
      const device = await requestHidDevice();
      if (device === null) {
        return err(createPlatformError("operation_failed", "headset_picker_cancelled"));
      }
      return await this.attachDevice(device);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "headset_connect_failed";
      return err(createPlatformError("operation_failed", message, error));
    }
  }

  async disconnect(): Promise<Result<void, PlatformError>> {
    await this.detachDevice();
    return ok(undefined);
  }

  async tryAutoReconnect(
    options: TryAutoReconnectOptions = {},
  ): Promise<Result<HeadsetDevice | null, PlatformError>> {
    if (!this.isSupported() || !this.autoReconnectEnabled) {
      return ok(null);
    }
    if (this.nativeDevice !== null) {
      return ok(mapNativeDevice(this.nativeDevice));
    }
    try {
      const granted = await getGrantedHidDevices();
      const preferred = options.preferredDeviceId ?? this.preferredDeviceId;
      const device = pickGrantedDevice(granted, preferred);
      if (device === undefined) {
        return ok(null);
      }
      const attachResult = await this.attachDevice(device);
      if (attachResult.ok) {
        return ok(attachResult.value);
      }
      return ok(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "headset_auto_reconnect_failed";
      return err(createPlatformError("operation_failed", message, error));
    }
  }

  async listGrantedDevices(): Promise<ReadonlyArray<HeadsetGrantedDeviceInfo>> {
    if (!this.isSupported()) {
      return [];
    }
    try {
      const granted = await getGrantedHidDevices();
      return granted.map((device) => ({
        id: nativeDeviceId(device),
        productName: device.productName,
      }));
    } catch {
      return [];
    }
  }

  getConnectedDevice(): HeadsetDevice | null {
    if (this.nativeDevice === null) {
      return null;
    }
    return mapNativeDevice(this.nativeDevice);
  }

  getCapabilities(): HeadsetCapabilities {
    if (this.nativeDevice === null) {
      return createDefaultHeadsetCapabilities();
    }
    return resolveHeadsetCapabilitiesFromParser(resolveHidReportParser(this.nativeDevice));
  }

  async send(command: HeadsetCommand): Promise<Result<void, PlatformError>> {
    if (this.nativeDevice === null) {
      return err(createPlatformError("operation_failed", "headset_not_connected"));
    }
    const success = await executeHeadsetCommand(this.nativeDevice, command);
    if (!success) {
      const reason = isHidLedOutputBlocked(this.nativeDevice)
        ? "headset_led_output_blocked"
        : "headset_command_failed";
      return err(createPlatformError("operation_failed", reason));
    }
    this.syncEdgeDetectorAfterLedCommand(command);
    return ok(undefined);
  }

  subscribe(listener: (event: HeadsetHardwareEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private syncEdgeDetectorAfterLedCommand(command: HeadsetCommand): void {
    // Align input edge detector with LED output so firmware echo does not toggle mute/hook.
    switch (command.type) {
      case "signalIncoming":
        this.edgeDetector.syncState({ hookSwitch: false, phoneMute: false });
        return;
      case "signalOutgoing":
      case "answer":
        this.edgeDetector.syncState({ hookSwitch: true, phoneMute: false });
        return;
      case "hangup":
      case "clearSignal":
        this.edgeDetector.syncState({ hookSwitch: false, phoneMute: false });
        return;
      case "setHoldIndicator":
        // Match hold LED (offHook false); keep mute bit for selected-held mute toggle.
        this.edgeDetector.syncState({
          hookSwitch: false,
          phoneMute: command.muted === true,
        });
        return;
      case "setMute":
        this.edgeDetector.syncState({
          hookSwitch: true,
          phoneMute: command.muted,
        });
        return;
      default:
        return;
    }
  }

  private async attachDevice(device: HIDDevice): Promise<Result<HeadsetDevice, PlatformError>> {
    try {
      await openHidDevice(device);
      const parser = resolveHidReportParser(device);
      this.edgeDetector = createHidEdgeDetector(parser.supportsHold);
      this.firstReportSeen = false;
      this.nativeDevice = device;
      this.abortController?.abort();
      this.abortController = new AbortController();
      const signal = this.abortController.signal;
      subscribeInputReports(device, (event) => {
        this.handleInputReport(event, parser.vendor);
      }, signal);
      subscribeHidConnectEvents(
        (connected) => {
          if (this.nativeDevice !== null || !this.autoReconnectEnabled) {
            return;
          }
          const connectedId = nativeDeviceId(connected);
          if (
            this.preferredDeviceId !== null &&
            this.preferredDeviceId !== connectedId
          ) {
            // Prefer waiting for the remembered device; still accept if only this one plugs in.
            void getGrantedHidDevices().then((granted) => {
              if (this.nativeDevice !== null) {
                return;
              }
              const preferred = pickGrantedDevice(granted, this.preferredDeviceId);
              if (preferred !== undefined) {
                void this.attachDevice(preferred);
                return;
              }
              void this.attachDevice(connected);
            });
            return;
          }
          void this.attachDevice(connected);
        },
        (disconnected) => {
          if (this.nativeDevice === disconnected) {
            void this.detachDevice({ notifyUsbRemoved: true });
          }
        },
        signal,
      );
      await performTelephonyHandshake(device);
      return ok(mapNativeDevice(device));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "headset_attach_failed";
      return err(createPlatformError("operation_failed", message, error));
    }
  }

  private async detachDevice(
    options: Readonly<{ notifyUsbRemoved?: boolean }> = {},
  ): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
    if (this.nativeDevice !== null) {
      await closeHidDevice(this.nativeDevice);
    }
    this.nativeDevice = null;
    this.edgeDetector.reset();
    this.firstReportSeen = false;
    if (options.notifyUsbRemoved === true) {
      this.emit({ type: "deviceError", reason: "usb_disconnected" });
    }
  }

  private handleInputReport(event: HIDInputReportEvent, vendor: string): void {
    const device = this.nativeDevice;
    if (device === null) {
      return;
    }
    const parser = resolveHidReportParser(device);
    const update = parser.parseUpdate(event.reportId, event.data);
    if (update === null) {
      return;
    }

    if (!this.firstReportSeen) {
      this.firstReportSeen = true;
      this.edgeDetector.syncState(update);
      if (vendor === "jabra" && update.hookSwitch === true) {
        this.emit({ type: "hookOff" });
      }
      return;
    }

    const action = this.edgeDetector.detect(update);
    if (action === null) {
      return;
    }
    const hardwareEvent = mapHidPhoneActionToHardwareEvent(action);
    if (hardwareEvent !== null) {
      this.emit(hardwareEvent);
    }
  }

  private emit(event: HeadsetHardwareEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
