/**
 * Deterministic MainToRendererBrokerPort test double (DI-01).
 * No IPC, preload, or BrowserWindow. Validates `unknown` with protocol schemas.
 */

import type { ReplyMessage, WireJsonObject } from "@axatalk/protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axatalk/protocol";
import type {
  BrokerRequestResult,
  MainToRendererBrokerPort,
} from "@ports/integration/MainToRendererBrokerPort.js";

const MOCK_SERVER_INSTANCE_ID = "srv_mock_broker_001";
const MOCK_SESSION_EPOCH = "epoch_mock_broker_001";

function emptyResult(): WireJsonObject {
  return {};
}

function successReply(parts: {
  readonly requestId: string;
  readonly commandType: ReplyMessage extends { commandType: infer T }
    ? T
    : string;
  readonly result: WireJsonObject;
  readonly revision: number;
}): ReplyMessage {
  return {
    protocolVersion: 1,
    kind: "reply",
    ok: true,
    requestId: parts.requestId,
    commandType: parts.commandType,
    serverInstanceId: MOCK_SERVER_INSTANCE_ID,
    sessionEpoch: MOCK_SESSION_EPOCH,
    occurredAt: new Date().toISOString(),
    revision: parts.revision,
    result: parts.result,
  };
}

export class MockMainToRendererBroker implements MainToRendererBrokerPort {
  private ready = false;
  private revision = 1;
  private readonly handledRequestIds: string[] = [];

  setReady(ready: boolean): void {
    this.ready = ready;
  }

  isReady(): boolean {
    return this.ready;
  }

  getHandledRequestIds(): ReadonlyArray<string> {
    return this.handledRequestIds;
  }

  request(input: unknown): Promise<BrokerRequestResult> {
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

    this.handledRequestIds.push(message.requestId);
    const revision = this.revision;
    this.revision += 1;

    return Promise.resolve({
      ok: true,
      reply: successReply({
        requestId: message.requestId,
        commandType: message.type,
        result: emptyResult(),
        revision,
      }),
    });
  }
}
