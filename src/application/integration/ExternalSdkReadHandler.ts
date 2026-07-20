/**
 * Application read-only SDK handler (DI-05): sdk:ping + sdk:get-snapshot.
 * Mutations (call/operator/account) stay unsupported until later DI units.
 */

import type { WireJsonObject } from "@axatalk/protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axatalk/protocol";
import type {
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";

import { assembleSdkSnapshotProductSections } from "./ExternalSdkSnapshotAssembler.js";
import type { SdkProductStateReader } from "./ExternalSdkProductState.js";

export type ExternalSdkReadHandlerOptions = Readonly<{
  readProductState: SdkProductStateReader;
}>;

/**
 * Focused handler for the single renderer composition broker path.
 */
export class ExternalSdkReadHandler implements ExternalCommandHandler {
  private revision = 1;
  private readonly readProductState: SdkProductStateReader;

  constructor(options: ExternalSdkReadHandlerOptions) {
    this.readProductState = options.readProductState;
  }

  getRevision(): number {
    return this.revision;
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
    if (message.type === "sdk:ping") {
      return Promise.resolve(this.handlePing(message.payload));
    }
    if (message.type === "sdk:get-snapshot") {
      return Promise.resolve(this.handleSnapshot());
    }
    return Promise.resolve({
      ok: false,
      code: "unsupported_command",
      retryable: false,
    });
  }

  private handlePing(payload: unknown): ExternalHandlerResult {
    const revision = this.nextRevision();
    const nonce = readPingNonce(payload);
    if (nonce === undefined) {
      return { ok: true, result: {}, revision };
    }
    return { ok: true, result: { nonce }, revision };
  }

  private handleSnapshot(): ExternalHandlerResult {
    const sections = assembleSdkSnapshotProductSections(this.readProductState());
    const revision = this.nextRevision();
    const result: WireJsonObject = {
      sections: {
        account: sections.account,
        registration: sections.registration,
        calls: [...sections.calls],
        ...(sections.operator !== undefined
          ? { operator: sections.operator }
          : {}),
      },
    };
    return { ok: true, result, revision };
  }

  private nextRevision(): number {
    const revision = this.revision;
    this.revision += 1;
    return revision;
  }
}

function readPingNonce(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }
  if (!("nonce" in payload)) {
    return undefined;
  }
  const nonce = payload.nonce;
  return typeof nonce === "string" ? nonce : undefined;
}
