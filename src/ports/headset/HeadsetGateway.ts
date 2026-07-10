import type {
  HeadsetCapabilities,
  HeadsetCommand,
  HeadsetDevice,
  HeadsetHardwareEvent,
} from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type HeadsetHardwareListener = (event: HeadsetHardwareEvent) => void;

export type HeadsetGrantedDeviceInfo = Readonly<{
  id: string;
  productName: string;
}>;

export type TryAutoReconnectOptions = Readonly<{
  preferredDeviceId?: string | null;
}>;

export interface HeadsetGateway {
  isSupported(): boolean;
  connect(): Promise<Result<HeadsetDevice, PlatformError>>;
  /** Attach an already-granted device by id, or open the browser picker when id is null. */
  connectGrantedDevice(deviceId: string | null): Promise<Result<HeadsetDevice, PlatformError>>;
  disconnect(): Promise<Result<void, PlatformError>>;
  tryAutoReconnect(
    options?: TryAutoReconnectOptions,
  ): Promise<Result<HeadsetDevice | null, PlatformError>>;
  listGrantedDevices(): Promise<ReadonlyArray<HeadsetGrantedDeviceInfo>>;
  setAutoReconnectEnabled(enabled: boolean): void;
  setPreferredDeviceId(deviceId: string | null): void;
  getConnectedDevice(): HeadsetDevice | null;
  getCapabilities(): HeadsetCapabilities;
  send(command: HeadsetCommand): Promise<Result<void, PlatformError>>;
  subscribe(listener: HeadsetHardwareListener): () => void;
}
