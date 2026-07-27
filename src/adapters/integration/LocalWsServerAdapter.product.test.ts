/**
 * DI-05 adversarial: snapshot, window:show, per-client events, revoke stop.
 */

import { once } from "node:events";

import {
  PROTOCOL_MAJOR,
  WS_PATH,
  validateWireMessage,
  type WireMessage,
} from "@axata/axatalk-protocol";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket, type RawData } from "ws";

import { LocalWsServerAdapter } from "./LocalWsServerAdapter.js";
import { rawDataToString } from "./localWsServerHelpers.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import {
  generateSdkPopTestKeyPair,
  signSdkPopPayload,
} from "./sdkGatewayPopCrypto.js";
import { withMatrixCapability } from "@domain/settings/SdkOriginTrust.js";

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

function createProductSurface(
  overrides: Partial<SdkGatewayProductSurface> = {},
): SdkGatewayProductSurface {
  return {
    isProductReady: () => true,
    requestProductCommand: (command) => {
      if (command.kind !== "command" || command.type !== "sdk:get-snapshot") {
        return Promise.resolve({ ok: false as const, code: "unsupported_command" });
      }
      return Promise.resolve({
        ok: true as const,
        reply: {
          protocolVersion: PROTOCOL_MAJOR,
          kind: "reply" as const,
          ok: true as const,
          requestId: command.requestId,
          commandType: "sdk:get-snapshot" as const,
          serverInstanceId: command.serverInstanceId,
          sessionEpoch: command.sessionEpoch,
          occurredAt: "2026-07-20T09:00:01.000Z",
          revision: 3,
          result: {
            sections: {
              account: { signedIn: false },
              registration: { state: "unregistered" },
              calls: [],
            },
          },
        },
      });
    },
    showWindow: () => ({ ok: true, revision: 2, visible: true }),
    hideWindow: () => ({ ok: true, revision: 3, visible: false }),
    getWindowState: () => ({ ok: true, visible: false, revision: 1 }),
    ...overrides,
  };
}

