/**
 * Focused Application probe for DI-02 broker delivery proof.
 * Accepts only `sdk:ping`. No call/operator/account product routers.
 */

import type { WireJsonObject } from "@axata/axatalk-protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axata/axatalk-protocol";
import type {
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";

function readPingNonce(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }
  const nonce = (payload as Record<string, unknown>)["nonce"];
  return typeof nonce === "string" ? nonce : undefined;
}

/**
 * Single composition handler instance used to prove main→renderer delivery.
 */
export class SdkBrokerProbeHandler implements ExternalCommandHandler {
  private revision = 1;
  private handleCount = 0;

  getHandleCount(): number {
    return this.handleCount;
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

    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return Promise.resolve({
        ok: false,
        code: denial ?? "forbidden",
        retryable: false,
      });
    }

    if (message.type !== "sdk:ping") {
      return Promise.resolve({
        ok: false,
        code: "unsupported_command",
        retryable: false,
      });
    }

    this.handleCount += 1;
    const revision = this.revision;
    this.revision += 1;
    const nonce = readPingNonce(message.payload);
    if (nonce === undefined) {
      return Promise.resolve({ ok: true, result: {}, revision });
    }
    const result: WireJsonObject = { nonce };
    return Promise.resolve({ ok: true, result, revision });
  }
}
