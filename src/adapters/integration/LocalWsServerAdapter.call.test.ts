/**
 * DI-06 adversarial: call command routing over authenticated gateway.
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

function createSurface(
  overrides: Partial<SdkGatewayProductSurface> = {},
): SdkGatewayProductSurface {
  return {
    isProductReady: () => true,
    requestProductCommand: () =>
      Promise.resolve({ ok: false as const, code: "unsupported_command" }),
    showWindow: () => ({ ok: true, revision: 1, visible: true }),
    hideWindow: () => ({ ok: true, revision: 1, visible: false }),
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
    productSurface: createSurface(),
    ...overrides,
  });
  adapters.push(adapter);
  expect((await adapter.start()).ok).toBe(true);
  return adapter;
}

type MessageQueue = {
  readonly next: () => Promise<WireMessage>;
  readonly close: () => void;
};

function attachMessageQueue(ws: WebSocket): MessageQueue {
  const buffer: WireMessage[] = [];
  const waiters: Array<(message: WireMessage) => void> = [];
  const onMessage = (data: RawData): void => {
    const validated = validateWireMessage(JSON.parse(rawDataToString(data)));
    if (!validated.success) {
      return;
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
      new Promise((resolve) => {
        const queued = buffer.shift();
        if (queued !== undefined) {
          resolve(queued);
          return;
        }
        waiters.push(resolve);
      }),
    close: () => {
      ws.off("message", onMessage);
    },
  };
}

function expectType<T extends string>(
  message: WireMessage,
  type: T,
): Extract<WireMessage, { type: T }> {
  if (!("type" in message) || message.type !== type) {
    throw new Error(`expected ${type}`);
  }
  return message as Extract<WireMessage, { type: T }>;
}

async function openWs(port: number): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}${WS_PATH}`, {
    headers: { Origin: TEST_ORIGIN },
  });
  if (ws.readyState !== WebSocket.OPEN) {
    await once(ws, "open");
  }
  return ws;
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
      requestedCapabilities: [
        "session.read.redacted",
        "call.originate",
        "call.control",
      ],
      clientNonce: "Y2xpZW50bm9uY2UxMjM",
      occurredAt: "2026-07-20T09:00:00.000Z",
      ...(clientId !== undefined ? { clientId } : {}),
    }),
  );
  return expectType(await queue.next(), "sdk:server-hello");
}

async function pairAuth(
  adapter: LocalWsServerAdapter,
  clientId: string,
  profile: "call_controller" | "presentation",
): Promise<{
  ws: WebSocket;
  queue: MessageQueue;
  hello: Extract<WireMessage, { type: "sdk:server-hello" }>;
}> {
  const keys = generateSdkPopTestKeyPair();
  const port = adapter.getBoundAddress()!.port;
  const pairWs = await openWs(port);
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
      requestedProfile: profile,
      requestedCapabilities:
        profile === "call_controller"
          ? ["session.read.redacted", "call.originate", "call.control"]
          : ["session.read.redacted"],
      occurredAt: "2026-07-20T09:00:00.000Z",
    }),
  );
  expectType(await pairQueue.next(), "pairing:pending");
  expectType(await pairQueue.next(), "pairing:approved");
  pairQueue.close();
  pairWs.close();
  await once(pairWs, "close");

  const authWs = await openWs(port);
  const authQueue = attachMessageQueue(authWs);
  const hello = await handshake(authQueue, authWs, clientId);
  const challenge = hello.authChallenge!;
  authWs.send(
    JSON.stringify({
      protocolVersion: PROTOCOL_MAJOR,
      kind: "auth",
      type: "sdk:auth-proof",
      challengeId: challenge.challengeId,
      clientId,
      signature: signSdkPopPayload({
        privateKey: keys.privateKey,
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        origin: TEST_ORIGIN,
        clientId,
        challengeId: challenge.challengeId,
        nonce: challenge.nonce,
      }),
      occurredAt: "2026-07-20T09:00:00.000Z",
    }),
  );
  await new Promise((r) => setTimeout(r, 40));
  return { ws: authWs, queue: authQueue, hello };
}

function originateBody(
  hello: Extract<WireMessage, { type: "sdk:server-hello" }>,
  requestId: string,
): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: "command",
    type: "call:originate",
    requestId,
    serverInstanceId: hello.serverInstanceId,
    sessionEpoch: hello.sessionEpoch,
    occurredAt: "2026-07-20T09:00:00.000Z",
    payload: { destination: "+15551234567", expectedRevision: 1 },
  });
}

describe("LocalWsServerAdapter DI-06 call commands", () => {
  it("routes call:originate to broker with clientId and caches duplicate requestId", async () => {
    let seenClientId: string | undefined;
    let invokeCount = 0;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: (command, context) => {
          invokeCount += 1;
          seenClientId = context?.clientId;
          if (command.kind !== "command") {
            return Promise.resolve({ ok: false as const, code: "invalid_message" });
          }
          return Promise.resolve({
            ok: true as const,
            reply: {
              protocolVersion: PROTOCOL_MAJOR,
              kind: "reply" as const,
              ok: true as const,
              requestId: command.requestId,
              commandType: command.type,
              serverInstanceId: command.serverInstanceId,
              sessionEpoch: command.sessionEpoch,
              occurredAt: "2026-07-20T09:00:01.000Z",
              revision: 2,
              result: { callId: "call_gw_001", accepted: true },
            },
          });
        },
      }),
    });
    const { ws, queue, hello } = await pairAuth(
      adapter,
      "client_call_001",
      "call_controller",
    );
    ws.send(originateBody(hello, "req_call_orig_ok"));
    expect(await queue.next()).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "call:originate",
      result: { callId: "call_gw_001", accepted: true },
    });
    expect(seenClientId).toBe("client_call_001");
    expect(invokeCount).toBe(1);
    ws.send(originateBody(hello, "req_call_orig_ok"));
    expect(await queue.next()).toMatchObject({
      kind: "reply",
      ok: true,
      requestId: "req_call_orig_ok",
    });
    expect(invokeCount).toBe(1);
    queue.close();
    ws.close();
  });

  it("denies call:originate without call.originate capability", async () => {
    const adapter = await startAdapter();
    const { ws, queue, hello } = await pairAuth(
      adapter,
      "client_no_call",
      "presentation",
    );
    ws.send(originateBody(hello, "req_call_forbidden"));
    expect(await queue.next()).toMatchObject({
      kind: "reply",
      ok: false,
      error: { code: "forbidden" },
    });
    queue.close();
    ws.close();
  });

  it("returns not_ready when product composition is unbound", async () => {
    const adapter = await startAdapter({
      productSurface: createSurface({
        isProductReady: () => false,
      }),
    });
    const { ws, queue, hello } = await pairAuth(
      adapter,
      "client_not_ready",
      "call_controller",
    );
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "call:hangup",
        requestId: "req_call_not_ready",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { callId: "call_x", expectedRevision: 1 },
      }),
    );
    expect(await queue.next()).toMatchObject({
      kind: "reply",
      ok: false,
      error: { code: "not_ready" },
    });
    queue.close();
    ws.close();
  });

  it("stops call commands after revoke without SIP teardown", async () => {
    let invokeCount = 0;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: () => {
          invokeCount += 1;
          return Promise.resolve({ ok: false as const, code: "operation_failed" });
        },
      }),
    });
    const { ws, queue, hello } = await pairAuth(
      adapter,
      "client_rev_call",
      "call_controller",
    );
    await adapter.revokePairedClient("client_rev_call");
    expect(await queue.next()).toMatchObject({
      kind: "event",
      type: "sdk:revoked",
    });
    await once(ws, "close");
    expect(hello.serverInstanceId.length).toBeGreaterThan(0);
    expect(invokeCount).toBe(0);
  });
});
