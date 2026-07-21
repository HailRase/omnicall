/**
 * DI-10 compatibility fortress: incompatible protocol clients fail closed
 * before product state disclosure.
 */

import { once } from "node:events";

import {
  PROTOCOL_MAJOR,
  PROTOCOL_MAX,
  PROTOCOL_MIN,
  WS_PATH,
  validateWireMessage,
} from "@axata/axatalk-protocol";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { LocalWsServerAdapter } from "./LocalWsServerAdapter.js";

const TEST_ORIGIN = "https://crm.example";

const adapters: LocalWsServerAdapter[] = [];

afterEach(async () => {
  while (adapters.length > 0) {
    const adapter = adapters.pop();
    if (adapter !== undefined) {
      await adapter.stop();
    }
  }
});

async function startAdapter(): Promise<LocalWsServerAdapter> {
  const adapter = new LocalWsServerAdapter({
    desktopVersion: "0.11.2-test",
    host: "127.0.0.1",
    port: 0,
    allowedOrigins: [TEST_ORIGIN],
    autoApprovePairing: true,
    secretStorage: new InMemorySecretStorageAdapter(),
  });
  adapters.push(adapter);
  const result = await adapter.start();
  expect(result.ok).toBe(true);
  return adapter;
}

function boundPort(adapter: LocalWsServerAdapter): number {
  return adapter.getBoundAddress()!.port;
}

function openClient(port: number): WebSocket {
  return new WebSocket(`ws://127.0.0.1:${port}${WS_PATH}`, {
    headers: { Origin: TEST_ORIGIN },
  });
}

async function waitOpen(ws: WebSocket): Promise<void> {
  if (ws.readyState === WebSocket.OPEN) {
    return;
  }
  await once(ws, "open");
}

describe("LocalWsServerAdapter DI-10 compatibility", () => {
  it("validateWireInbound maps out-of-range protocolVersion to incompatible_version", () => {
    const adapter = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [TEST_ORIGIN],
      secretStorage: new InMemorySecretStorageAdapter(),
    });
    const result = adapter.validateWireInbound({
      protocolVersion: PROTOCOL_MAX + 1,
      kind: "handshake",
      type: "sdk:client-hello",
      protocolMin: PROTOCOL_MAX + 1,
      protocolMax: PROTOCOL_MAX + 1,
      sdkVersion: "9.9.9-incompat",
      application: { name: "old-client", version: "0.0.1" },
      requestedCapabilities: ["session.read.redacted"],
      clientNonce: "Y2xpZW50bm9uY2UxMjM",
      occurredAt: "2026-07-20T09:00:00.000Z",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("incompatible_version");
    }
  });

  it("validateWireInbound maps non-overlapping hello range to incompatible_version", () => {
    const adapter = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [TEST_ORIGIN],
      secretStorage: new InMemorySecretStorageAdapter(),
    });
    expect(PROTOCOL_MIN).toBe(1);
    expect(PROTOCOL_MAX).toBe(1);
    const result = adapter.validateWireInbound({
      protocolVersion: PROTOCOL_MAJOR,
      kind: "handshake",
      type: "sdk:client-hello",
      protocolMin: 2,
      protocolMax: 2,
      sdkVersion: "9.9.9-incompat",
      application: { name: "future-client", version: "2.0.0" },
      requestedCapabilities: ["session.read.redacted"],
      clientNonce: "Y2xpZW50bm9uY2UxMjM",
      occurredAt: "2026-07-20T09:00:00.000Z",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("incompatible_version");
    }
  });

  it("closes incompatible client-hello without emitting server-hello or snapshot", async () => {
    const adapter = await startAdapter();
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);

    let productMessages = 0;
    ws.on("message", () => {
      productMessages += 1;
    });

    ws.send(
      JSON.stringify({
        protocolVersion: 99,
        kind: "handshake",
        type: "sdk:client-hello",
        protocolMin: 99,
        protocolMax: 99,
        sdkVersion: "9.9.9-incompat",
        application: { name: "hostile-version", version: "9.9.9" },
        requestedCapabilities: [
          "session.read.redacted",
          "call.originate",
          "call.control",
          "account.activate",
        ],
        clientNonce: "Y2xpZW50bm9uY2UxMjM",
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );

    await once(ws, "close");
    expect(productMessages).toBe(0);
    expect(adapter.getConnectionCount()).toBe(0);

    const wireCheck = validateWireMessage({
      protocolVersion: 99,
      kind: "handshake",
      type: "sdk:client-hello",
      protocolMin: 99,
      protocolMax: 99,
      sdkVersion: "9.9.9-incompat",
      application: { name: "hostile-version", version: "9.9.9" },
      requestedCapabilities: ["session.read.redacted"],
      clientNonce: "Y2xpZW50bm9uY2UxMjM",
      occurredAt: "2026-07-20T09:00:00.000Z",
    });
    expect(wireCheck.success).toBe(false);
    if (!wireCheck.success) {
      expect(wireCheck.code).toBe("incompatible_version");
    }
  });

  it("compatible current protocol still receives server-hello (current↔current)", async () => {
    const adapter = await startAdapter();
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "handshake",
        type: "sdk:client-hello",
        protocolMin: PROTOCOL_MIN,
        protocolMax: PROTOCOL_MAX,
        sdkVersion: "0.0.0-test",
        application: { name: "current-client", version: "0.0.0" },
        requestedCapabilities: ["session.read.redacted"],
        clientNonce: "Y2xpZW50bm9uY2UxMjM",
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    const [data] = (await once(ws, "message")) as [Buffer | string];
    const text = typeof data === "string" ? data : data.toString("utf8");
    const validated = validateWireMessage(JSON.parse(text) as unknown);
    expect(validated.success).toBe(true);
    if (validated.success) {
      expect(validated.data).toMatchObject({
        kind: "handshake",
        type: "sdk:server-hello",
        selectedProtocolVersion: PROTOCOL_MAJOR,
      });
    }
    ws.close();
  });

  it("start denial (not primary / disabled) returns ok:false without throwing — SIP boot continues", async () => {
    const denied = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      host: "127.0.0.1",
      port: 0,
      mayClaimEndpoint: () => false,
      secretStorage: new InMemorySecretStorageAdapter(),
    });
    adapters.push(denied);
    await expect(denied.start()).resolves.toEqual({
      ok: false,
      reason: "not_primary_instance",
    });
    expect(denied.getStatus()).toBe("disabled");

    const disabled = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      host: "127.0.0.1",
      port: 0,
      enabled: false,
      secretStorage: new InMemorySecretStorageAdapter(),
    });
    adapters.push(disabled);
    await expect(disabled.start()).resolves.toEqual({
      ok: false,
      reason: "disabled",
    });
    expect(disabled.getStatus()).toBe("disabled");
  });
});
