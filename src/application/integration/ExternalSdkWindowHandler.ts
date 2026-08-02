/**
 * Application window-command handler (WU-02 / ADR-0027 / ADR-0013).
 *
 * Handshake (TOCTOU-safe, short critical section):
 * 1. Acquire aggregate lock + validate expectedRevision (hide) or serialize (show)
 * 2. Execute native show/hide via SdkNativeWindowPort (main BrowserWindow — short IPC)
 * 3. Advance once on success; reply.revision = post-success peek
 *
 * Does not hold the lock across UI modals. Native IPC is intentionally under the
 * same lock (no release-and-recheck) so visibility side effects cannot race the clock.
 * get-state is peek-only (no advance). Domain stays free of Electron.
 */

import type { CommandMessage } from "@softomnitel/omnicall-protocol";
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
import type { SdkNativeWindowPort } from "@ports/integration/SdkNativeWindowPort.js";

import {
  sdkCallSuccess,
  sdkFail,
} from "./externalSdkCallHelpers.js";
import type {
  SdkRevisionMutationOutcome,
  SdkSessionRevisionCoordinator,
} from "./SdkSessionRevisionCoordinator.js";

const WINDOW_COMMAND_TYPES = new Set<string>([
  "window:show",
  "window:hide",
  "window:get-state",
]);

export type ExternalSdkWindowHandlerOptions = Readonly<{
  windowPort: SdkNativeWindowPort;
  revisionCoordinator: SdkSessionRevisionCoordinator;
}>;

/**
 * Focused window surface for the single renderer composition broker path.
 */
export class ExternalSdkWindowHandler implements ExternalCommandHandler {
  private readonly windowPort: SdkNativeWindowPort;
  private readonly revisionCoordinator: SdkSessionRevisionCoordinator;

  constructor(options: ExternalSdkWindowHandlerOptions) {
    this.windowPort = options.windowPort;
    this.revisionCoordinator = options.revisionCoordinator;
  }

  handlesCommandType(commandType: string): boolean {
    return WINDOW_COMMAND_TYPES.has(commandType);
  }

  handleCommand(
    input: unknown,
    context?: ExternalCommandContext,
  ): Promise<ExternalHandlerResult> {
    void context;
    const validated = validateWireMessage(input);
    if (!validated.success) {
      return Promise.resolve(sdkFail(validated.code));
    }
    const message = validated.data;
    if (message.kind !== "command") {
      return Promise.resolve(sdkFail("invalid_message"));
    }
    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return Promise.resolve(sdkFail(denial ?? "forbidden"));
    }
    if (!this.handlesCommandType(message.type)) {
      return Promise.resolve(sdkFail("unsupported_command"));
    }
    return this.execute(message);
  }

  private execute(message: CommandMessage): Promise<ExternalHandlerResult> {
    if (message.type === "window:get-state") {
      return this.handleGetState();
    }
    if (message.type === "window:hide") {
      return this.revisionCoordinator.runMutationFromPayload(
        message.payload,
        () => this.runHide(),
      );
    }
    // window:show — protocol empty payload; serialize + advance without ER.
    return this.revisionCoordinator.runSerializedMutation(() => this.runShow());
  }

  private async handleGetState(): Promise<ExternalHandlerResult> {
    const native = await this.windowPort.getState();
    if (!native.ok) {
      return sdkFail(native.code);
    }
    return sdkCallSuccess(
      { visible: native.visible },
      this.revisionCoordinator.peek(),
    );
  }

  private async runShow(): Promise<SdkRevisionMutationOutcome> {
    const native = await this.windowPort.show();
    if (!native.ok) {
      return sdkFail(native.code);
    }
    return { ok: true, result: { visible: true } };
  }

  private async runHide(): Promise<SdkRevisionMutationOutcome> {
    const native = await this.windowPort.hide();
    if (!native.ok) {
      return sdkFail(native.code);
    }
    return { ok: true, result: { visible: false } };
  }
}
