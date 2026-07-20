/**
 * Deterministic MainToRendererBrokerPort test double (DI-01).
 * No IPC, preload, or BrowserWindow. Validates `unknown` with protocol schemas.
 */

import type { CommandMessage, ReplyMessage, WireJsonObject } from "@axatalk/protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axatalk/protocol";
import type {
  BrokerProductRequest,
  BrokerRequestResult,
  MainToRendererBrokerPort,
} from "@ports/integration/MainToRendererBrokerPort.js";

const MOCK_SERVER_INSTANCE_ID = "srv_mock_broker_001";
const MOCK_SESSION_EPOCH = "epoch_mock_broker_001";
/** Fixed timestamp so mock replies are byte-stable across runs. */
const MOCK_OCCURRED_AT = "2026-07-20T10:00:00.000Z";

function emptyResult(): WireJsonObject {
  return {};
}

function readExpectedRevision(
  payload: CommandMessage["payload"],
): number | undefined {
  if (
    "expectedRevision" in payload &&
    typeof payload.expectedRevision === "number"
  ) {
    return payload.expectedRevision;
  }
  return undefined;
}

function toProductRequest(message: CommandMessage): BrokerProductRequest {
  const expectedRevision = readExpectedRevision(message.payload);
  if (expectedRevision === undefined) {
    return {
      requestId: message.requestId,
      commandType: message.type,
      payload: message.payload,
    };
  }
  return {
    requestId: message.requestId,
    commandType: message.type,
    payload: message.payload,
    expectedRevision,
  };
}

function successReply(product: BrokerProductRequest, revision: number): ReplyMessage {
  return {
    protocolVersion: 1,
    kind: "reply",
    ok: true,
    requestId: product.requestId,
    commandType: product.commandType,
    serverInstanceId: MOCK_SERVER_INSTANCE_ID,
    sessionEpoch: MOCK_SESSION_EPOCH,
    occurredAt: MOCK_OCCURRED_AT,
    revision,
    result: emptyResult(),
  };
}

export class MockMainToRendererBroker implements MainToRendererBrokerPort {
  private ready = false;
  private revision = 1;
  private readonly handledRequests: BrokerProductRequest[] = [];

  setReady(ready: boolean): void {
    this.ready = ready;
  }

  isReady(): boolean {
    return this.ready;
  }

  getHandledRequestIds(): ReadonlyArray<string> {
    return this.handledRequests.map((request) => request.requestId);
  }

  getHandledRequests(): ReadonlyArray<BrokerProductRequest> {
    return this.handledRequests;
  }

  request(
    input: unknown,
    context?: { readonly clientId?: string },
  ): Promise<BrokerRequestResult> {
    void context;
    if (!this.ready) {
      return Promise.resolve({ ok: false, code: "not_ready" });
    }

    const validated = validateWireMessage(input);
    if (!validated.success) {
      return Promise.resolve({ ok: false, code: validated.code });
    }

    const message = validated.data;
    if (message.kind !== "command") {
      return Promise.resolve({ ok: false, code: "invalid_message" });
    }

    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return Promise.resolve({ ok: false, code: denial ?? "forbidden" });
    }

    const product = toProductRequest(message);
    this.handledRequests.push(product);
    const revision = this.revision;
    this.revision += 1;

    return Promise.resolve({
      ok: true,
      reply: successReply(product, revision),
    });
  }
}
