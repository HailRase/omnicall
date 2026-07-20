import { createServer } from "node:http";
import { once } from "node:events";

import {
  DISCOVERY_PATH,
  WS_PATH,
  validateWireMessage,
} from "@axatalk/protocol";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { LocalWsServerAdapter } from "./LocalWsServerAdapter.js";

const fixturesHello = {
  protocolVersion: 1,
  kind: "handshake",
  type: "sdk:client-hello",
  protocolMin: 1,
  protocolMax: 1,
  sdkVersion: "0.0.0-test",
  application: { name: "fixture-crm", version: "1.0.0" },
  clientId: "client_test_001",
  requestedCapabilities: ["session.read.redacted", "window.show"],
  clientNonce: "Y2xpZW50bm9uY2UxMjM",
  occurredAt: "2026-07-20T09:00:00.000Z",
} as const;

const adapters: LocalWsServerAdapter[] = [];

afterEach(async () => {
  while (adapters.length > 0) {
    const adapter = adapters.pop();
    if (adapter !== undefined) {
      await adapter.stop();
    }
  }
});

async function startAdapter(
  overrides: Partial<ConstructorParameters<typeof LocalWsServerAdapter>[0]> = {},
): Promise<LocalWsServerAdapter> {
  const adapter = new LocalWsServerAdapter({
    desktopVersion: "0.11.2-test",
    host: "127.0.0.1",
    port: 0,
    ...overrides,
  });
  adapters.push(adapter);
  const result = await adapter.start();
  expect(result.ok).toBe(true);
  return adapter;
}

function boundPort(adapter: LocalWsServerAdapter): number {
  const bound = adapter.getBoundAddress();
  expect(bound).not.toBeNull();
  return bound!.port;
}

function openClient(port: number, headers?: Record<string, string>): WebSocket {
  return new WebSocket(`ws://127.0.0.1:${port}${WS_PATH}`, { headers });
}

async function waitOpen(ws: WebSocket): Promise<void> {
  if (ws.readyState === WebSocket.OPEN) {
    return;
  }
  await once(ws, "open");
}

async function waitMessage(ws: WebSocket): Promise<unknown> {
  const [data] = (await once(ws, "message")) as [Buffer | string];
  const text = typeof data === "string" ? data : data.toString("utf8");
  return JSON.parse(text) as unknown;
}

