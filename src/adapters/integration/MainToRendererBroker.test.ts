import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { SdkBrokerProbeHandler } from "@application/integration/SdkBrokerProbeHandler.js";
import type { SdkBrokerRequestIpcPayload } from "@shared/ipc/SdkBrokerContract.js";

import { MainToRendererBroker } from "./MainToRendererBroker.js";
import { RendererSdkBrokerSession } from "./RendererSdkBrokerSession.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../omnicall-kit/packages/protocol/fixtures",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesRoot, relativePath), "utf8"),
  ) as unknown;
}

function createLoopbackPair(options?: {
  readonly timeoutMs?: number;
  readonly autoReply?: boolean;
}): Readonly<{
  broker: MainToRendererBroker;
  handler: SdkBrokerProbeHandler;
  session: RendererSdkBrokerSession;
  sent: SdkBrokerRequestIpcPayload[];
}> {
  const handler = new SdkBrokerProbeHandler();
  const session = new RendererSdkBrokerSession({
    handler,
    serverInstanceId: "srv_loop",
    sessionEpoch: "epoch_loop",
    createOccurredAt: () => "2026-07-20T12:00:00.000Z",
  });
  session.markActive();

  const sent: SdkBrokerRequestIpcPayload[] = [];
  const autoReply = options?.autoReply ?? true;

  const broker = new MainToRendererBroker({
    timeoutMs: options?.timeoutMs ?? 5_000,
    createBrokerRequestId: (() => {
      let n = 0;
      return () => {
        n += 1;
        return `brk_test_${n}`;
      };
    })(),
    transport: {
      sendRequest: (payload) => {
        sent.push(payload);
        if (autoReply) {
          void session.handleRequest(payload).then((reply) => {
            broker.acceptReply(reply);
          });
        }
        return true;
      },
    },
  });

  return { broker, handler, session, sent };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("MainToRendererBroker", () => {
  it("returns not_ready until composition signals readiness", async () => {
    const { broker } = createLoopbackPair();
    expect(broker.isReady()).toBe(false);
    await expect(
      broker.request(readJson("valid/command/sdk-ping-unknown-key-stripped.json")),
    ).resolves.toEqual({ ok: false, code: "not_ready" });
  });

  it("delivers a successful sdk:ping to exactly one Application handler", async () => {
    const { broker, handler } = createLoopbackPair();
    broker.setReady(true);

    const result = await broker.request(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );

    expect(handler.getHandleCount()).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok && result.reply.ok) {
      expect(result.reply.commandType).toBe("sdk:ping");
      expect(result.reply.requestId).toBe("req_ping_extra_001");
      expect(result.reply.result).toEqual({ nonce: "nonce_ping_001" });
    }
  });

  it("forwards window:hide to probe which rejects as unsupported_command (main-owned path)", async () => {
    const { broker, handler } = createLoopbackPair();
    broker.setReady(true);
    const result = await broker.request(
      readJson("valid/command/window-hide-schema-only.json"),
    );
    expect(result).toEqual({ ok: false, code: "unsupported_command" });
    expect(handler.getHandleCount()).toBe(0);
  });

  it("fails closed on malformed protocol input without IPC send", async () => {
    const sent: SdkBrokerRequestIpcPayload[] = [];
    const broker = new MainToRendererBroker({
      transport: {
        sendRequest: (payload) => {
          sent.push(payload);
          return true;
        },
      },
    });
    broker.setReady(true);
    const result = await broker.request("not-json");
    expect(result.ok).toBe(false);
    expect(sent).toEqual([]);
  });

  it("times out and clears pending timers", async () => {
    vi.useFakeTimers();
    const { broker } = createLoopbackPair({ timeoutMs: 100, autoReply: false });
    broker.setReady(true);

    const pending = broker.request(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    expect(broker.getPendingCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(100);
    await expect(pending).resolves.toEqual({ ok: false, code: "timeout" });
    expect(broker.getPendingCount()).toBe(0);
  });

  it("uses long hop timeout for account:activate-profile only", async () => {
    vi.useFakeTimers();
    const { broker } = createLoopbackPair({ timeoutMs: 100, autoReply: false });
    broker.setReady(true);

    const activate = {
      protocolVersion: 1,
      kind: "command",
      type: "account:activate-profile",
      requestId: "req_act_broker_ttl_001",
      serverInstanceId: "srv_fixture",
      sessionEpoch: "epoch_fixture",
      occurredAt: "2026-07-20T12:00:00.000Z",
      payload: {
        login: "1001",
        expectedRevision: 1,
      },
    };
    const pending = broker.request(activate);
    expect(broker.getPendingCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(broker.getPendingCount()).toBe(1);

    const { SDK_ACTIVATE_BROKER_TIMEOUT_MS } = await import(
      "@shared/integration/sdkActivateTimeouts.js"
    );
    await vi.advanceTimersByTimeAsync(SDK_ACTIVATE_BROKER_TIMEOUT_MS - 5_000);
    await expect(pending).resolves.toEqual({ ok: false, code: "timeout" });
    expect(broker.getPendingCount()).toBe(0);
  });

  it("cancels a pending request with operation_failed", async () => {
    const { broker } = createLoopbackPair({ autoReply: false });
    broker.setReady(true);

    const pending = broker.request(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    expect(broker.cancel("brk_test_1")).toBe(true);
    await expect(pending).resolves.toEqual({
      ok: false,
      code: "operation_failed",
    });
    expect(broker.getPendingCount()).toBe(0);
  });

  it("reload forces resync semantics without replaying the in-flight mutation", async () => {
    const handler = new SdkBrokerProbeHandler();
    const session = new RendererSdkBrokerSession({
      handler,
      serverInstanceId: "srv_loop",
      sessionEpoch: "epoch_loop",
      createOccurredAt: () => "2026-07-20T12:00:00.000Z",
    });
    session.markActive();

    let replyEnabled = false;
    const broker = new MainToRendererBroker({
      timeoutMs: 5_000,
      createBrokerRequestId: (() => {
        let n = 0;
        return () => {
          n += 1;
          return `brk_reload_${n}`;
        };
      })(),
      transport: {
        sendRequest: (payload) => {
          if (replyEnabled) {
            void session.handleRequest(payload).then((reply) => {
              broker.acceptReply(reply);
            });
          }
          return true;
        },
      },
    });

    broker.setReady(true);
    const pending = broker.request(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    broker.notifyRendererReload();
    await expect(pending).resolves.toEqual({ ok: false, code: "not_ready" });
    expect(handler.getHandleCount()).toBe(0);

    replyEnabled = true;
    broker.setReady(true);
    const result = await broker.request(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    expect(result.ok).toBe(true);
    expect(handler.getHandleCount()).toBe(1);
  });

  it("beginAppShutdown rejects pending; cancelAppShutdown restores readiness", async () => {
    const { broker } = createLoopbackPair({ autoReply: false });
    broker.setReady(true);

    const pending = broker.request(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    broker.beginAppShutdown();
    await expect(pending).resolves.toEqual({
      ok: false,
      code: "operation_failed",
    });
    expect(broker.getPendingCount()).toBe(0);
    expect(broker.isReady()).toBe(false);

    // Cancelled quit restores the preserved composition ready claim (no rebind).
    broker.cancelAppShutdown();
    expect(broker.isReady()).toBe(true);

    broker.shutdown();
    expect(broker.isReady()).toBe(false);
    await expect(
      broker.request(readJson("valid/command/sdk-ping-unknown-key-stripped.json")),
    ).resolves.toEqual({ ok: false, code: "operation_failed" });
  });

  it("cancelAppShutdown does not mark ready when composition never claimed ready", () => {
    const { broker } = createLoopbackPair({ autoReply: false });
    broker.beginAppShutdown();
    broker.cancelAppShutdown();
    expect(broker.isReady()).toBe(false);
  });

  it("stays not_ready while paused even if setReady(true) arrives mid-shutdown", async () => {
    const { broker } = createLoopbackPair({ autoReply: false });
    broker.beginAppShutdown();
    broker.setReady(true);
    expect(broker.isReady()).toBe(false);
    await expect(
      broker.request(readJson("valid/command/sdk-ping-unknown-key-stripped.json")),
    ).resolves.toEqual({ ok: false, code: "not_ready" });

    broker.cancelAppShutdown();
    expect(broker.isReady()).toBe(true);
  });

  it("returns not_ready when transport cannot reach the renderer", async () => {
    const broker = new MainToRendererBroker({
      transport: { sendRequest: () => false },
    });
    broker.setReady(true);
    await expect(
      broker.request(readJson("valid/command/sdk-ping-unknown-key-stripped.json")),
    ).resolves.toEqual({ ok: false, code: "not_ready" });
  });

  it("does not log command payloads on settlement", async () => {
    const logs: Array<{ event: string; fields: Record<string, unknown> }> = [];
    const handler = new SdkBrokerProbeHandler();
    const session = new RendererSdkBrokerSession({
      handler,
      serverInstanceId: "srv_loop",
      sessionEpoch: "epoch_loop",
      createOccurredAt: () => "2026-07-20T12:00:00.000Z",
    });
    session.markActive();

    const broker = new MainToRendererBroker({
      onLog: (event, fields) => {
        logs.push({ event, fields: { ...fields } });
      },
      transport: {
        sendRequest: (payload) => {
          void session.handleRequest(payload).then((reply) => {
            broker.acceptReply(reply);
          });
          return true;
        },
      },
    });
    broker.setReady(true);
    await broker.request(readJson("valid/command/sdk-ping-unknown-key-stripped.json"));

    const serialized = JSON.stringify(logs);
    expect(serialized).not.toContain("nonce_ping_001");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("apiKey");
  });
});
