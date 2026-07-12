import {
  createDefaultHeadsetCapabilities,
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
 * - Purpose: port-completeness stub for a future native SDK HeadsetGateway.
 * - Inputs: connect/send/subscribe like production gateways.
 * - Outputs: isSupported false; connect/send fail with not_implemented.
 * - Real SDK adapter would need: main-process host, IPC bridge, event mapping.
 */
export class SdkHeadsetGatewayStub implements HeadsetGateway {
  isSupported(): boolean {
    return false;
  }

  setAutoReconnectEnabled(enabled: boolean): void {
    void enabled;
  }

  setPreferredDeviceId(deviceId: string | null): void {
    void deviceId;
  }

  connect(): Promise<Result<HeadsetDevice, PlatformError>> {
    return Promise.resolve(
      err(createPlatformError("not_implemented", "headset_sdk_not_implemented")),
    );
  }

  connectGrantedDevice(
    deviceId: string | null,
  ): Promise<Result<HeadsetDevice, PlatformError>> {
    void deviceId;
    return Promise.resolve(
      err(createPlatformError("not_implemented", "headset_sdk_not_implemented")),
    );
  }

  disconnect(): Promise<Result<void, PlatformError>> {
    return Promise.resolve(ok(undefined));
  }

  tryAutoReconnect(
    options?: TryAutoReconnectOptions,
  ): Promise<Result<HeadsetDevice | null, PlatformError>> {
    void options;
    return Promise.resolve(ok(null));
  }

  listGrantedDevices(): Promise<ReadonlyArray<HeadsetGrantedDeviceInfo>> {
    return Promise.resolve([]);
  }

  getConnectedDevice(): HeadsetDevice | null {
    return null;
  }

  getCapabilities(): HeadsetCapabilities {
    return createDefaultHeadsetCapabilities();
  }

  send(command: HeadsetCommand): Promise<Result<void, PlatformError>> {
    void command;
    return Promise.resolve(
      err(createPlatformError("not_implemented", "headset_sdk_not_implemented")),
    );
  }

  subscribe(listener: (event: HeadsetHardwareEvent) => void): () => void {
    void listener;
    return () => undefined;
  }
}
