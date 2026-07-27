/**
 * ADR-0018: multi-Origin isolation + live matrix shrink (grants ∩ policy).
 */

import { once } from "node:events";

import {
  PROTOCOL_MAJOR,
  WS_PATH,
  validateWireMessage,
  type WireMessage,
} from "@softomnitel/omnicall-protocol";
import { InMemorySecretStorageAdapter } from "@adapters/secrets/InMemorySecretStorageAdapter.js";
import {
  createDefaultSdkOriginCapabilityMatrix,
  withMatrixCapability,
  type SdkOriginCapabilityMatrix,
  type SdkOriginTrustEntry,
} from "@domain/index.js";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket, type RawData } from "ws";

import { LocalWsServerAdapter } from "./LocalWsServerAdapter.js";
import { rawDataToString } from "./localWsServerHelpers.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import {
  generateSdkPopTestKeyPair,
  signSdkPopPayload,
} from "./sdkGatewayPopCrypto.js";

const ORIGIN_A = "https://crm-a.example";
const ORIGIN_B = "https://crm-b.example";

const adapters: LocalWsServerAdapter[] = [];

afterEach(async () => {
  while (adapters.length > 0) {
    const adapter = adapters.pop();
    if (adapter !== undefined) {
      await adapter.stop();
    }
  }
});

function matrixWithoutOriginate(): SdkOriginCapabilityMatrix {
  return withMatrixCapability(
    createDefaultSdkOriginCapabilityMatrix(),
    "call.originate",
    false,
  );
}

function matrixWithOriginate(): SdkOriginCapabilityMatrix {
  return createDefaultSdkOriginCapabilityMatrix();
}

function allowedEntry(
  origin: string,
  matrix: SdkOriginCapabilityMatrix,
): SdkOriginTrustEntry {
  return {
    origin,
    state: "allowed",
    matrix,
    previouslyAllowed: true,
  };
}

function createSurface(
  overrides: Partial<SdkGatewayProductSurface> = {},
): SdkGatewayProductSurface {
  return {
    isProductReady: () => true,
    requestProductCommand: (command) => {
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
          occurredAt: "2026-07-22T09:00:01.000Z",
          revision: 2,
          result: { callId: "call_multi_001", accepted: true },
        },
      });
    },
    showWindow: () => ({ ok: true, revision: 1, visible: true }),
    hideWindow: () => ({ ok: true, revision: 1, visible: false }),
    getWindowState: () => ({ ok: true, visible: false, revision: 1 }),
    ...overrides,
  };
}

async function startAdapter(
  entries: readonly SdkOriginTrustEntry[],
): Promise<LocalWsServerAdapter> {
  const adapter = new LocalWsServerAdapter({
    desktopVersion: "0.11.2-test",
    host: "127.0.0.1",
    port: 0,
    // Seed via allowlist (same path as DI-04/06 fortress), then replace matrices.
    allowedOrigins: entries.map((entry) => entry.origin),
    autoApprovePairing: true,
    secretStorage: new InMemorySecretStorageAdapter(),
    productSurface: createSurface(),
  });
  adapters.push(adapter);
  expect((await adapter.start()).ok).toBe(true);
  // Preserve autoApprove activate elevation when re-applying matrices.
  adapter.setOriginTrustEntries(
    entries.map((entry) => {
      if (entry.matrix === null) {
        return entry;
      }
      return {
        ...entry,
        matrix: withMatrixCapability(entry.matrix, "account.activate", true),
      };
    }),
  );
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
    throw new Error(
      `expected ${type}, got ${"type" in message ? message.type : "?"}`,
    );
  }
  return message as Extract<WireMessage, { type: T }>;
}

