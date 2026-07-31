/**
 * Deterministic ExternalCommandHandler / ExternalQueryHandler doubles (DI-01).
 * Fail closed on invalid `unknown` input. No Domain, SIP, or OCP side effects.
 */

import type { WireJsonObject } from "@softomnitel/omnicall-protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@softomnitel/omnicall-protocol";
import type {
  ExternalCommandHandler,
  ExternalHandlerResult,
  ExternalQueryHandler,
} from "@ports/integration/ExternalCommandHandler.js";

const SNAPSHOT_QUERY_TYPES = new Set<string>([
  "sdk:get-snapshot",
  "window:get-state",
  "operator:get-reasons",
]);

function emptyResult(): WireJsonObject {
  return {};
}

export class MockExternalCommandHandler implements ExternalCommandHandler {
  private revision = 1;
  private readonly handledTypes: string[] = [];

  getHandledTypes(): ReadonlyArray<string> {
    return this.handledTypes;
  }

  handleCommand(input: unknown): Promise<ExternalHandlerResult> {
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

    if (SNAPSHOT_QUERY_TYPES.has(message.type)) {
      return Promise.resolve({
        ok: false,
        code: "unsupported_command",
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

    this.handledTypes.push(message.type);
    const revision = this.revision;
    this.revision += 1;
    return Promise.resolve({ ok: true, result: emptyResult(), revision });
  }
}

export class MockExternalQueryHandler implements ExternalQueryHandler {
  private revision = 1;
  private readonly handledTypes: string[] = [];

  getHandledTypes(): ReadonlyArray<string> {
    return this.handledTypes;
  }

  handleQuery(input: unknown): Promise<ExternalHandlerResult> {
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

    if (!SNAPSHOT_QUERY_TYPES.has(message.type)) {
      return Promise.resolve({
        ok: false,
        code: "unsupported_command",
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

    this.handledTypes.push(message.type);
    const revision = this.revision;
    this.revision += 1;
    return Promise.resolve({ ok: true, result: emptyResult(), revision });
  }
}
