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

/**
 * - Purpose: emulate headset gateway for orchestrator and Use Case tests.
 * - Inputs: connect/disconnect/send commands and simulated hardware events.
 * - Outputs: in-memory device state and command trace.
 */
export class MockHeadsetGateway implements HeadsetGateway {
  private connectedDevice: HeadsetDevice | null = null;
  private readonly listeners = new Set<(event: HeadsetHardwareEvent) => void>();
  private readonly sentCommands: HeadsetCommand[] = [];
  private supported = true;
  private connectShouldFail = false;
  private autoReconnectEnabled = true;
  private preferredDeviceId: string | null = null;
  private muteInputMode: HeadsetCapabilities["muteInputMode"] = "latch";
  private grantedDevices: HeadsetGrantedDeviceInfo[] = [
    { id: "mock-headset-1", productName: "Mock Jabra Headset" },
  ];

  isSupported(): boolean {
    return this.supported;
  }

  setAutoReconnectEnabled(enabled: boolean): void {
    this.autoReconnectEnabled = enabled;
  }

  setPreferredDeviceId(deviceId: string | null): void {
    this.preferredDeviceId = deviceId;
  }

  isAutoReconnectEnabled(): boolean {
    return this.autoReconnectEnabled;
  }

  setSupported(supported: boolean): void {
    this.supported = supported;
  }

  setConnectShouldFail(shouldFail: boolean): void {
    this.connectShouldFail = shouldFail;
  }

  setMuteInputMode(mode: HeadsetCapabilities["muteInputMode"]): void {
    this.muteInputMode = mode;
  }

  setGrantedDevices(devices: ReadonlyArray<HeadsetGrantedDeviceInfo>): void {
    this.grantedDevices = [...devices];
  }

  connect(): Promise<Result<HeadsetDevice, PlatformError>> {
    return this.connectGrantedDevice(null);
  }

  connectGrantedDevice(deviceId: string | null): Promise<Result<HeadsetDevice, PlatformError>> {
    if (!this.supported) {
      return Promise.resolve(err(createPlatformError("operation_failed", "headset_hid_unsupported")));
    }
    if (this.connectShouldFail) {
      return Promise.resolve(err(createPlatformError("operation_failed", "headset_connect_failed")));
    }
    const granted =
      deviceId === null
        ? this.grantedDevices[0]
        : this.grantedDevices.find((entry) => entry.id === deviceId);
    if (granted === undefined) {
      return Promise.resolve(err(createPlatformError("operation_failed", "headset_device_not_found")));
    }
    this.connectedDevice = {
      id: createHeadsetDeviceId(granted.id),
      vendorId: 0x0b0e,
      productId: 0x0300,
      productName: granted.productName,
      connectionState: "connected",
    };
    this.preferredDeviceId = granted.id;
    return Promise.resolve(ok(this.connectedDevice));
  }

  disconnect(): Promise<Result<void, PlatformError>> {
    this.connectedDevice = null;
    return Promise.resolve(ok(undefined));
  }

  tryAutoReconnect(
    options: TryAutoReconnectOptions = {},
  ): Promise<Result<HeadsetDevice | null, PlatformError>> {
    if (!this.autoReconnectEnabled) {
      return Promise.resolve(ok(null));
    }
    if (this.connectedDevice !== null) {
      return Promise.resolve(ok(this.connectedDevice));
    }
    const preferred = options.preferredDeviceId ?? this.preferredDeviceId;
    const match =
      preferred !== null && preferred !== undefined
        ? this.grantedDevices.find((entry) => entry.id === preferred)
        : undefined;
    const target = match ?? this.grantedDevices[0];
    if (target === undefined) {
      return Promise.resolve(ok(null));
    }
    return this.connectGrantedDevice(target.id);
  }

  listGrantedDevices(): Promise<ReadonlyArray<HeadsetGrantedDeviceInfo>> {
    return Promise.resolve([...this.grantedDevices]);
  }

  getConnectedDevice(): HeadsetDevice | null {
    return this.connectedDevice;
  }

  getCapabilities(): HeadsetCapabilities {
    if (this.connectedDevice === null) {
      return createDefaultHeadsetCapabilities();
    }
    return {
      supportsAnswer: true,
      supportsReject: true,
      supportsHangup: true,
      supportsHold: false,
      supportsMute: true,
      supportsOutgoingSignal: true,
      supportsIncomingSignal: true,
      supportsRejectOnHookOn: true,
      muteInputMode: this.muteInputMode,
    };
  }

  send(command: HeadsetCommand): Promise<Result<void, PlatformError>> {
    this.sentCommands.push(command);
    return Promise.resolve(ok(undefined));
  }

  subscribe(listener: (event: HeadsetHardwareEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emitHardwareEvent(event: HeadsetHardwareEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getSentCommands(): ReadonlyArray<HeadsetCommand> {
    return this.sentCommands;
  }

  clearSentCommands(): void {
    this.sentCommands.length = 0;
  }
}
