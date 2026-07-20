/**
 * Composite Application handler for SDK broker product commands (DI-05…DI-08).
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

import { ExternalSdkAccountHandler } from "./ExternalSdkAccountHandler.js";
import { ExternalSdkCallHandler } from "./ExternalSdkCallHandler.js";
import { ExternalSdkOperatorHandler } from "./ExternalSdkOperatorHandler.js";
import { ExternalSdkReadHandler } from "./ExternalSdkReadHandler.js";

export type ExternalSdkProductHandlerOptions = Readonly<{
  readHandler: ExternalSdkReadHandler;
  callHandler: ExternalSdkCallHandler;
  operatorHandler: ExternalSdkOperatorHandler;
  accountHandler: ExternalSdkAccountHandler;
}>;

export class ExternalSdkProductHandler implements ExternalCommandHandler {
  private readonly readHandler: ExternalSdkReadHandler;
  private readonly callHandler: ExternalSdkCallHandler;
  private readonly operatorHandler: ExternalSdkOperatorHandler;
  private readonly accountHandler: ExternalSdkAccountHandler;

  constructor(options: ExternalSdkProductHandlerOptions) {
    this.readHandler = options.readHandler;
    this.callHandler = options.callHandler;
    this.operatorHandler = options.operatorHandler;
    this.accountHandler = options.accountHandler;
  }

  getRevision(): number {
    return this.readHandler.getRevision();
  }

  /**
   * Disconnect/revoke cleanup: abandon pending logout tokens for client.
   * Does not end SIP calls or account sessions (ADR-0017 O-OWN-1).
   */
  abortClientSession(clientId: string): number {
    return this.operatorHandler.clearPendingLogoutsForClient(clientId);
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
