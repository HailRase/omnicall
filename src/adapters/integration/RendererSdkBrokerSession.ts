/**
 * Renderer-side SDK broker session (DI-02).
 * Validates inbound IPC, dispatches to one Application handler, replies to main.
 */

import type {
  CommandMessage,
  ProtocolErrorCode,
  ReplyMessage,
  WireJsonObject,
} from "@axatalk/protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axatalk/protocol";
import type {
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";
import type {
  SdkBrokerReplyIpcPayload,
  SdkBrokerRequestIpcPayload,
} from "@shared/ipc/SdkBrokerContract.js";
import { parseSdkBrokerRequestIpcPayload } from "@shared/ipc/SdkBrokerContract.js";

export type RendererSdkBrokerSessionOptions = Readonly<{
  handler: ExternalCommandHandler;
  serverInstanceId: string;
  sessionEpoch: string;
  createOccurredAt?: () => string;
}>;

function failureReply(
  brokerRequestId: string,
  code: ProtocolErrorCode,
  currentRevision?: number,
): SdkBrokerReplyIpcPayload {
  return {
    brokerRequestId,
    ok: false,
    code,
    ...(currentRevision !== undefined ? { currentRevision } : {}),
  };
}

function buildSuccessReply(
  command: CommandMessage,
  result: WireJsonObject,
  revision: number,
  serverInstanceId: string,
  sessionEpoch: string,
  occurredAt: string,
): ReplyMessage {
  return {
    protocolVersion: 1,
    kind: "reply",
    ok: true,
    requestId: command.requestId,
    commandType: command.type,
    serverInstanceId,
    sessionEpoch,
    occurredAt,
    revision,
    result,
  };
}

export class RendererSdkBrokerSession {
  private readonly handler: ExternalCommandHandler;
  private readonly serverInstanceId: string;
  private readonly sessionEpoch: string;
  private readonly createOccurredAt: () => string;
  private active = false;

  constructor(options: RendererSdkBrokerSessionOptions) {
    this.handler = options.handler;
    this.serverInstanceId = options.serverInstanceId;
    this.sessionEpoch = options.sessionEpoch;
    this.createOccurredAt =
      options.createOccurredAt ?? (() => new Date().toISOString());
  }

  isActive(): boolean {
    return this.active;
  }

  markActive(): void {
    this.active = true;
  }

  markInactive(): void {
    this.active = false;
  }

  async handleRequest(input: unknown): Promise<SdkBrokerReplyIpcPayload> {
    const envelope = parseSdkBrokerRequestIpcPayload(input);
    if (envelope === null) {
      return {
        brokerRequestId: "invalid",
        ok: false,
        code: "invalid_message",
      };
    }

    if (!this.active) {
      return failureReply(envelope.brokerRequestId, "not_ready");
    }

    return this.dispatch(envelope);
  }

  private async dispatch(
    envelope: SdkBrokerRequestIpcPayload,
  ): Promise<SdkBrokerReplyIpcPayload> {
    const validated = validateWireMessage(envelope.command);
    if (!validated.success) {
      return failureReply(envelope.brokerRequestId, validated.code);
    }

    const message = validated.data;
    if (message.kind !== "command") {
      return failureReply(envelope.brokerRequestId, "invalid_message");
    }

    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return failureReply(envelope.brokerRequestId, denial ?? "forbidden");
    }

    const handlerResult = await this.handler.handleCommand(message, {
      ...(envelope.clientId !== undefined
        ? { clientId: envelope.clientId }
        : {}),
    });
    return this.toIpcReply(envelope.brokerRequestId, message, handlerResult);
  }

  private toIpcReply(
    brokerRequestId: string,
    command: CommandMessage,
    handlerResult: ExternalHandlerResult,
  ): SdkBrokerReplyIpcPayload {
    if (!handlerResult.ok) {
      return failureReply(
        brokerRequestId,
        handlerResult.code,
        handlerResult.currentRevision,
      );
    }

    const revision = handlerResult.revision ?? 1;
    const reply = buildSuccessReply(
      command,
      handlerResult.result,
      revision,
      this.serverInstanceId,
      this.sessionEpoch,
      this.createOccurredAt(),
    );

    const replyValidated = validateWireMessage(reply);
    if (!replyValidated.success || replyValidated.data.kind !== "reply") {
      return failureReply(brokerRequestId, "operation_failed");
    }

    return {
      brokerRequestId,
      ok: true,
      reply: replyValidated.data,
    };
  }
}
