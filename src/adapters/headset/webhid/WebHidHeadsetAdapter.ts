import {
  createDefaultHeadsetCapabilities,
  createHeadsetDeviceId,
  type HeadsetCapabilities,
  type HeadsetCommand,
  type HeadsetDevice,
  type HeadsetHardwareEvent,
} from "@domain/index.js";
import type { HeadsetGateway } from "@ports/headset/HeadsetGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  createHidEdgeDetector,
  mapHidPhoneActionToHardwareEvent,
} from "./hidEdgeDetector.js";
import { performTelephonyHandshake } from "./hidLedOutput.js";
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

function mapNativeDevice(device: HIDDevice): HeadsetDevice {
  return {
    id: createHeadsetDeviceId(`${device.vendorId}:${device.productId}:${device.productName}`),
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName,
    connectionState: device.opened ? "connected" : "disconnected",
  };
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

  setAutoReconnectEnabled(enabled: boolean): void {
    this.autoReconnectEnabled = enabled;
  }

  isSupported(): boolean {
    return isWebHidSupported();
  }

  async connect(): Promise<Result<HeadsetDevice, PlatformError>> {
    if (!this.isSupported()) {
      return err(createPlatformError("operation_failed", "headset_hid_unsupported"));
    }
    try {
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

  async tryAutoReconnect(): Promise<Result<HeadsetDevice | null, PlatformError>> {
    if (!this.isSupported() || !this.autoReconnectEnabled) {
      return ok(null);
    }
    try {
      const granted = await getGrantedHidDevices();
      const device = granted[0];
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
      return err(createPlatformError("operation_failed", "headset_command_failed"));
    }
    return ok(undefined);
  }

  subscribe(listener: (event: HeadsetHardwareEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
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
          if (this.nativeDevice === null && this.autoReconnectEnabled) {
            void this.attachDevice(connected);
          }
        },
        (disconnected) => {
          if (this.nativeDevice === disconnected) {
            void this.detachDevice();
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

  private async detachDevice(): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
    if (this.nativeDevice !== null) {
      await closeHidDevice(this.nativeDevice);
    }
    this.nativeDevice = null;
    this.edgeDetector.reset();
    this.firstReportSeen = false;
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
