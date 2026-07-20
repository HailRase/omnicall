/**
 * DI-07 adversarial: operator/logout routing over authenticated gateway.
 */

import { once } from "node:events";

import {
  PROTOCOL_MAJOR,
  WS_PATH,
  validateWireMessage,
  type WireMessage,
} from "@axatalk/protocol";
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
        "operator.status.write",
        "session.logout",
      ],
      clientNonce: "Y2xpZW50bm9uY2UxMjM",
      occurredAt: "2026-07-20T09:00:00.000Z",
      ...(clientId !== undefined ? { clientId } : {}),
    }),
  );
  return expectType(await queue.next(), "sdk:server-hello");
}

type PopTestKeys = ReturnType<typeof generateSdkPopTestKeyPair>;

async function authOperatorSession(
  adapter: LocalWsServerAdapter,
  clientId: string,
  keys: PopTestKeys,
): Promise<{
  ws: WebSocket;
  queue: MessageQueue;
  hello: Extract<WireMessage, { type: "sdk:server-hello" }>;
}> {
  const port = adapter.getBoundAddress()!.port;
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

async function pairAuthOperator(
  adapter: LocalWsServerAdapter,
  clientId: string,
): Promise<{
  ws: WebSocket;
  queue: MessageQueue;
  hello: Extract<WireMessage, { type: "sdk:server-hello" }>;
  keys: PopTestKeys;
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
      requestedProfile: "operator",
      requestedCapabilities: [
        "session.read.redacted",
        "operator.status.write",
        "session.logout",
      ],
      occurredAt: "2026-07-20T09:00:00.000Z",
    }),
  );
  expectType(await pairQueue.next(), "pairing:pending");
  expectType(await pairQueue.next(), "pairing:approved");
  pairQueue.close();
  pairWs.close();
  await once(pairWs, "close");

  const session = await authOperatorSession(adapter, clientId, keys);
  return { ...session, keys };
}

