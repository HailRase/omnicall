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

  isSupported(): boolean {
    return this.supported;
  }

  setSupported(supported: boolean): void {
    this.supported = supported;
  }

  setConnectShouldFail(shouldFail: boolean): void {
    this.connectShouldFail = shouldFail;
  }

  connect(): Promise<Result<HeadsetDevice, PlatformError>> {
    if (!this.supported) {
      return Promise.resolve(err(createPlatformError("operation_failed", "headset_hid_unsupported")));
    }
    if (this.connectShouldFail) {
      return Promise.resolve(err(createPlatformError("operation_failed", "headset_connect_failed")));
    }
    this.connectedDevice = {
      id: createHeadsetDeviceId("mock-headset-1"),
      vendorId: 0x0b0e,
      productId: 0x0300,
      productName: "Mock Jabra Headset",
      connectionState: "connected",
    };
    return Promise.resolve(ok(this.connectedDevice));
  }

  disconnect(): Promise<Result<void, PlatformError>> {
    this.connectedDevice = null;
    return Promise.resolve(ok(undefined));
  }

  tryAutoReconnect(): Promise<Result<HeadsetDevice | null, PlatformError>> {
    if (this.connectedDevice !== null) {
      return Promise.resolve(ok(this.connectedDevice));
    }
    return Promise.resolve(ok(null));
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
