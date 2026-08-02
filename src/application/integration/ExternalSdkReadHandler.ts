/**
 * Application read-only SDK handler (DI-05): sdk:ping + sdk:get-snapshot.
 * Mutations (call/operator/account) stay on dedicated handlers (DI-06+).
 */

import type { WireJsonObject } from "@softomnitel/omnicall-protocol";
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

import { assembleSdkSnapshotProductSections } from "./ExternalSdkSnapshotAssembler.js";
import type { SdkProductStateReader } from "./ExternalSdkProductState.js";
import type { SdkCallOwnershipRegistry } from "./SdkCallOwnershipRegistry.js";
import type { SdkSessionRevisionCoordinator } from "./SdkSessionRevisionCoordinator.js";
import type { SdkNativeWindowPort } from "@ports/integration/SdkNativeWindowPort.js";

export type ExternalSdkReadHandlerOptions = Readonly<{
  readProductState: SdkProductStateReader;
  revisionCoordinator: SdkSessionRevisionCoordinator;
  ownership?: SdkCallOwnershipRegistry;
  nativeWindowPort?: SdkNativeWindowPort;
}>;

/**
 * Focused handler for the single renderer composition broker path.
 */
export class ExternalSdkReadHandler implements ExternalCommandHandler {
  private readonly revisionCoordinator: SdkSessionRevisionCoordinator;
  private readonly readProductState: SdkProductStateReader;
  private readonly ownership: SdkCallOwnershipRegistry | undefined;
  private readonly nativeWindowPort: SdkNativeWindowPort | undefined;

  constructor(options: ExternalSdkReadHandlerOptions) {
    this.readProductState = options.readProductState;
    this.revisionCoordinator = options.revisionCoordinator;
    this.ownership = options.ownership;
    this.nativeWindowPort = options.nativeWindowPort;
  }

  getRevision(): number {
    return this.revisionCoordinator.peek();
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
      return this.handleSnapshot();
    }
    return Promise.resolve({
      ok: false,
      code: "unsupported_command",
      retryable: false,
    });
  }

  private handlePing(payload: unknown): ExternalHandlerResult {
    // Reads must not advance — snapshot/ping revision is a valid next expectedRevision.
    const revision = this.revisionCoordinator.peek();
    const nonce = readPingNonce(payload);
    if (nonce === undefined) {
      return { ok: true, result: {}, revision };
    }
    return { ok: true, result: { nonce }, revision };
  }

  private handleSnapshot(): Promise<ExternalHandlerResult> {
    return this.revisionCoordinator.observe(async (revision) => {
      const ownership = this.ownership;
      const sections = assembleSdkSnapshotProductSections(
        this.readProductState(),
        ownership !== undefined
          ? {
              getOwnerClientId: (callId) => ownership.getOwnerClientId(callId),
            }
          : {},
      );
      const native =
        this.nativeWindowPort === undefined
          ? { ok: true as const, visible: false }
          : await this.nativeWindowPort.getState();
      if (!native.ok) {
        return { ok: false, code: native.code, retryable: false };
      }
      const result: WireJsonObject = {
        sections: {
          account: sections.account,
          registration: sections.registration,
          calls: [...sections.calls],
          ...(sections.operator !== undefined
            ? { operator: sections.operator }
            : {}),
        },
        windowVisible: native.visible,
      };
      return { ok: true, result, revision };
    });
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