describe("LocalWsServerAdapter DI-07 operator/logout", () => {
  it("denies operator:change-status without capability as forbidden", async () => {
    const adapter = await startAdapter();
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
        clientId: "client_pres_001",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted"],
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
    const hello = await handshake(authQueue, authWs, "client_pres_001");
    const challenge = hello.authChallenge!;
    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_pres_001",
        signature: signSdkPopPayload({
          privateKey: keys.privateKey,
          serverInstanceId: hello.serverInstanceId,
          sessionEpoch: hello.sessionEpoch,
          origin: TEST_ORIGIN,
          clientId: "client_pres_001",
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
        type: "operator:change-status",
        requestId: "req_forbid_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { target: "ready", expectedRevision: 1 },
      }),
    );
    const reply = await authQueue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply") {
      expect(reply.ok).toBe(false);
      if (!reply.ok) {
        expect(reply.error.code).toBe("forbidden");
      }
    }
    authQueue.close();
    authWs.close();
  });

  it("routes operator:change-status to broker with clientId", async () => {
    let seenClientId: string | undefined;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: (command, context) => {
          seenClientId = context?.clientId;
          if (command.kind !== "command") {
            return Promise.resolve({
              ok: false as const,
              code: "invalid_message",
            });
          }
          return Promise.resolve({
            ok: true as const,
            reply: {
              protocolVersion: PROTOCOL_MAJOR,
              kind: "reply" as const,
              ok: true as const,
              requestId: command.requestId,
              commandType: command.type,
              serverInstanceId: "srv_test",
              sessionEpoch: "epoch_test",
              occurredAt: "2026-07-20T09:00:00.000Z",
              revision: 2,
              result: { accepted: true },
            },
          });
        },
      }),
    });

    const { ws, queue, hello } = await pairAuthOperator(
      adapter,
      "client_op_ws_001",
    );
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "operator:change-status",
        requestId: "req_op_ws_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { target: "break", reasonId: 7, expectedRevision: 1 },
      }),
    );
    const reply = await queue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && reply.ok) {
      expect(reply.revision).toBe(2);
      expect(reply.result).toEqual({ accepted: true });
    }
    expect(seenClientId).toBe("client_op_ws_001");
    queue.close();
    ws.close();
  });

  it("forwards interaction_required details for prepare-logout", async () => {
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: () =>
          Promise.resolve({
            ok: false as const,
            code: "interaction_required" as const,
            details: {
              logoutToken: "logout_ws_001",
              reasons: [{ id: 90, label: "End", kind: "logout" }],
            },
          }),
      }),
    });
    const { ws, queue, hello } = await pairAuthOperator(
      adapter,
      "client_op_ws_002",
    );
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "account:prepare-logout",
        requestId: "req_prep_ws_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { expectedRevision: 1 },
      }),
    );
    const reply = await queue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && !reply.ok) {
      expect(reply.error.code).toBe("interaction_required");
      expect(reply.error.details).toEqual({
        logoutToken: "logout_ws_001",
        reasons: [{ id: 90, label: "End", kind: "logout" }],
      });
      expect(JSON.stringify(reply)).not.toMatch(/apiKey/i);
    }
    queue.close();
    ws.close();
  });

  it("denies unauthenticated operator command", async () => {
    const adapter = await startAdapter();
    const port = adapter.getBoundAddress()!.port;
    const ws = await openWs(port);
    const queue = attachMessageQueue(ws);
    const hello = await handshake(queue, ws);
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "operator:get-reasons",
        requestId: "req_unauth_op_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: {},
      }),
    );
    const reply = await queue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && !reply.ok) {
      expect(reply.error.code).toBe("unauthenticated");
    }
    queue.close();
    ws.close();
  });

  it("notifies onClientSessionEnded on disconnect without requiring SIP teardown", async () => {
    const ended: string[] = [];
    const adapter = await startAdapter({
      productSurface: createSurface({
        onClientSessionEnded: (clientId) => {
          ended.push(clientId);
        },
      }),
    });
    const { ws, queue } = await pairAuthOperator(adapter, "client_op_end_001");
    queue.close();
    ws.close();
    await once(ws, "close");
    await new Promise((r) => setTimeout(r, 40));
    expect(ended).toContain("client_op_end_001");
  });

  it("DI-08: denies account:activate-profile without capability", async () => {
    let brokerCalls = 0;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: () => {
          brokerCalls += 1;
          return Promise.resolve({ ok: false as const, code: "operation_failed" });
        },
      }),
    });
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
        clientId: "client_act_pres_001",
        clientPublicKey: keys.publicKeyBase64Url,
        keyAlgorithm: "ECDSA-P256-SHA256",
        application: { name: "fixture-crm", version: "1.0.0" },
        requestedProfile: "presentation",
        requestedCapabilities: ["session.read.redacted"],
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
    const hello = await handshake(authQueue, authWs, "client_act_pres_001");
    const challenge = hello.authChallenge!;
    authWs.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "auth",
        type: "sdk:auth-proof",
        challengeId: challenge.challengeId,
        clientId: "client_act_pres_001",
        signature: signSdkPopPayload({
          privateKey: keys.privateKey,
          serverInstanceId: hello.serverInstanceId,
          sessionEpoch: hello.sessionEpoch,
          origin: TEST_ORIGIN,
          clientId: "client_act_pres_001",
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
        type: "account:activate-profile",
        requestId: "req_act_forbid_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { profileRef: "prf_dGVzdA", expectedRevision: 1 },
      }),
    );
    const reply = await authQueue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && !reply.ok) {
      expect(reply.error.code).toBe("forbidden");
    }
    expect(brokerCalls).toBe(0);
    authQueue.close();
    authWs.close();
  });

  it("DI-08: grant elevates activate-profile to broker", async () => {
    let seenClientId: string | undefined;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: (command, context) => {
          seenClientId = context?.clientId;
          if (command.kind !== "command") {
            return Promise.resolve({
              ok: false as const,
              code: "invalid_message",
            });
          }
          return Promise.resolve({
            ok: true as const,
            revision: 3,
            reply: {
              protocolVersion: PROTOCOL_MAJOR,
              kind: "reply" as const,
              ok: true as const,
              requestId: command.requestId,
              commandType: "account:activate-profile" as const,
              serverInstanceId: "srv_desktop_test_001",
              sessionEpoch: "epoch_desktop_test_001",
              occurredAt: "2026-07-20T09:00:00.000Z",
              revision: 3,
              result: { activated: true, mode: "sip_only" },
            },
          });
        },
      }),
    });
    const clientId = "client_act_ok_001";
    const { ws, queue, hello } = await pairAuthOperator(adapter, clientId);
    const grant = adapter.issueAccountActivateGrant({
      clientId,
      profileId: "1001@pbx.example",
    });
    expect(grant.ok).toBe(true);
    if (!grant.ok) {
      return;
    }
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "account:activate-profile",
        requestId: "req_act_ok_ws_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { profileRef: grant.profileRef, expectedRevision: 1 },
      }),
    );
    const reply = await queue.next();
    expect(reply).toMatchObject({
      kind: "reply",
      ok: true,
      commandType: "account:activate-profile",
      revision: 3,
      result: { activated: true, mode: "sip_only" },
    });
    expect(seenClientId).toBe(clientId);
    expect(JSON.stringify(reply)).not.toMatch(/password|apiKey|secret/i);
    queue.close();
    ws.close();
  });

  it("DI-08: grant for other profileRef still forbids activate", async () => {
    let brokerCalls = 0;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: () => {
          brokerCalls += 1;
          return Promise.resolve({ ok: false as const, code: "operation_failed" });
        },
      }),
    });
    const clientId = "client_act_mismatch_001";
    const { ws, queue, hello } = await pairAuthOperator(adapter, clientId);
    const grant = adapter.issueAccountActivateGrant({
      clientId,
      profileId: "1001@pbx.example",
    });
    expect(grant.ok).toBe(true);
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "account:activate-profile",
        requestId: "req_act_mismatch_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { profileRef: "prf_b3RoZXI", expectedRevision: 1 },
      }),
    );
    const reply = await queue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && !reply.ok) {
      expect(reply.error.code).toBe("forbidden");
    }
    expect(brokerCalls).toBe(0);
    queue.close();
    ws.close();
  });

  it("DI-08: disconnect clears grants; re-auth activate without new grant is forbidden", async () => {
    let brokerCalls = 0;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: () => {
          brokerCalls += 1;
          return Promise.resolve({ ok: false as const, code: "operation_failed" });
        },
      }),
    });
    const clientId = "client_act_disc_001";
    const { ws, queue, keys } = await pairAuthOperator(adapter, clientId);
    const grant = adapter.issueAccountActivateGrant({
      clientId,
      profileId: "1001@pbx.example",
    });
    expect(grant.ok).toBe(true);
    if (!grant.ok) {
      return;
    }
    const profileRef = grant.profileRef;
    queue.close();
    ws.close();
    await once(ws, "close");
    await new Promise((r) => setTimeout(r, 40));

    const session = await authOperatorSession(adapter, clientId, keys);
    session.ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "account:activate-profile",
        requestId: "req_act_disc_001",
        serverInstanceId: session.hello.serverInstanceId,
        sessionEpoch: session.hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { profileRef, expectedRevision: 1 },
      }),
    );
    const reply = await session.queue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && !reply.ok) {
      expect(reply.error.code).toBe("forbidden");
    }
    expect(brokerCalls).toBe(0);
    session.queue.close();
    session.ws.close();
  });

  it("DI-08: revoke clears grants; re-pair activate without new grant is forbidden", async () => {
    let brokerCalls = 0;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: () => {
          brokerCalls += 1;
          return Promise.resolve({ ok: false as const, code: "operation_failed" });
        },
      }),
    });
    const clientId = "client_act_rev_001";
    const { ws, queue } = await pairAuthOperator(adapter, clientId);
    const grant = adapter.issueAccountActivateGrant({
      clientId,
      profileId: "1001@pbx.example",
    });
    expect(grant.ok).toBe(true);
    if (!grant.ok) {
      return;
    }
    const profileRef = grant.profileRef;
    const revoked = await adapter.revokePairedClient(clientId);
    expect(revoked).toBe(true);
    expectType(await queue.next(), "sdk:revoked");
    await once(ws, "close");
    queue.close();

    const { ws: ws2, queue: queue2, hello } = await pairAuthOperator(
      adapter,
      clientId,
    );
    ws2.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "account:activate-profile",
        requestId: "req_act_rev_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { profileRef, expectedRevision: 1 },
      }),
    );
    const reply = await queue2.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && !reply.ok) {
      expect(reply.error.code).toBe("forbidden");
    }
    expect(brokerCalls).toBe(0);
    queue2.close();
    ws2.close();
  });

  it("DI-08: expired grant strips capability and forbids activate", async () => {
    let brokerCalls = 0;
    const adapter = await startAdapter({
      productSurface: createSurface({
        requestProductCommand: () => {
          brokerCalls += 1;
          return Promise.resolve({ ok: false as const, code: "operation_failed" });
        },
      }),
    });
    const clientId = "client_act_ttl_001";
    const { ws, queue, hello } = await pairAuthOperator(adapter, clientId);
    const grant = adapter.issueAccountActivateGrant({
      clientId,
      profileId: "1001@pbx.example",
      ttlMs: 40,
    });
    expect(grant.ok).toBe(true);
    if (!grant.ok) {
      return;
    }
    await new Promise((r) => setTimeout(r, 80));
    ws.send(
      JSON.stringify({
        protocolVersion: PROTOCOL_MAJOR,
        kind: "command",
        type: "account:activate-profile",
        requestId: "req_act_ttl_001",
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        occurredAt: "2026-07-20T09:00:00.000Z",
        payload: { profileRef: grant.profileRef, expectedRevision: 1 },
      }),
    );
    const reply = await queue.next();
    expect(reply.kind).toBe("reply");
    if (reply.kind === "reply" && !reply.ok) {
      expect(reply.error.code).toBe("forbidden");
    }
    expect(brokerCalls).toBe(0);
    queue.close();
    ws.close();
  });
});