async function startAdapter(
  overrides: Partial<ConstructorParameters<typeof LocalWsServerAdapter>[0]> = {},
): Promise<LocalWsServerAdapter> {
  const adapter = new LocalWsServerAdapter({
    desktopVersion: "0.11.2-test",
    host: "127.0.0.1",
    port: 0,
    allowedOrigins: [TEST_ORIGIN],
    autoApprovePairing: true,
    secretStorage: new InMemorySecretStorageAdapter(),
    productSurface: createProductSurface(),
    ...overrides,
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

type MessageQueue = {
  readonly next: () => Promise<WireMessage>;
  readonly close: () => void;
};

function attachMessageQueue(ws: WebSocket): MessageQueue {
  const buffer: WireMessage[] = [];
  const waiters: Array<(message: WireMessage) => void> = [];
  const onMessage = (data: RawData): void => {
    const text = rawDataToString(data);
    const parsed: unknown = JSON.parse(text);
    const validated = validateWireMessage(parsed);
    if (!validated.success) {
      throw new Error(`invalid wire message: ${validated.code}`);
    }
    const waiter = waiters.shift();
    if (waiter !== undefined) {
      waiter(validated.data);
      return;
    }
    buffer.push(validated.data);
  };
  ws.on("message", onMessage);
  return {
    next: () =>
      new Promise<WireMessage>((resolve) => {
        const buffered = buffer.shift();
        if (buffered !== undefined) {
          resolve(buffered);
          return;
        }
        waiters.push(resolve);
      }),
    close: () => {
      ws.off("message", onMessage);
    },
  };
}

function expectMessageType<T extends string>(
  message: WireMessage,
  type: T,
): Extract<WireMessage, { type: T }> {
  if (!("type" in message) || message.type !== type) {
    throw new Error(`expected ${type}`);
  }
  return message as Extract<WireMessage, { type: T }>;
}

async function handshake(
  queue: MessageQueue,
  ws: WebSocket,
  clientId?: string,
): Promise<Extract<WireMessage, { type: "sdk:server-hello" }>> {
  ws.send(
    JSON.stringify({
      protocolVersion: PROTOCOL_MAJOR,
      kind: "handshake",
      type: "sdk:client-hello",
      protocolMin: 1,
      protocolMax: 1,
      sdkVersion: "0.0.0-test",
      application: { name: "fixture-crm", version: "1.0.0" },
      requestedCapabilities: ["session.read.redacted", "window.show"],
      clientNonce: "Y2xpZW50bm9uY2UxMjM",
      occurredAt: "2026-07-20T09:00:00.000Z",
      ...(clientId !== undefined ? { clientId } : {}),
    }),
  );
  return expectMessageType(await queue.next(), "sdk:server-hello");
}

async function pairAndAuth(
  adapter: LocalWsServerAdapter,
  clientId: string,
  requestedCapabilities: readonly (
    | "session.read.redacted"
    | "window.show"
  )[] = ["session.read.redacted", "window.show"],
): Promise<{
  ws: WebSocket;
  queue: MessageQueue;
  hello: Extract<WireMessage, { type: "sdk:server-hello" }>;
}> {
  const keys = generateSdkPopTestKeyPair();
  const port = boundPort(adapter);
  const pairWs = openClient(port);
  await waitOpen(pairWs);
  const pairQueue = attachMessageQueue(pairWs);
  await handshake(pairQueue, pairWs);
  pairWs.send(
    JSON.stringify({
      protocolVersion: PROTOCOL_MAJOR,
      kind: "pairing",
      type: "pairing:request",
      clientId,
      clientPublicKey: keys.publicKeyBase64Url,
      keyAlgorithm: "ECDSA-P256-SHA256",
      application: { name: "fixture-crm", version: "1.0.0" },
      requestedProfile: "presentation",
      requestedCapabilities: [...requestedCapabilities],
      occurredAt: "2026-07-20T09:00:00.000Z",
    }),
  );
  expectMessageType(await pairQueue.next(), "pairing:pending");
  expectMessageType(await pairQueue.next(), "pairing:approved");
  pairQueue.close();
  pairWs.close();
  await once(pairWs, "close");

  const authWs = openClient(port);
  await waitOpen(authWs);
  const authQueue = attachMessageQueue(authWs);
  const hello = await handshake(authQueue, authWs, clientId);
  expect(hello.authChallenge).toBeDefined();
  const challenge = hello.authChallenge!;
  const signature = signSdkPopPayload({
    privateKey: keys.privateKey,
    serverInstanceId: hello.serverInstanceId,
    sessionEpoch: hello.sessionEpoch,
    origin: TEST_ORIGIN,
    clientId,
    challengeId: challenge.challengeId,
    nonce: challenge.nonce,
  });
  authWs.send(
    JSON.stringify({
      protocolVersion: PROTOCOL_MAJOR,
      kind: "auth",
      type: "sdk:auth-proof",
      challengeId: challenge.challengeId,
      clientId,
      signature,
      occurredAt: "2026-07-20T09:00:00.000Z",
    }),
  );
  await new Promise((r) => setTimeout(r, 40));
  return { ws: authWs, queue: authQueue, hello };
}

describe("LocalWsServerAdapter DI-05 product surface", () => {
  it("returns redacted snapshot for auth + session.read.redacted", async () => {
    const adapter = await startAdapter();
    const { ws, queue, hello } = await pairAndAuth(adapter, "client_snap_001");
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:get-snapshot",
        requestId: "req_snap_ok",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const snapshot = await queue.next();
    expect(snapshot).toMatchObject({
      kind: "snapshot",
      type: "sdk:snapshot",
      sections: {
        session: {
          clientId: "client_snap_001",
          authenticated: true,
        },
        account: { signedIn: false },
        window: { visible: false },
      },
    });
    const reply = await queue.next();
    expect(reply).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "sdk:get-snapshot",
      result: { accepted: true },
    });
    queue.close();
    ws.close();
  });

  it("denies snapshot without capability", async () => {
    const adapter = await startAdapter();
    const keys = generateSdkPopTestKeyPair();
    const port = boundPort(adapter);
    const pairWs = openClient(port);
    await waitOpen(pairWs);
    const pairQueue = attachMessageQueue(pairWs);
    await handshake(pairQueue, pairWs);
    pairWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "pairing",
        type: "pairing:request",
        clientId: "client_no_read",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["window.show"],
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    expectMessageType(await pairQueue.next(), "pairing:pending");
    expectMessageType(await pairQueue.next(), "pairing:approved");
    pairQueue.close();
    pairWs.close();
    await once(pairWs, "close");

    const authWs = openClient(port);
    await waitOpen(authWs);
    const authQueue = attachMessageQueue(authWs);
    const hello = await handshake(authQueue, authWs, "client_no_read");
    const challenge = hello.authChallenge!;
    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_no_read",
        signature: signSdkPopPayload({
          privateKey: keys.privateKey,
          serverInstanceId: hello.serverInstanceId,
          sessionEpoch: hello.sessionEpoch,
          origin: TEST_ORIGIN,
          clientId: "client_no_read",
          challengeId: challenge.challengeId,
          nonce: challenge.nonce,
        }),
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    await new Promise((r) => setTimeout(r, 40));
    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:get-snapshot",
        requestId: "req_snap_forbidden",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const reply = await authQueue.next();
    expect(reply).toMatchObject({
      kind: "reply",
      ok: false,
      error: { code: "forbidden" },
    });
    authQueue.close();
    authWs.close();
  });

  it("delivers events only to subscribed authorized client", async () => {
    const adapter = await startAdapter();
    const a = await pairAndAuth(adapter, "client_evt_a");
    const b = await pairAndAuth(adapter, "client_evt_b");
    const delivered = adapter.publishPublicEvent({
      type: "registration:changed",
      payload: { state: "registered" },
      revision: 1,
    });
    expect(delivered).toBe(2);
    const evtA = await a.queue.next();
    const evtB = await b.queue.next();
    expect(evtA).toMatchObject({
      kind: "event",
      type: "registration:changed",
      sequence: 1,
    });
    expect(evtB).toMatchObject({
      kind: "event",
      type: "registration:changed",
      sequence: 1,
    });
    expect(evtA.kind === "event" && evtA.eventId).not.toBe(
      evtB.kind === "event" && evtB.eventId,
    );
    a.queue.close();
    b.queue.close();
    a.ws.close();
    b.ws.close();
  });

  it("requires window.show for window:show and succeeds via shell path", async () => {
    const logs: string[] = [];
    let showCount = 0;
    const adapter = await startAdapter({
      productSurface: createProductSurface({
        showWindow: () => {
          showCount += 1;
          return { ok: true, revision: 5, visible: true };
        },
      }),
      onLog: (event) => {
        logs.push(event);
      },
    });
    const { ws, queue, hello } = await pairAndAuth(adapter, "client_win_001");
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "window:show",
        requestId: "req_win_show",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const reply = await queue.next();
    expect(reply).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "window:show",
      result: { visible: true },
    });
    const visibility = await queue.next();
    expect(visibility).toMatchObject({
      kind: "event",
      type: "window:visibility-changed",
      payload: { visible: true },
    });
    expect(showCount).toBe(1);
    expect(logs.join(" ")).not.toMatch(/\+1|password|nonce|signature/i);
    queue.close();
    ws.close();
  });

  it("requires window.hide for window:hide and succeeds via shell path", async () => {
    let hideCount = 0;
    const adapter = await startAdapter({
      productSurface: createProductSurface({
        hideWindow: (expectedRevision) => {
          hideCount += 1;
          expect(expectedRevision).toBe(2);
          return { ok: true, revision: 3, visible: false };
        },
        getWindowState: () => ({ ok: true, visible: true, revision: 2 }),
      }),
    });
    const origin = adapter
      .getOriginTrustEntries()
      .find((entry) => entry.origin === TEST_ORIGIN);
    expect(origin?.matrix).not.toBeNull();
    if (origin?.matrix != null) {
      adapter.setOriginTrustEntries([
        {
          ...origin,
          matrix: withMatrixCapability(origin.matrix, "window.hide", true),
        },
      ]);
    }
    const { ws, queue, hello } = await pairAndAuth(adapter, "client_win_hide");
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "window:get-state",
        requestId: "req_win_state",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const stateReply = await queue.next();
    expect(stateReply).toMatchObject({
      kind: "reply",
      ok: true,
      result: { visible: true },
    });
    const revision =
      stateReply.kind === "reply" && stateReply.ok ? stateReply.revision : 2;
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "window:hide",
        requestId: "req_win_hide",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:01.000Z",
        payload: { expectedRevision: revision },
      }),
    );
    const reply = await queue.next();
    expect(reply).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "window:hide",
      result: { visible: false },
    });
    const visibility = await queue.next();
    expect(visibility).toMatchObject({
      kind: "event",
      type: "window:visibility-changed",
      payload: { visible: false },
    });
    expect(hideCount).toBe(1);
    queue.close();
    ws.close();
  });

  it("denies window:show without window.show capability", async () => {
    const adapter = await startAdapter();
    const { ws, queue, hello } = await pairAndAuth(adapter, "client_win_deny", [
      "session.read.redacted",
    ]);
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "window:show",
        requestId: "req_win_forbidden",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const reply = await queue.next();
    expect(reply).toMatchObject({
      kind: "reply",
      ok: false,
      error: { code: "forbidden" },
    });
    queue.close();
    ws.close();
  });

  it("skips event fan-out for clients without session.read.redacted", async () => {
    const adapter = await startAdapter();
    const reader = await pairAndAuth(adapter, "client_evt_reader");
    const windowOnly = await pairAndAuth(adapter, "client_evt_window", [
      "window.show",
    ]);
    const delivered = adapter.publishPublicEvent({
      type: "registration:changed",
      payload: { state: "registered" },
      revision: 1,
    });
    expect(delivered).toBe(1);
    const evt = await reader.queue.next();
    expect(evt).toMatchObject({
      kind: "event",
      type: "registration:changed",
      sequence: 1,
    });
    // Sibling without read cap must not receive the event (no queued message).
    windowOnly.ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "window:get-state",
        requestId: "req_win_state_probe",
        serverInstanceId: windowOnly.hello.serverInstanceId,
        sessionEpoch: windowOnly.hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const probe = await windowOnly.queue.next();
    expect(probe).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "window:get-state",
    });
    reader.queue.close();
    windowOnly.queue.close();
    reader.ws.close();
    windowOnly.ws.close();
  });

  it("keeps per-connection sequence monotonic and allows get-snapshot resync", async () => {
    const adapter = await startAdapter();
    const { ws, queue, hello } = await pairAndAuth(adapter, "client_seq_001");
    expect(
      adapter.publishPublicEvent({
        type: "registration:changed",
        payload: { state: "registered" },
        revision: 1,
      }),
    ).toBe(1);
    const evt1 = await queue.next();
    expect(evt1).toMatchObject({ kind: "event", sequence: 1 });
    expect(
      adapter.publishPublicEvent({
        type: "registration:changed",
        payload: { state: "unregistered" },
        revision: 2,
      }),
    ).toBe(1);
    const evt2 = await queue.next();
    expect(evt2).toMatchObject({ kind: "event", sequence: 2 });
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:get-snapshot",
        requestId: "req_seq_resync",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const snapshot = await queue.next();
    expect(snapshot).toMatchObject({
      kind: "snapshot",
      type: "sdk:snapshot",
    });
    const reply = await queue.next();
    expect(reply).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "sdk:get-snapshot",
    });
    queue.close();
    ws.close();
  });

  it("stops snapshot after revoke without requiring SIP teardown", async () => {
    const adapter = await startAdapter();
    const { ws, queue, hello } = await pairAndAuth(adapter, "client_rev_001");
    await adapter.revokePairedClient("client_rev_001");
    const revoked = await queue.next();
    expect(revoked).toMatchObject({ kind: "event", type: "sdk:revoked" });
    await once(ws, "close");
    const delivered = adapter.publishPublicEvent({
      type: "registration:changed",
      payload: { state: "registered" },
      revision: 2,
    });
    expect(delivered).toBe(0);
    expect(hello.serverInstanceId.length).toBeGreaterThan(0);
  });

  it("emits sdk:server-shutdown on beginAppShutdown before teardown", async () => {
    const adapter = await startAdapter();
    const { ws, queue } = await pairAndAuth(adapter, "client_shutdown_001");
    expect(
      adapter.publishPublicEvent({
        type: "registration:changed",
        payload: { state: "registered" },
        revision: 1,
      }),
    ).toBe(1);
    const evt1 = await queue.next();
    expect(evt1).toMatchObject({ kind: "event", sequence: 1 });
    adapter.beginAppShutdown();
    const shutdown = await queue.next();
    expect(shutdown).toMatchObject({
      kind: "event",
      type: "sdk:server-shutdown",
      sequence: 2,
      payload: { reasonCode: "app_quit" },
    });
    const validated = validateWireMessage(shutdown);
    expect(validated.success).toBe(true);
    // Idempotent: stop must not emit a second shutdown.
    await adapter.stop();
    await once(ws, "close");
  });
});
