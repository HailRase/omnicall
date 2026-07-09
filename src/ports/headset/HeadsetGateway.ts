import type {
  HeadsetCapabilities,
  HeadsetCommand,
  HeadsetDevice,
  HeadsetHardwareEvent,
} from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type HeadsetHardwareListener = (event: HeadsetHardwareEvent) => void;

export interface HeadsetGateway {
  isSupported(): boolean;
  connect(): Promise<Result<HeadsetDevice, PlatformError>>;
  disconnect(): Promise<Result<void, PlatformError>>;
  tryAutoReconnect(): Promise<Result<HeadsetDevice | null, PlatformError>>;
  getConnectedDevice(): HeadsetDevice | null;
  getCapabilities(): HeadsetCapabilities;
  send(command: HeadsetCommand): Promise<Result<void, PlatformError>>;
  subscribe(listener: HeadsetHardwareListener): () => void;
}