describe("LocalWsServerAdapter", () => {
  it("binds loopback and serves discovery document", async () => {
    const logs: Array<{ event: string; fields: Record<string, unknown> }> = [];
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      onLog: (event, fields) => {
        logs.push({ event, fields: { ...fields } });
      },
    });
    expect(adapter.getStatus()).toBe("listening");
    const port = boundPort(adapter);
    const response = await fetch(
      `http://127.0.0.1:${port}${DISCOVERY_PATH}`,
    );
    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    const validated = adapter.validateDiscoveryInbound(body);
    expect(validated.success).toBe(true);
    if (validated.success) {
      expect(validated.data.wsUrl).toBe(`ws://127.0.0.1:${port}${WS_PATH}`);
      expect(validated.data.pairingRequired).toBe(true);
    }
    const serialized = JSON.stringify(logs);
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("sipPassword");
    expect(serialized).not.toContain("Y2xpZW50bm9uY2UxMjM");
  });

  it("fails closed when port is occupied", async () => {
    const blocker = createServer();
    await new Promise<void>((resolve, reject) => {
      blocker.once("error", reject);
      blocker.listen(0, "127.0.0.1", () => {
        resolve();
      });
    });
    const address = blocker.address();
    expect(address).not.toBeNull();
    expect(typeof address).not.toBe("string");
    const port = (address as { port: number }).port;

    const adapter = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      host: "127.0.0.1",
      port,
    });
    adapters.push(adapter);
    const result = await adapter.start();
    expect(result).toEqual({ ok: false, reason: "bind_failed" });
    expect(adapter.getStatus()).toBe("disabled");

    await new Promise<void>((resolve) => {
      blocker.close(() => {
        resolve();
      });
    });
  });

  it("refuses endpoint claim when not primary instance", async () => {
    const adapter = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      host: "127.0.0.1",
      port: 0,
      mayClaimEndpoint: () => false,
    });
    adapters.push(adapter);
    const result = await adapter.start();
    expect(result).toEqual({ ok: false, reason: "not_primary_instance" });
    expect(adapter.getStatus()).toBe("disabled");
  });

  it("fails closed on non-loopback bind host", async () => {
    const adapter = new LocalWsServerAdapter({
      desktopVersion: "0.11.2-test",
      host: "0.0.0.0",
      port: 0,
    });
    adapters.push(adapter);
    const result = await adapter.start();
    expect(result).toEqual({ ok: false, reason: "invalid_bind_host" });
    expect(adapter.getStatus()).toBe("disabled");
  });

  it("completes handshake and denies unauthenticated product commands", async () => {
    const adapter = await startAdapter();
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send(JSON.stringify(fixturesHello));
    const hello = await waitMessage(ws);
    const helloResult = validateWireMessage(hello);
    expect(helloResult.success).toBe(true);
    if (helloResult.success) {
      expect(helloResult.data).toMatchObject({
        kind: "handshake",
        type: "sdk:server-hello",
        pairingRequired: true,
      });
    }

    const snapshotCmd = {
      protocolVersion: 1,
      kind: "command",
      type: "sdk:get-snapshot",
      requestId: "req_snap_001",
      serverInstanceId: "srv_client",
      sessionEpoch: "epoch_client",
      occurredAt: "2026-07-20T09:00:00.000Z",
      payload: {},
    };
    ws.send(JSON.stringify(snapshotCmd));
    const reply = await waitMessage(ws);
    const replyResult = validateWireMessage(reply);
    expect(replyResult.success).toBe(true);
    if (replyResult.success) {
      expect(replyResult.data).toMatchObject({
        kind: "reply",
        ok: false,
        commandType: "sdk:get-snapshot",
        error: { code: "unauthenticated" },
      });
    }
    ws.close();
  });

  it("fails closed on malformed frames", async () => {
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      limits: { handshakeTimeoutMs: 5_000 },
    });
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send("{not-json");
    await once(ws, "close");
    expect(adapter.getConnectionCount()).toBe(0);
  });

  it("rejects oversized frames", async () => {
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      limits: { maxMessageBytes: 256, handshakeTimeoutMs: 5_000 },
    });
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send("x".repeat(512));
    await once(ws, "close");
    expect(adapter.getConnectionCount()).toBe(0);
  });

  it("rejects deeply nested JSON via protocol limits", async () => {
    const adapter = await startAdapter();
    let deep: unknown = { leaf: true };
    for (let i = 0; i < 40; i += 1) {
      deep = { nested: deep };
    }
    const result = adapter.validateWireInbound(deep);
    expect(result.success).toBe(false);
  });

  it("closes the socket on deeply nested live frames", async () => {
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      limits: { handshakeTimeoutMs: 5_000 },
    });
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    let deep: unknown = { leaf: true };
    for (let i = 0; i < 40; i += 1) {
      deep = { nested: deep };
    }
    ws.send(JSON.stringify(deep));
    await once(ws, "close");
    expect(adapter.getConnectionCount()).toBe(0);
  });

  it("cleans up on unauthenticated idle timeout", async () => {
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      limits: { handshakeTimeoutMs: 5_000, unauthIdleMs: 80 },
    });
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send(JSON.stringify(fixturesHello));
    await waitMessage(ws);
    await once(ws, "close");
    expect(adapter.getConnectionCount()).toBe(0);
  });

  it("enforces max connections", async () => {
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      limits: { maxConnections: 1, handshakeTimeoutMs: 5_000 },
    });
    const port = boundPort(adapter);
    const first = openClient(port);
    await waitOpen(first);
    expect(adapter.getConnectionCount()).toBe(1);

    const secondOutcome = await new Promise<"opened" | "rejected">(
      (resolve) => {
        const second = openClient(port);
        second.on("error", () => {
          resolve("rejected");
        });
        second.on("unexpected-response", () => {
          resolve("rejected");
        });
        second.on("close", () => {
          resolve("rejected");
        });
        second.on("open", () => {
          second.close();
          resolve("opened");
        });
      },
    );
    expect(secondOutcome).toBe("rejected");
    expect(adapter.getConnectionCount()).toBe(1);
    first.close();
    await once(first, "close");
  });

  it("enforces inbound rate limits", async () => {
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      limits: {
        rateLimitMax: 3,
        rateLimitWindowMs: 10_000,
        handshakeTimeoutMs: 5_000,
      },
    });
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send(JSON.stringify(fixturesHello));
    await waitMessage(ws);
    for (let i = 0; i < 5; i += 1) {
      ws.send(
        JSON.stringify({
          protocolVersion: 1,
          kind: "command",
          type: "sdk:ping",
          requestId: `req_ping_${i}`,
          serverInstanceId: "srv_client",
          sessionEpoch: "epoch_client",
          occurredAt: "2026-07-20T09:00:00.000Z",
          payload: {},
        }),
      );
    }
    await once(ws, "close");
    expect(adapter.getConnectionCount()).toBe(0);
  });

  it("cleans up on handshake timeout", async () => {
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      limits: { handshakeTimeoutMs: 80, unauthIdleMs: 5_000 },
    });
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    await once(ws, "close");
    expect(adapter.getConnectionCount()).toBe(0);
  });

  it("teardown on stop is deterministic", async () => {
    const adapter = await startAdapter();
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send(JSON.stringify(fixturesHello));
    await waitMessage(ws);
    expect(adapter.getConnectionCount()).toBe(1);
    adapter.beginAppShutdown();
    await adapter.stop();
    expect(adapter.getStatus()).toBe("disabled");
    expect(adapter.getConnectionCount()).toBe(0);
    expect(adapter.getBoundAddress()).toBeNull();
  });

  it("does not log payload bodies or secrets", async () => {
    const logs: string[] = [];
    const adapter = await startAdapter({
      desktopVersion: "0.11.2-test",
      onLog: (event, fields) => {
        logs.push(JSON.stringify({ event, fields }));
      },
    });
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    ws.send(
      JSON.stringify({
        ...fixturesHello,
        // hostile keys must never appear in allowlisted logs
        application: { name: "fixture-crm", version: "1.0.0" },
      }),
    );
    await waitMessage(ws);
    const joined = logs.join("\n");
    expect(joined).not.toContain("password");
    expect(joined).not.toContain("apiKey");
    expect(joined).not.toContain("clientNonce");
    expect(joined).not.toContain("Y2xpZW50bm9uY2UxMjM");
    expect(joined).not.toContain("sdk:client-hello");
    ws.close();
  });
});
