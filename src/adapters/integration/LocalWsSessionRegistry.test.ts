/**
 * Unit coverage for outbound queue + heartbeat miss paths (DI-03 follow-up).
 */

import { validateWireMessage, type WireMessage } from "@axata/axatalk-protocol";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RawData } from "ws";

import { LocalWsSessionRegistry } from "./LocalWsSessionRegistry.js";
import type { SdkGatewaySocket } from "./sdkGatewayConnection.js";
import { DEFAULT_SDK_GATEWAY_LIMITS } from "./sdkGatewayConfig.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";
import { createAutoDenyPairingApprover } from "./sdkGatewayPairingApprover.js";
import { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";

class TestGatewaySocket implements SdkGatewaySocket {
  readyState = 1;
  private messageListener: ((data: RawData, isBinary: boolean) => void) | undefined;
  private closeListener: (() => void) | undefined;
  private readonly stallSend: boolean;

  constructor(options?: { readonly stallSend?: boolean }) {
    this.stallSend = options?.stallSend === true;
  }

  on(
    event: "message" | "pong" | "close" | "error",
    listener: ((data: RawData, isBinary: boolean) => void) | (() => void),
  ): void {
    if (event === "message") {
      this.messageListener = (data, isBinary) => {
        listener(data, isBinary);
      };
      return;
    }
    if (event === "close") {
      this.closeListener = () => {
        listener(Buffer.alloc(0), false);
      };
    }
  }

  ping(): void {}

  send(_data: string, cb?: (error?: Error | null) => void): void {
    if (this.stallSend) {
      return;
    }
    cb?.();
  }

  close(): void {
    this.readyState = 3;
    this.closeListener?.();
  }

  terminate(): void {
    this.close();
  }

  emitMessage(text: string): void {
    this.messageListener?.(Buffer.from(text, "utf8"), false);
  }
}

const identity: SdkGatewayIdentity = {
  desktopVersion: "0.11.2-test",
  serverInstanceId: "srv_test_001",
  sessionEpoch: "epoch_test_001",
  maxMessageBytes: 65_536,
  heartbeatSeconds: 1,
};

const clientHello = {
  protocolVersion: 1,
  kind: "handshake",
  type: "sdk:client-hello",
  protocolMin: 1,
  protocolMax: 1,
  sdkVersion: "0.0.0-test",
  application: { name: "fixture-crm", version: "1.0.0" },
  clientId: "client_test_001",
  requestedCapabilities: ["session.read.redacted"],
  clientNonce: "Y2xpZW50bm9uY2UxMjM",
  occurredAt: "2026-07-20T09:00:00.000Z",
} as const satisfies WireMessage;

const TEST_ORIGIN = "https://crm.example";

function validateWire(
  input: unknown,
):
  | { success: true; data: WireMessage }
  | { success: false; code: string } {
  const result = validateWireMessage(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, code: result.code };
}

function createRegistry(
  overrides: Partial<ConstructorParameters<typeof LocalWsSessionRegistry>[0]> = {},
): LocalWsSessionRegistry {
  return new LocalWsSessionRegistry({
    limits: {
      ...DEFAULT_SDK_GATEWAY_LIMITS,
      maxOutboundQueue: 1,
      heartbeatSeconds: 60,
      handshakeTimeoutMs: 60_000,
      unauthIdleMs: 60_000,
    },
    now: () => new Date("2026-07-20T09:00:00.000Z"),
    validateWire,
    getIdentity: () => identity,
    pairingStore: new SdkGatewayPairingStore(new InMemorySecretStorageAdapter()),
    pairingApprover: createAutoDenyPairingApprover(),
    ...overrides,
  });
}

describe("LocalWsSessionRegistry limits", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("closes when outbound queue is full", async () => {
    const closedReasons: string[] = [];
    const socket = new TestGatewaySocket({ stallSend: true });
    const registry = createRegistry({
      limits: {
        ...DEFAULT_SDK_GATEWAY_LIMITS,
        maxOutboundQueue: 1,
        heartbeatSeconds: 60,
        handshakeTimeoutMs: 60_000,
        unauthIdleMs: 60_000,
      },
      onLog: (event, fields) => {
        if (event === "sdk_gateway_connection_closed") {
          closedReasons.push(String(fields["reason"] ?? ""));
        }
      },
    });

    registry.attach(socket, TEST_ORIGIN);
    socket.emitMessage(JSON.stringify(clientHello));
    await vi.waitFor(() => {
      expect(registry.size).toBe(1);
    });

    socket.emitMessage(
      JSON.stringify({
        protocolVersion: 1,
        kind: "command",
        type: "sdk:get-snapshot",
        requestId: "req_snap_001",
        serverInstanceId: "srv_client",
        sessionEpoch: "epoch_client",
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    await vi.waitFor(() => {
      expect(closedReasons).toContain("outbound_queue_full");
    });
    expect(registry.size).toBe(0);
  });

  it("closes on heartbeat miss when pong never arrives", async () => {
    const closedReasons: string[] = [];
    const socket = new TestGatewaySocket();
    const registry = createRegistry({
      limits: {
        ...DEFAULT_SDK_GATEWAY_LIMITS,
        heartbeatSeconds: 1,
        handshakeTimeoutMs: 60_000,
        unauthIdleMs: 60_000,
      },
      onLog: (event, fields) => {
        if (event === "sdk_gateway_connection_closed") {
          closedReasons.push(String(fields["reason"] ?? ""));
        }
      },
    });

    registry.attach(socket, TEST_ORIGIN);
    socket.emitMessage(JSON.stringify(clientHello));
    await vi.waitFor(() => {
      expect(registry.size).toBe(1);
    });

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);

    expect(closedReasons).toContain("heartbeat_missed");
    expect(registry.size).toBe(0);
  });
});
