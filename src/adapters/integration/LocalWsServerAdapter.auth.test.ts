/**
 * DI-04 adversarial coverage: Origin, pairing, PoP, capabilities, revoke.
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
import {
  generateSdkPopTestKeyPair,
  signSdkPopPayload,
} from "./sdkGatewayPopCrypto.js";
import { SDK_AUTH_SESSION_TTL_MS } from "./sdkGatewaySessionAuth.js";

const TEST_ORIGIN = "https://crm.example";
const OTHER_ORIGIN = "https://other.example";

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
    allowedOrigins: [TEST_ORIGIN],
    autoApprovePairing: true,
    secretStorage: new InMemorySecretStorageAdapter(),
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

function openClient(port: number, origin = TEST_ORIGIN): WebSocket {
  return new WebSocket(`ws://127.0.0.1:${port}${WS_PATH}`, {
    headers: { Origin: origin },
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

function clientHello(clientId?: string): Record<string, unknown> {
  return {
    protocolVersion: PROTOCOL_MAJOR,
    kind: "handshake",
    type: "sdk:client-hello",
    protocolMin: 1,
    protocolMax: 1,
    sdkVersion: "0.0.0-test",
    application: { name: "fixture-crm", version: "1.0.0" },
    ...(clientId !== undefined ? { clientId } : {}),
    requestedCapabilities: ["session.read.redacted", "window.show"],
    clientNonce: "Y2xpZW50bm9uY2UxMjM",
    occurredAt: "2026-07-20T09:00:00.000Z",
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
  ws.send(JSON.stringify(clientHello(clientId)));
  return expectMessageType(await queue.next(), "sdk:server-hello");
}

describe("LocalWsServerAdapter DI-04 auth", () => {
  it("rejects missing and hostile Origins at upgrade", async () => {
    const adapter = await startAdapter();
    const port = boundPort(adapter);

    const expectRejected = async (
      headers?: Record<string, string>,
    ): Promise<void> => {
      const outcome = await new Promise<"opened" | "rejected">((resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}${WS_PATH}`, {
          ...(headers !== undefined ? { headers } : {}),
        });
        ws.on("error", () => {
          resolve("rejected");
        });
        ws.on("unexpected-response", () => {
          resolve("rejected");
        });
        ws.on("close", () => {
          resolve("rejected");
        });
        ws.on("open", () => {
          ws.close();
          resolve("opened");
        });
      });
      expect(outcome).toBe("rejected");
    };

    await expectRejected();
    await expectRejected({ Origin: "null" });
    await expectRejected({ Origin: "https://crm.example.evil" });
    await expectRejected({ Origin: "https://sub.crm.example" });

    const ok = openClient(port);
    await waitOpen(ok);
    ok.close();
  });

  it("pairs with approve then denies without approval", async () => {
    const keys = generateSdkPopTestKeyPair();
    const deferredAdapter = await startAdapter({
      autoApprovePairing: false,
    });
    const port = boundPort(deferredAdapter);
    const ws = openClient(port);
    await waitOpen(ws);
    const queue = attachMessageQueue(ws);
    await handshake(queue, ws);

    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "pairing",
        type: "pairing:request",
        clientId: "client_pair_001",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted", "window.show"],
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    const pending = expectMessageType(await queue.next(), "pairing:pending");
    expect(deferredAdapter.approvePairingRequest(pending.pairingRequestId)).toBe(
      true,
    );
    const approved = expectMessageType(await queue.next(), "pairing:approved");
    expect(approved.grantedCapabilities).toContain("session.read.redacted");
    expect(approved.grantedCapabilities).not.toContain("account.activate");
    queue.close();
    ws.close();

    const denyAdapter = await startAdapter({ autoApprovePairing: false });
    const denyPort = boundPort(denyAdapter);
    const denyWs = openClient(denyPort);
    await waitOpen(denyWs);
    const denyQueue = attachMessageQueue(denyWs);
    await handshake(denyQueue, denyWs);
    denyWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "pairing",
        type: "pairing:request",
        clientId: "client_pair_deny",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted"],
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    const pendingDeny = expectMessageType(
      await denyQueue.next(),
      "pairing:pending",
    );
    expect(denyAdapter.denyPairingRequest(pendingDeny.pairingRequestId)).toBe(
      true,
    );
    expectMessageType(await denyQueue.next(), "pairing:denied");
    denyQueue.close();
    denyWs.close();
  });

  it("authenticates with PoP and rejects bad signature / replay", async () => {
    const keys = generateSdkPopTestKeyPair();
    const logs: string[] = [];
    const adapter = await startAdapter({
      onLog: (event, fields) => {
        logs.push(JSON.stringify({ event, fields }));
      },
    });
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
        clientId: "client_pop_001",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted", "window.show"],
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
    const hello = await handshake(authQueue, authWs, "client_pop_001");
    expect(hello.pairingRequired).toBe(false);
    expect(hello.authChallenge).toBeDefined();
    const challenge = hello.authChallenge!;

    const signature = signSdkPopPayload({
      privateKey: keys.privateKey,
      serverInstanceId: hello.serverInstanceId,
      sessionEpoch: hello.sessionEpoch,
      origin: TEST_ORIGIN,
      clientId: "client_pop_001",
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
    });

    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_pop_001",
        signature,
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    await new Promise((r) => setTimeout(r, 50));

    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:ping",
        requestId: "req_ping_ok",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const pingReply = await authQueue.next();
    expect(pingReply).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "sdk:ping",
    });

    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:get-snapshot",
        requestId: "req_snap_cap",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const snapReply = await authQueue.next();
    expect(snapReply).toMatchObject({
      kind: "reply",
      ok: false,
      error: { code: "not_ready" },
    });

    const replayWs = openClient(port);
    await waitOpen(replayWs);
    const replayQueue = attachMessageQueue(replayWs);
    const hello2 = await handshake(replayQueue, replayWs, "client_pop_001");
    expect(hello2.authChallenge).toBeDefined();
    replayWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_pop_001",
        signature,
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    await once(replayWs, "close");
    replayQueue.close();

    const joined = logs.join("\n");
    expect(joined).not.toContain(signature);
    expect(joined).not.toContain(challenge.nonce);
    expect(joined).not.toContain(keys.publicKeyBase64Url);
    expect(joined).not.toContain("password");
    authQueue.close();
    authWs.close();
  });

  it("rejects bad signature and cross-origin client confusion", async () => {
    const keys = generateSdkPopTestKeyPair();
    const secrets = new InMemorySecretStorageAdapter();
    const adapter = await startAdapter({
      allowedOrigins: [TEST_ORIGIN, OTHER_ORIGIN],
      secretStorage: secrets,
    });
    const port = boundPort(adapter);

    const pairWs = openClient(port, TEST_ORIGIN);
    await waitOpen(pairWs);
    const pairQueue = attachMessageQueue(pairWs);
    await handshake(pairQueue, pairWs);
    pairWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "pairing",
        type: "pairing:request",
        clientId: "client_xorigin",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted"],
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    expectMessageType(await pairQueue.next(), "pairing:pending");
    expectMessageType(await pairQueue.next(), "pairing:approved");
    pairQueue.close();
    pairWs.close();
    await once(pairWs, "close");

    const otherWs = openClient(port, OTHER_ORIGIN);
    await waitOpen(otherWs);
    const otherQueue = attachMessageQueue(otherWs);
    const otherHello = await handshake(otherQueue, otherWs, "client_xorigin");
    expect(otherHello.pairingRequired).toBe(true);
    expect(otherHello.authChallenge).toBeUndefined();
    otherQueue.close();
    otherWs.close();

    const badWs = openClient(port, TEST_ORIGIN);
    await waitOpen(badWs);
    const badQueue = attachMessageQueue(badWs);
    const hello = await handshake(badQueue, badWs, "client_xorigin");
    const challenge = hello.authChallenge!;
    badWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_xorigin",
        signature: "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA",
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    await once(badWs, "close");
    badQueue.close();
  });

  it("revokes client without tearing down SIP marker", async () => {
    const keys = generateSdkPopTestKeyPair();
    const sipSessionAlive = { value: true };
    const adapter = await startAdapter();
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
        clientId: "client_revoke_001",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted", "window.show"],
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
    const hello = await handshake(authQueue, authWs, "client_revoke_001");
    const challenge = hello.authChallenge!;
    const signature = signSdkPopPayload({
      privateKey: keys.privateKey,
      serverInstanceId: hello.serverInstanceId,
      sessionEpoch: hello.sessionEpoch,
      origin: TEST_ORIGIN,
      clientId: "client_revoke_001",
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
    });
    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_revoke_001",
        signature,
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    await new Promise((r) => setTimeout(r, 50));

    const revoked = await adapter.revokePairedClient("client_revoke_001");
    expect(revoked).toBe(true);
    expect(sipSessionAlive.value).toBe(true);

    expectMessageType(await authQueue.next(), "sdk:revoked");
    await once(authWs, "close");
    authQueue.close();

    const reauth = openClient(port);
    await waitOpen(reauth);
    const reauthQueue = attachMessageQueue(reauth);
    const helloAfter = await handshake(reauthQueue, reauth, "client_revoke_001");
    expect(helloAfter.pairingRequired).toBe(true);
    reauthQueue.close();
    reauth.close();
  });

  it("keeps unauthenticated product commands denied", async () => {
    const adapter = await startAdapter();
    const port = boundPort(adapter);
    const ws = openClient(port);
    await waitOpen(ws);
    const queue = attachMessageQueue(ws);
    const hello = await handshake(queue, ws);
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:get-snapshot",
        requestId: "req_unauth_snap",
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
      error: { code: "unauthenticated" },
    });
    queue.close();
    ws.close();
  });

  it("expires authenticated sessions after TTL", async () => {
    const keys = generateSdkPopTestKeyPair();
    let nowMs = Date.parse("2026-07-20T09:00:00.000Z");
    const adapter = await startAdapter({
      now: () => new Date(nowMs),
    });
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
        clientId: "client_ttl_001",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted"],
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
    const hello = await handshake(authQueue, authWs, "client_ttl_001");
    const challenge = hello.authChallenge!;
    const signature = signSdkPopPayload({
      privateKey: keys.privateKey,
      serverInstanceId: hello.serverInstanceId,
      sessionEpoch: hello.sessionEpoch,
      origin: TEST_ORIGIN,
      clientId: "client_ttl_001",
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
    });
    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_ttl_001",
        signature,
        occurredAt: "2026-07-20T09:00:00.000Z",
      }),
    );
    await new Promise((r) => setTimeout(r, 50));

    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:ping",
        requestId: "req_ping_before_ttl",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    expect(await authQueue.next()).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "sdk:ping",
    });

    nowMs += SDK_AUTH_SESSION_TTL_MS + 1;
    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "sdk:ping",
        requestId: "req_ping_after_ttl",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:30:01.000Z",
        payload: {},
      }),
    );
    await once(authWs, "close");
    authQueue.close();
  });
});
