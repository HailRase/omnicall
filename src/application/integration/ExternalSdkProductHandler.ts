/**
 * Composite Application handler for SDK broker product commands (DI-05 + DI-06).
 * Routes read vs call surfaces; operator/account stay unsupported until DI-07/08.
 */

import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axatalk/protocol";
import type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";

import { ExternalSdkCallHandler } from "./ExternalSdkCallHandler.js";
import { ExternalSdkReadHandler } from "./ExternalSdkReadHandler.js";

export type ExternalSdkProductHandlerOptions = Readonly<{
  readHandler: ExternalSdkReadHandler;
  callHandler: ExternalSdkCallHandler;
}>;

export class ExternalSdkProductHandler implements ExternalCommandHandler {
  private readonly readHandler: ExternalSdkReadHandler;
  private readonly callHandler: ExternalSdkCallHandler;

  constructor(options: ExternalSdkProductHandlerOptions) {
    this.readHandler = options.readHandler;
    this.callHandler = options.callHandler;
  }

  getRevision(): number {
    return this.readHandler.getRevision();
  }

  handleCommand(
    input: unknown,
    context?: ExternalCommandContext,
  ): Promise<ExternalHandlerResult> {
    const validated = validateWireMessage(input);
    if (!validated.success) {
      return Promise.resolve({
        ok: false,
        code: validated.code,
        retryable: false,
      });
    }
    const message = validated.data;
    if (message.kind !== "command") {
      return Promise.resolve({
        ok: false,
        code: "invalid_message",
        retryable: false,
      });
    }
    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return Promise.resolve({
        ok: false,
        code: denial ?? "forbidden",
        retryable: false,
      });
    }
    if (this.callHandler.handlesCommandType(message.type)) {
      return this.callHandler.handleCommand(message, context);
    }
    if (
      message.type === "sdk:ping" ||
      message.type === "sdk:get-snapshot"
    ) {
      return this.readHandler.handleCommand(message, context);
    }
    return Promise.resolve({
      ok: false,
      code: "unsupported_command",
      retryable: false,
    });
  }
}
