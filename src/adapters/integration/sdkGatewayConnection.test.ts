/**
 * Unit coverage for per-connection inbound serialization (DI-04 follow-up).
 */

import { describe, expect, it, vi } from "vitest";

import {
  createSdkGatewayConnection,
  enqueueSdkGatewayInbound,
  type SdkGatewaySocket,
} from "./sdkGatewayConnection.js";

function createStubSocket(): SdkGatewaySocket {
  return {
    readyState: 1,
    on: () => {},
    ping: () => {},
    send: (_data, cb) => {
      cb?.();
    },
    close: () => {},
    terminate: () => {},
  };
}

describe("enqueueSdkGatewayInbound", () => {
  it("runs tasks strictly in enqueue order even when the first awaits", async () => {
    const connection = createSdkGatewayConnection(
      "conn_order_001",
      createStubSocket(),
      "https://crm.example",
      Date.parse("2026-07-23T11:00:00.000Z"),
    );
    const order: number[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    enqueueSdkGatewayInbound(connection, async () => {
      order.push(1);
      await firstGate;
      order.push(2);
    });
    enqueueSdkGatewayInbound(connection, async () => {
      order.push(3);
    });

    await vi.waitFor(() => {
      expect(order).toEqual([1]);
    });
    releaseFirst?.();
    await connection.inboundTail;
    expect(order).toEqual([1, 2, 3]);
  });

  it("keeps the chain after a rejected task", async () => {
    const connection = createSdkGatewayConnection(
      "conn_order_002",
      createStubSocket(),
      "https://crm.example",
      Date.parse("2026-07-23T11:00:00.000Z"),
    );
    const order: number[] = [];

    enqueueSdkGatewayInbound(connection, async () => {
      order.push(1);
      throw new Error("boom");
    });
    enqueueSdkGatewayInbound(connection, async () => {
      order.push(2);
    });

    await connection.inboundTail;
    expect(order).toEqual([1, 2]);
  });
});
