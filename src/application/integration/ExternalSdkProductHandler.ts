/**
 * Composite Application handler for SDK broker product commands (DI-05…DI-08).
 */

import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@softomnitel/omnicall-protocol";
import type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";

import { ExternalSdkAccountHandler } from "./ExternalSdkAccountHandler.js";
import { ExternalSdkCallHandler } from "./ExternalSdkCallHandler.js";
import { ExternalSdkOperatorHandler } from "./ExternalSdkOperatorHandler.js";
import { ExternalSdkReadHandler } from "./ExternalSdkReadHandler.js";
import { ExternalSdkWindowHandler } from "./ExternalSdkWindowHandler.js";

export type ExternalSdkProductHandlerOptions = Readonly<{
  readHandler: ExternalSdkReadHandler;
  callHandler: ExternalSdkCallHandler;
  operatorHandler: ExternalSdkOperatorHandler;
  accountHandler: ExternalSdkAccountHandler;
  windowHandler: ExternalSdkWindowHandler;
}>;

export class ExternalSdkProductHandler implements ExternalCommandHandler {
  private readonly readHandler: ExternalSdkReadHandler;
  private readonly callHandler: ExternalSdkCallHandler;
  private readonly operatorHandler: ExternalSdkOperatorHandler;
  private readonly accountHandler: ExternalSdkAccountHandler;
  private readonly windowHandler: ExternalSdkWindowHandler;

  constructor(options: ExternalSdkProductHandlerOptions) {
    this.readHandler = options.readHandler;
    this.callHandler = options.callHandler;
    this.operatorHandler = options.operatorHandler;
    this.accountHandler = options.accountHandler;
    this.windowHandler = options.windowHandler;
  }

  getRevision(): number {
    return this.readHandler.getRevision();
  }

  /** Cancel activation work owned by one authenticated Origin + clientId. */
  abortClientSession(origin: string, clientId: string): number {
    return this.accountHandler.abortClientSession(origin, clientId);
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
    if (this.windowHandler.handlesCommandType(message.type)) {
      return this.windowHandler.handleCommand(message, context);
    }
    if (this.accountHandler.handlesCommandType(message.type)) {
      return this.accountHandler.handleCommand(message, context);
    }
    if (this.callHandler.handlesCommandType(message.type)) {
      return this.callHandler.handleCommand(message, context);
    }
    if (this.operatorHandler.handlesCommandType(message.type)) {
      return this.operatorHandler.handleCommand(message, context);
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