async function openWs(port: number, origin: string): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}${WS_PATH}`, {
    headers: { Origin: origin },
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
        "window.show",
      ],
      clientNonce: "Y2xpZW50bm9uY2UxMjM",
      occurredAt: "2026-07-22T09:00:00.000Z",
      ...(clientId !== undefined ? { clientId } : {}),
    }),
  );
  return expectType(await queue.next(), "sdk:server-hello");
}

async function pairAuth(input: {
  readonly adapter: LocalWsServerAdapter;
  readonly origin: string;
  readonly clientId: string;
}): Promise<{
  ws: WebSocket;
  queue: MessageQueue;
  hello: Extract<WireMessage, { type: "sdk:server-hello" }>;
  approved: Extract<WireMessage, { type: "pairing:approved" }>;
}> {
  const keys = generateSdkPopTestKeyPair();
  const port = input.adapter.getBoundAddress()!.port;
  const pairWs = await openWs(port, input.origin);
  const pairQueue = attachMessageQueue(pairWs);
  await handshake(pairQueue, pairWs);
  pairWs.send(
    JSON.stringify({
      protocolVersion: PROTOCOL_MAJOR,
      kind: "pairing",
      type: "pairing:request",
      clientId: input.clientId,
      clientPublicKey: keys.publicKeyBase64Url,
      keyAlgorithm: "ECDSA-P256-SHA256",
      application: { name: "fixture-crm", version: "1.0.0" },
      requestedProfile: "call_controller",
      requestedCapabilities: [
        "session.read.redacted",
        "call.originate",
        "call.control",
        "window.show",
      ],
      occurredAt: "2026-07-22T09:00:00.000Z",
    }),
  );
  expectType(await pairQueue.next(), "pairing:pending");
  const approved = expectType(await pairQueue.next(), "pairing:approved");
  pairQueue.close();
  pairWs.close();
  await once(pairWs, "close");

  const authWs = await openWs(port, input.origin);
  const authQueue = attachMessageQueue(authWs);
  const hello = await handshake(authQueue, authWs, input.clientId);
  const challenge = hello.authChallenge!;
  authWs.send(
    JSON.stringify({
      protocolVersion: PROTOCOL_MAJOR,
      kind: "auth",
      type: "sdk:auth-proof",
      challengeId: challenge.challengeId,
      clientId: input.clientId,
      signature: signSdkPopPayload({
        privateKey: keys.privateKey,
        serverInstanceId: hello.serverInstanceId,
        sessionEpoch: hello.sessionEpoch,
        origin: input.origin,
        clientId: input.clientId,
        challengeId: challenge.challengeId,
        nonce: challenge.nonce,
      }),
      occurredAt: "2026-07-22T09:00:00.000Z",
    }),
  );
  await new Promise((r) => setTimeout(r, 40));
  return { ws: authWs, queue: authQueue, hello, approved };
}

function originateCommand(
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
    occurredAt: "2026-07-22T09:01:00.000Z",
    payload: { destination: "+15551234567", expectedRevision: 1 },
  });
}

describe("LocalWsServerAdapter multi-Origin matrix isolation", () => {
  it("two Origins keep independent pair grants and command gates", async () => {
    const adapter = await startAdapter([
      allowedEntry(ORIGIN_A, matrixWithoutOriginate()),
      allowedEntry(ORIGIN_B, matrixWithOriginate()),
    ]);

    const sessionA = await pairAuth({
      adapter,
      origin: ORIGIN_A,
      clientId: "client_origin_a",
    });
    expect(sessionA.approved.grantedCapabilities).not.toContain("call.originate");
    expect(sessionA.approved.grantedCapabilities).toContain("session.read.redacted");

    sessionA.ws.send(originateCommand(sessionA.hello, "req_a_forbidden"));
    expect(await sessionA.queue.next()).toMatchObject({
      kind: "reply",
      ok: false,
      requestId: "req_a_forbidden",
      error: { code: "forbidden" },
    });
    sessionA.queue.close();
    sessionA.ws.close();
    await once(sessionA.ws, "close");

    const sessionB = await pairAuth({
      adapter,
      origin: ORIGIN_B,
      clientId: "client_origin_b",
    });
    expect(sessionB.approved.grantedCapabilities).toContain("call.originate");

    sessionB.ws.send(originateCommand(sessionB.hello, "req_b_ok"));
    expect(await sessionB.queue.next()).toMatchObject({
      kind: "reply",
      ok: true,
      requestId: "req_b_ok",
    });

    sessionB.queue.close();
    sessionB.ws.close();
  });

  it("live matrix shrink denies previously granted call.originate with permission_denied", async () => {
    const adapter = await startAdapter([
      allowedEntry(ORIGIN_B, matrixWithOriginate()),
    ]);
    const session = await pairAuth({
      adapter,
      origin: ORIGIN_B,
      clientId: "client_live_shrink",
    });
    expect(session.approved.grantedCapabilities).toContain("call.originate");

    adapter.setOriginTrustEntries([
      {
        ...allowedEntry(ORIGIN_B, matrixWithoutOriginate()),
        matrix: withMatrixCapability(
          matrixWithoutOriginate(),
          "account.activate",
          true,
        ),
      },
    ]);

    session.ws.send(originateCommand(session.hello, "req_live_denied"));
    expect(await session.queue.next()).toMatchObject({
      kind: "reply",
      ok: false,
      requestId: "req_live_denied",
      error: {
        code: "forbidden",
        details: { permission_denied: true },
      },
    });

    session.queue.close();
    session.ws.close();
  });
});
