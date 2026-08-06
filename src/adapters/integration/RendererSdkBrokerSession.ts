/**
 * Renderer-side SDK broker session (DI-02).
 * Validates inbound IPC, dispatches to one Application handler, replies to main.
 */

import type {
  CommandMessage,
  ProtocolErrorCode,
  ReplyMessage,
  WireJsonObject,
} from "@softomnitel/omnicall-protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@softomnitel/omnicall-protocol";
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
  details?: WireJsonObject,
): SdkBrokerReplyIpcPayload {
  return {
    brokerRequestId,
    ok: false,
    code,
    ...(currentRevision !== undefined ? { currentRevision } : {}),
    ...(details !== undefined ? { details } : {}),
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
  private readonly cancellations = new Map<string, AbortController>();
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
    for (const controller of this.cancellations.values()) {
      controller.abort();
    }
    this.cancellations.clear();
  }

  cancelRequest(brokerRequestId: string): boolean {
    const controller = this.cancellations.get(brokerRequestId);
    if (controller === undefined) {
      return false;
    }
    controller.abort();
    return true;
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

    const controller = new AbortController();
    this.cancellations.set(envelope.brokerRequestId, controller);
    try {
      return await this.dispatch(envelope, controller.signal);
    } finally {
      this.cancellations.delete(envelope.brokerRequestId);
    }
  }

  private async dispatch(
    envelope: SdkBrokerRequestIpcPayload,
    signal: AbortSignal,
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

    if (signal.aborted) {
      return failureReply(envelope.brokerRequestId, "operation_failed");
    }
    const handlerResult = await this.handler.handleCommand(message, {
      ...(envelope.clientId !== undefined
        ? { clientId: envelope.clientId }
        : {}),
      ...(envelope.origin !== undefined ? { origin: envelope.origin } : {}),
      signal,
    });
    if (signal.aborted) {
      return failureReply(envelope.brokerRequestId, "operation_failed");
    }
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
        handlerResult.details,
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
