/**
 * Application read-only SDK handler (DI-05): sdk:ping + sdk:get-snapshot.
 * Mutations (call/operator/account) stay on dedicated handlers (DI-06+).
 */

import type { WireJsonObject } from "@axata/axatalk-protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axata/axatalk-protocol";
import type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";

import { assembleSdkSnapshotProductSections } from "./ExternalSdkSnapshotAssembler.js";
import type { SdkProductStateReader } from "./ExternalSdkProductState.js";
import type { SdkCallOwnershipRegistry } from "./SdkCallOwnershipRegistry.js";
import {
  SdkSessionRevisionClock,
} from "./SdkSessionRevisionClock.js";

export type ExternalSdkReadHandlerOptions = Readonly<{
  readProductState: SdkProductStateReader;
  revisionClock?: SdkSessionRevisionClock;
  ownership?: SdkCallOwnershipRegistry;
}>;

/**
 * Focused handler for the single renderer composition broker path.
 */
export class ExternalSdkReadHandler implements ExternalCommandHandler {
  private readonly revisionClock: SdkSessionRevisionClock;
  private readonly readProductState: SdkProductStateReader;
  private readonly ownership: SdkCallOwnershipRegistry | undefined;

  constructor(options: ExternalSdkReadHandlerOptions) {
    this.readProductState = options.readProductState;
    this.revisionClock = options.revisionClock ?? new SdkSessionRevisionClock();
    this.ownership = options.ownership;
  }

  getRevision(): number {
    return this.revisionClock.peek();
  }

  handleCommand(
    input: unknown,
    context?: ExternalCommandContext,
  ): Promise<ExternalHandlerResult> {
    void context;
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
    // Reads must not advance — snapshot/ping revision is a valid next expectedRevision.
    const revision = this.revisionClock.peek();
    const nonce = readPingNonce(payload);
    if (nonce === undefined) {
      return { ok: true, result: {}, revision };
    }
    return { ok: true, result: { nonce }, revision };
  }

  private handleSnapshot(): ExternalHandlerResult {
    const ownership = this.ownership;
    const sections = assembleSdkSnapshotProductSections(
      this.readProductState(),
      ownership !== undefined
        ? {
            getOwnerClientId: (callId) => ownership.getOwnerClientId(callId),
          }
        : {},
    );
    const revision = this.revisionClock.peek();
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
